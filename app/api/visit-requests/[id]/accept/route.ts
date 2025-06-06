import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { clerkId } = await request.json();

  try {
    // Verify the manager is assigned to this request
    const visitRequest = await prisma.visitRequest.findFirst({
      where: {
        id,
        assignedManager: {
          clerkId: clerkId,
        },
        status: "ASSIGNED",
      },
    });

    if (!visitRequest) {
      return NextResponse.json(
        { error: "Visit request not found or unauthorized" },
        { status: 404 }
      );
    }

    // Generate QR payload
    const qrPayload = {
      name: visitRequest.name,
      plotId: visitRequest.plotId,
      visitId: visitRequest.id,
      validTill: new Date(Date.now() + 1000 * 60 * 60).toISOString(), // 1 hour from now
    };

    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload));

    // Update the request status to APPROVED
    const updated = await prisma.visitRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        qrCode: qrCodeDataUrl,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour expiry
      },
      include: {
        user: true,
        plot: true,
        assignedManager: true,
      },
    });

    // Create notification for the user
    if (updated.user) {
      await prisma.notification.create({
        data: {
          type: "VISIT_REQUEST_APPROVED",
          title: "Visit Request Approved",
          message: `Your visit request for ${updated.plot.title} has been approved. You can now use the QR code to access the property.`,
          userId: updated.user.id,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error accepting visit request:", error);
    return NextResponse.json(
      { error: "Failed to accept visit request" },
      { status: 500 }
    );
  }
}
