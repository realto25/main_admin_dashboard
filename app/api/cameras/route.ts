// File: app/api/cameras/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { landId, ipAddress, label } = await req.json();

    if (!landId || !ipAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
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
    // Get authorization header
    const authHeader = req.headers.get("authorization");
    let userId = null;

    // Try to extract user ID from authorization header if present
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        // If you're using Clerk, you might need to verify the token here
        // For now, we'll get all cameras without user filtering
        // You can add proper token verification later
      } catch (err) {
        console.log("Token verification failed:", err);
      }
    }

    const { searchParams } = new URL(req.url);
    const landId = searchParams.get("landId");
    const cameraId = searchParams.get("cameraId");

    if (cameraId) {
      // Get specific camera by ID
      const camera = await prisma.camera.findUnique({
        where: {
          id: cameraId,
        },
        // Remove the land relation check for now
      });

      if (!camera) {
        return NextResponse.json(
          { error: "Camera not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(camera);
    }

    if (landId) {
      // Get cameras for specific land
      const cameras = await prisma.camera.findMany({
        where: {
          landId: landId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json(cameras);
    }

    // Get all cameras (for testing - you can add user filtering later)
    const cameras = await prisma.camera.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(cameras);
  } catch (error) {
    console.error("Error fetching cameras:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    } else {
      console.error("Error details:", error);
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
