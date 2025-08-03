import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const topGainers = await prisma.stock.findMany({
      where: {
        market: 'NGX',
        is_active: true,
        percentChange: {
          gt: 0 // Only positive changes
        }
      },
      orderBy: {
        percentChange: 'desc'
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
        sector: true
      }
    });

    // Convert BigInt trades to number
    const serializedTopGainers = topGainers.map(stock => ({
      ...stock,
      trades: Number(stock.trades)
    }));

    return NextResponse.json({
      success: true,
      data: serializedTopGainers,
      count: serializedTopGainers.length
    });
  } catch (error) {
    console.error('Error fetching top gainers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch top gainers' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}