

// With these lines:
import { prisma } from '../src/lib/prisma';
import * as fs from 'fs';

// No need to instantiate a new PrismaClient

interface DuplicateGroup {
  cleanedSymbol: string;
  stockIds: string[];
}

interface MergeResult {
  symbol: string;
  keptId: string;
  keptHistoryCount: number;
  mergedIds: string[];
  movedRecordsCount: number;
  success: boolean;
  error?: string;
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`Running in ${isDryRun ? 'DRY RUN' : 'LIVE'} mode`);
  
  // Get all duplicate groups
  const duplicateGroups = await findDuplicateStocks();
  console.log(`Found ${duplicateGroups.length} duplicate symbol groups`);
  
  const results: MergeResult[] = [];
  
  // Process each duplicate group
  for (const group of duplicateGroups) {
    console.log(`\n🔍 Processing duplicate group: ${group.cleanedSymbol}`);
    console.log(`  Stock IDs: ${group.stockIds.join(', ')}`);
    
    try {
      const result = await processDuplicateGroup(group, isDryRun);
      results.push(result);
      
      if (result.success) {
        console.log(`✅ Successfully processed ${group.cleanedSymbol}`);
        console.log(`  Kept ID: ${result.keptId} (${result.keptHistoryCount} history records)`);
        console.log(`  Moved ${result.movedRecordsCount} records from ${result.mergedIds.length} duplicate(s)`);
        console.log(`  Deleted IDs: ${result.mergedIds.join(', ')}`);
      } else {
        console.log(`❌ Failed to process ${group.cleanedSymbol}: ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${group.cleanedSymbol}:`, error);
      results.push({
        symbol: group.cleanedSymbol,
        keptId: '',
        keptHistoryCount: 0,
        mergedIds: [],
        movedRecordsCount: 0,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  // Generate summary report
  const successCount = results.filter(r => r.success).length;
  const failCount = results.length - successCount;
  const totalMovedRecords = results.reduce((sum, r) => sum + r.movedRecordsCount, 0);
  const totalDeletedStocks = results.reduce((sum, r) => sum + r.mergedIds.length, 0);
  
  console.log('\n📊 SUMMARY REPORT');
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes made)' : 'LIVE (changes applied)'}`);
  console.log(`Total duplicate groups processed: ${results.length}`);
  console.log(`Successful merges: ${successCount}`);
  console.log(`Failed merges: ${failCount}`);
  console.log(`Total history records reassigned: ${totalMovedRecords}`);
  console.log(`Total duplicate stocks removed: ${totalDeletedStocks}`);
  
  // Save detailed log to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFileName = `merge-stocks-${timestamp}${isDryRun ? '-dry-run' : ''}.json`;
  fs.writeFileSync(logFileName, JSON.stringify(results, null, 2));
  console.log(`\nDetailed log saved to ${logFileName}`);
}

async function findDuplicateStocks(): Promise<DuplicateGroup[]> {
  // Query to find duplicate stocks based on cleaned symbol
  const duplicates = await prisma.$queryRaw<Array<{cleaned_symbol: string, stock_ids: string}>>`
    SELECT 
      REPLACE(REPLACE(symbol, ' [MRF]', ''), ' [BLS]', '') AS cleaned_symbol, 
      GROUP_CONCAT(id) AS stock_ids 
    FROM Stock 
    WHERE market = 'NGX' 
    GROUP BY cleaned_symbol 
    HAVING COUNT(*) > 1
  `;
  
  return duplicates.map(dup => ({
    cleanedSymbol: dup.cleaned_symbol,
    stockIds: dup.stock_ids.split(',')
  }));
}

async function processDuplicateGroup(
  group: DuplicateGroup, 
  isDryRun: boolean
): Promise<MergeResult> {
  // Get history counts for each stock ID
  const stocksWithHistoryCounts = await Promise.all(
    group.stockIds.map(async (stockId) => {
      const count = await prisma.stockHistory.count({
        where: { stockId }
      });
      
      // Get the full stock record for logging
      const stock = await prisma.stock.findUnique({
        where: { id: stockId }
      });
      
      return {
        id: stockId,
        historyCount: count,
        symbol: stock?.symbol || 'Unknown'
      };
    })
  );
  
  // Sort by history count (descending) to find the one with most history
  stocksWithHistoryCounts.sort((a, b) => b.historyCount - a.historyCount);
  
  // The stock with the most history data will be kept
  const stockToKeep = stocksWithHistoryCounts[0];
  const stocksToMerge = stocksWithHistoryCounts.slice(1);
  
  console.log(`  Stock to keep: ${stockToKeep.id} (${stockToKeep.symbol}) with ${stockToKeep.historyCount} history records`);
  console.log(`  Stocks to merge: ${stocksToMerge.map(s => `${s.id} (${s.symbol}) with ${s.historyCount} records`).join(', ')}`);
  
  if (isDryRun) {
    console.log('  DRY RUN: Skipping actual database operations');
    return {
      symbol: group.cleanedSymbol,
      keptId: stockToKeep.id,
      keptHistoryCount: stockToKeep.historyCount,
      mergedIds: stocksToMerge.map(s => s.id),
      movedRecordsCount: stocksToMerge.reduce((sum, s) => sum + s.historyCount, 0),
      success: true
    };
  }
  
  let totalMovedRecords = 0;
  const mergedIds: string[] = [];
  
  // Process each stock to merge
  for (const stockToMerge of stocksToMerge) {
    try {
      // Start a transaction for safety
      const result = await prisma.$transaction(async (tx) => {
        // 1. Update all history records to point to the stock we're keeping
        const updateResult = await tx.stockHistory.updateMany({
          where: { stockId: stockToMerge.id },
          data: { stockId: stockToKeep.id }
        });
        
        // 2. Delete the duplicate stock record
        await tx.stock.delete({
          where: { id: stockToMerge.id }
        });
        
        return updateResult.count;
      });
      
      totalMovedRecords += result;
      mergedIds.push(stockToMerge.id);
      console.log(`  ✓ Merged ${stockToMerge.id} into ${stockToKeep.id}, moved ${result} records`);
    } catch (error) {
      console.error(`  ✗ Failed to merge ${stockToMerge.id}:`, error);
      return {
        symbol: group.cleanedSymbol,
        keptId: stockToKeep.id,
        keptHistoryCount: stockToKeep.historyCount,
        mergedIds,
        movedRecordsCount: totalMovedRecords,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  return {
    symbol: group.cleanedSymbol,
    keptId: stockToKeep.id,
    keptHistoryCount: stockToKeep.historyCount,
    mergedIds,
    movedRecordsCount: totalMovedRecords,
    success: true
  };
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });