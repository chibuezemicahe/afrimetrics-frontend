import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sortBy') || 'percentChange';
    const order = searchParams.get('order') || 'desc';

    // Get latest stock data for NGX market
    const stocks = await prisma.stock.findMany({
      where: {
        market: 'NGX',
        is_active: true
      },
      orderBy: {
        [sortBy]: order as 'asc' | 'desc'
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
        market: true,
        updatedAt: true
      }
    });

    // Convert BigInt trades to number
    const serializedStocks = stocks.map(stock => ({
      ...stock,
      trades: Number(stock.trades)
    }));

    return NextResponse.json({
      success: true,
      data: serializedStocks,
      count: serializedStocks.length
    });
  } catch (error) {
    console.error('Error fetching NGX stocks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch NGX stocks' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}