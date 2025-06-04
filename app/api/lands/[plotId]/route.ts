import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { plotId: string } }
) {
  try {
    const lands = await prisma.land.findMany({
      where: { plotId: params.plotId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(lands);
  } catch (error) {
    console.error('Failed to get lands:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}