import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = params;

    const stock = await prisma.stock.findFirst({
      where: {
        symbol: symbol.toUpperCase(),
        market: 'NGX',
        is_active: true
      },
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

    if (!stock) {
      return NextResponse.json(
        { success: false, error: 'Stock not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: stock
    });
  } catch (error) {
    console.error('Error fetching NGX stock:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch NGX stock' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}