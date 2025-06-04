// app/api/assign-land/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { landId, clientId } = await req.json();

    if (!landId || !clientId) {
      return NextResponse.json({ error: "Missing landId or clientId" }, { status: 400 });
    }

    const land = await prisma.land.update({
      where: { id: landId },
      data: {
        ownerId: clientId,
        status: "SOLD", // Optional: change status upon assignment
      },
    });

    return NextResponse.json(land);
  } catch (error) {
    console.error("Failed to assign land:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
