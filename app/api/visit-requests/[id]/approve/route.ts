// app/api/visit-requests/[id]/approve/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const visit = await prisma.visitRequest.findUnique({ where: { id } });

    if (!visit) {
      return NextResponse.json(
        { error: "Visit request not found" },
        { status: 404 }
      );
    }

    // Generate QR payload
    const qrPayload = {
      name: visit.name,
      plotId: visit.plotId,
      visitId: visit.id,
      validTill: new Date(Date.now() + 1000 * 60 * 60).toISOString(), // 1 hour from now
    };

    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload));

    const updated = await prisma.visitRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        qrCode: qrCodeDataUrl,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour expiry
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
