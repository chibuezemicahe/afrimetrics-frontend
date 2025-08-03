import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const topLosers = await prisma.stock.findMany({
      where: {
        market: 'NGX',
        is_active: true,
        percentChange: {
          lt: 0 // Only negative changes
        }
      },
      orderBy: {
        percentChange: 'asc'
      },
      take: limit,
      select: {
        id: true,
        symbol: true,
        name: true,
        price: true,
        change: true,
        percentChange: true,
        volume: true,
        value: true,
        trades: true,
        sector: true,
        market: true,  // Added missing field
        logo: true     // Added missing field
      }
    });

    // Convert BigInt trades to number
    const serializedTopLosers = topLosers.map(stock => ({
      ...stock,
      trades: Number(stock.trades)
    }));

    return NextResponse.json({
      success: true,
      data: serializedTopLosers,
      count: serializedTopLosers.length
    });
  } catch (error) {
    console.error('Error fetching top losers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch top losers' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}