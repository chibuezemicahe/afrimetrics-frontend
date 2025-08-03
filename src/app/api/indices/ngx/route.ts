import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const indices = await prisma.marketIndex.findMany({
      where: {
        market: 'NGX'
      },
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        value: true,
        change: true,
        percentChange: true,
        market: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      data: indices,
      count: indices.length
    });
  } catch (error) {
    console.error('Error fetching NGX indices:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch NGX indices' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}