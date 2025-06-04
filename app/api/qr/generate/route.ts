// File: app/api/qrcode/generate/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function POST(req: NextRequest) {
  try {
    const { landId } = await req.json();

    if (!landId) {
      return NextResponse.json({ error: "Missing landId" }, { status: 400 });
    }

    const land = await prisma.land.findUnique({
      where: { id: landId },
      include: {
        owner: true,
        plot: true,
      },
    });

    if (!land || !land.owner || !land.plot) {
      return NextResponse.json({ error: "Invalid land or owner" }, { status: 404 });
    }

    // Build payload
    const payload = {
      landId: land.id,
      landNumber: land.number,
      size: land.size,
      plotId: land.plotId,
      plotTitle: land.plot.title,
      ownerClerkId: land.owner.clerkId,
    };

    const qrData = JSON.stringify(payload);

    // Generate QR as Data URL
    const qrCodeUrl = await QRCode.toDataURL(qrData);

    // Save to DB
    await prisma.land.update({
      where: { id: land.id },
      data: { qrCode: qrCodeUrl },
    });

    return NextResponse.json({ success: true, qrCodeUrl });
  } catch (err) {
    console.error("QR generation failed", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
