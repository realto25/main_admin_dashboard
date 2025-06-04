import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ plotId: string }> }
) {
  try {
    // Await the params Promise
    const { plotId } = await params;
    
    const lands = await prisma.land.findMany({
      where: { plotId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(lands);
  } catch (error) {
    console.error('Failed to get lands:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ plotId: string }> }
) {
  try {
    // Await the params Promise
    const { plotId } = await params;
    const body = await req.json();
    const { ownerId, landId } = body; // Expect landId in the request body

    if (!ownerId) {
      return NextResponse.json({ error: "ownerId is required" }, { status: 400 });
    }

    if (!landId) {
      return NextResponse.json({ error: "landId is required" }, { status: 400 });
    }

    // First verify the land belongs to the specified plotId
    const existingLand = await prisma.land.findFirst({
      where: { 
        id: landId,
        plotId: plotId 
      }
    });

    if (!existingLand) {
      return NextResponse.json({ error: "Land not found in this plot" }, { status: 404 });
    }

    // Update using the unique id
    const updated = await prisma.land.update({
      where: { id: landId },
      data: { ownerId },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update land:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}