import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { indexId: string } }
) {
  try {
    const { indexId } = params;

    const index = await prisma.marketIndex.findFirst({
      where: {
        id: indexId,
        market: 'NGX'
      },
      select: {
        id: true,
        name: true,
        value: true,
        change: true,
        percentChange: true,
        market: true,
        updatedAt: true,
        history: {
          orderBy: {
            date: 'desc'
          },
          take: 30, // Last 30 days of history
          select: {
            date: true,
            value: true,
            change: true,
            percentChange: true
          }
        }
      }
    });

    if (!index) {
      return NextResponse.json(
        { success: false, error: 'Index not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: index
    });
  } catch (error) {
    console.error('Error fetching NGX index:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch NGX index' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}