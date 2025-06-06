import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuth } from "@clerk/nextjs/server";

const updateCameraSchema = z.object({
  ipAddress: z.string().url(),
  label: z.string().optional(),
});

type RouteContext = {
  params: { id: string };
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { userId } = getAuth(request as any);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = context.params;

  try {
    const body = await request.json();
    const validatedData = updateCameraSchema.parse(body);

    // Verify user owns the camera
    const camera = await prisma.camera.findFirst({
      where: { id },
      include: {
        land: {
          select: {
            ownerId: true
          }
        }
      }
    });

    if (!camera || camera.land?.ownerId !== userId) {
      return NextResponse.json(
        { error: "Camera not found or access denied" },
        { status: 404 }
      );
    }

    const updatedCamera = await prisma.camera.update({
      where: { id },
      data: {
        ipAddress: validatedData.ipAddress,
        label: validatedData.label,
      },
      include: {
        land: {
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
        },
      },
    });

    return NextResponse.json(updatedCamera);
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
  const { userId } = getAuth(request as any);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = context.params;

  try {
    // Verify user owns the camera
    const camera = await prisma.camera.findFirst({
      where: { id },
      include: {
        land: {
          select: {
            ownerId: true
          }
        }
      }
    });

    if (!camera || camera.land?.ownerId !== userId) {
      return NextResponse.json(
        { error: "Camera not found or access denied" },
        { status: 404 }
      );
    }

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