import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateQRCode } from '@/lib/utils';

// POST: Assign plot to client
export async function POST(req: Request) {
  const { clientId, plotId, cameraIp } = await req.json();
  
  try {
    // Generate QR code for plot
    const qrCode = await generateQRCode(plotId);
    
    const updatedPlot = await prisma.plot.update({
      where: { id: plotId },
      data: {
        clientId,
        cameraIp,
        qrCode,
        status: 'ASSIGNED'
      }
    });
    
    return NextResponse.json(updatedPlot);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to assign plot" },
      { status: 500 }
    );
  }
}