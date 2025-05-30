import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const validatedData = updateStatusSchema.parse(body);

    // Get the sell request to check its current status
    const sellRequest = await prisma.sellRequest.findUnique({
      where: { id },
      include: { plot: true },
    });

    if (!sellRequest) {
      return NextResponse.json(
        { error: "Sell request not found" },
        { status: 404 }
      );
    }

    if (sellRequest.status !== "pending") {
      return NextResponse.json(
        { error: "Sell request is already processed" },
        { status: 400 }
      );
    }

    // Update the sell request status and plot status in a transaction
    const [updatedRequest] = await prisma.$transaction([
      prisma.sellRequest.update({
        where: { id },
        data: { status: validatedData.status },
      }),
      prisma.plot.update({
        where: { id: sellRequest.plotId },
        data: {
          status: validatedData.status === "approved" ? "AVAILABLE" : "SOLD",
          ownerId:
            validatedData.status === "approved" ? null : sellRequest.userId,
        },
      }),
    ]);

    return NextResponse.json(updatedRequest);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating sell request:", error);
    return NextResponse.json(
      { error: "Failed to update sell request" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  try {
    const sellRequest = await prisma.sellRequest.delete({
      where: { id },
    });

    return NextResponse.json(sellRequest);
  } catch (error) {
    console.error("Error deleting sell request:", error);
    return NextResponse.json(
      { error: "Failed to delete sell request" },
      { status: 500 }
    );
  }
}
