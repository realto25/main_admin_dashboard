import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const cameraSchema = z.object({
  plotId: z.string(),
  ipAddress: z.string().ip(),
  label: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const cameras = await prisma.camera.findMany({
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(cameras);
  } catch (error) {
    console.error("Error fetching cameras:", error);
    return NextResponse.json(
      { error: "Failed to fetch cameras" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = cameraSchema.parse(body);

    // Check if plot exists and is available
    const plot = await prisma.plot.findUnique({
      where: { id: validatedData.plotId },
      include: { camera: true },
    });

    if (!plot) {
      return NextResponse.json({ error: "Plot not found" }, { status: 404 });
    }

    if (plot.camera) {
      return NextResponse.json(
        { error: "Plot already has a camera assigned" },
        { status: 400 }
      );
    }

    const camera = await prisma.camera.create({
      data: {
        plotId: validatedData.plotId,
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

    console.error("Error creating camera:", error);
    return NextResponse.json(
      { error: "Failed to create camera" },
      { status: 500 }
    );
  }
}
