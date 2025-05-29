import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const updated = await prisma.visitRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        qrCode: null,
        expiresAt: null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[ADMIN_REJECT_VISIT]", error);
    return new NextResponse("Rejection failed", { status: 500 });
  }
}
