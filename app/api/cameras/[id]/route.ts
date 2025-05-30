import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateCameraSchema = z.object({
  ipAddress: z.string().ip(),
  label: z.string().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const body = await request.json();
    const validatedData = updateCameraSchema.parse(body);

    const camera = await prisma.camera.update({
      where: { id },
      data: {
        ipAddress: validatedData.ipAddress,
        label: validatedData.label,
      },
      include: {
        plot: {
          select: {
            title: true,
            location: true,
            owner: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(camera);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating camera:", error);
    return NextResponse.json(
      { error: "Failed to update camera" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    await prisma.camera.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting camera:", error);
    return NextResponse.json(
      { error: "Failed to delete camera" },
      { status: 500 }
    );
  }
}
