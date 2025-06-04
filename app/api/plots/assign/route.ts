import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import QRCode from "qrcode";

// POST: Assign plot to client
export async function POST(req: Request) {
  const { clientId, plotId, cameraIp, cameraLabel } = await req.json();

  try {
    // Generate QR code for plot
    const qrCodeUrl = await QRCode.toDataURL(plotId);

    // First update the plot
    const updatedPlot = await prisma.plot.update({
      where: { id: plotId },
      data: {
        ownerId: clientId,
        status: "ADVANCE", // Using PlotStatus enum value
      },
    });

    // If camera IP is provided, create/update camera
    if (cameraIp) {
      // Find a land in this plot to attach the camera to
      const land = await prisma.land.findFirst({
        where: { plotId },
      });

      if (land) {
        await prisma.camera.upsert({
          where: { landId: land.id },
          update: {
            ipAddress: cameraIp,
            label: cameraLabel,
          },
          create: {
            landId: land.id,
            ipAddress: cameraIp,
            label: cameraLabel,
          },
        });
      }
    }

    return NextResponse.json(updatedPlot);
  } catch (error) {
    console.error("Failed to assign plot:", error);
    return NextResponse.json(
      { error: "Failed to assign plot" },
      { status: 500 }
    );
  }
}
