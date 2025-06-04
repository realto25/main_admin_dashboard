import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { landId, reason, userId } = await req.json();

    if (!landId || !reason || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the plotId from the land
    const land = await prisma.land.findUnique({ where: { id: landId } });
    if (!land) {
      return NextResponse.json({ error: "Land not found" }, { status: 404 });
    }

    const newRequest = await prisma.sellRequest.create({
      data: {
        plotId: land.plotId,
        userId,
        reason,
      },
    });

    return NextResponse.json(newRequest);
  } catch (err) {
    console.error("Error submitting sell request:", err);
    return NextResponse.json(
      { error: "Failed to submit request" },
      { status: 500 }
    );
  }
}
