import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { clerkId, reason } = await request.json();

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
      include: {
        user: true,
        plot: true,
      },
    });

    if (!visitRequest) {
      return NextResponse.json(
        { error: "Visit request not found or unauthorized" },
        { status: 404 }
      );
    }

    // Update the request status to REJECTED
    const updated = await prisma.visitRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectionReason: reason || "Rejected by manager",
        qrCode: null,
        expiresAt: null,
      },
    });

    // Create notification for the user
    if (visitRequest.user) {
      await prisma.notification.create({
        data: {
          type: "VISIT_REQUEST_REJECTED",
          title: "Visit Request Rejected",
          message: `Your visit request for ${
            visitRequest.plot.title
          } has been rejected. ${reason ? `Reason: ${reason}` : ""}`,
          userId: visitRequest.user.id,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error rejecting visit request:", error);
    return NextResponse.json(
      { error: "Failed to reject visit request" },
      { status: 500 }
    );
  }
}
