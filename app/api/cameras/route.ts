import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req as any);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { landId, ipAddress, label } = await req.json();

    if (!landId || !ipAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify user owns the land
    const land = await prisma.land.findFirst({
      where: { id: landId, ownerId: userId }
    });

    if (!land) {
      return NextResponse.json(
        { error: "Land not found or access denied" },
        { status: 403 }
      );
    }

    const camera = await prisma.camera.upsert({
      where: { landId },
      update: { ipAddress, label },
      create: {
        landId,
        ipAddress,
        label,
      },
    });

    return NextResponse.json(camera);
  } catch (error) {
    console.error("Error creating/updating camera:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req as any);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const landId = searchParams.get("landId");
    const cameraId = searchParams.get("cameraId");

    if (cameraId) {
      const camera = await prisma.camera.findUnique({
        where: { id: cameraId },
        include: {
          land: {
            include: {
              plot: {
                select: {
                  title: true,
                  location: true,
                  project: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!camera || camera.land?.ownerId !== userId) {
        return NextResponse.json(
          { error: "Camera not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(camera);
    }

    if (landId) {
      // Verify user owns the land
      const land = await prisma.land.findFirst({
        where: { id: landId, ownerId: userId }
      });

      if (!land) {
        return NextResponse.json(
          { error: "Land not found or access denied" },
          { status: 403 }
        );
      }

      const cameras = await prisma.camera.findMany({
        where: { landId },
        include: {
          land: {
            include: {
              plot: {
                select: {
                  title: true,
                  location: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(cameras);
    }

    // Get all cameras for user's lands
    const userLands = await prisma.land.findMany({
      where: { ownerId: userId },
      select: { id: true }
    });

    const landIds = userLands.map(land => land.id);
    
    const cameras = await prisma.camera.findMany({
      where: { landId: { in: landIds } },
      include: {
        land: {
          include: {
            plot: {
              select: {
                title: true,
                location: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(cameras);
  } catch (error) {
    console.error("Error fetching cameras:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}