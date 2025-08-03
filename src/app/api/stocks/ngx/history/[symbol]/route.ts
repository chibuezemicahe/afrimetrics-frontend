import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');
    const days = parseInt(searchParams.get('days') || '30');

    // First find the stock
    const stock = await prisma.stock.findFirst({
      where: {
        symbol: symbol.toUpperCase(),
        market: 'NGX',
        is_active: true
      },
      select: {
        id: true,
        symbol: true,
        name: true
      }
    });

    if (!stock) {
      return NextResponse.json(
        { success: false, error: 'Stock not found' },
        { status: 404 }
      );
    }

    // Get stock history
    const history = await prisma.stockHistory.findMany({
      where: {
        stockId: stock.id,
        date: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: limit,
      select: {
        date: true,
        price: true,
        change: true,
        percentChange: true,
        volume: true,
        value: true,
        trades: true,
        source: true,
        sector: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        stock: {
          symbol: stock.symbol,
          name: stock.name
        },
        history: history
      },
      count: history.length
    });
  } catch (error) {
    console.error('Error fetching stock history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stock history' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}