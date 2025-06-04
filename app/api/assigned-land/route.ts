// File: app/api/assigned-land/route.ts

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const lands = await prisma.land.findMany({
      where: {
        ownerId: { not: null },
      },
      include: {
        plot: { select: { title: true } },
        owner: { select: { name: true } },
        camera: true, // ✅ include camera data
      },
    });

    const formatted = lands.map((land) => ({
      landId: land.id,
      landNumber: land.number,
      size: land.size,
      plotTitle: land.plot?.title,
      userName: land.owner?.name,
      camera: land.camera || null, // ✅ include if exists
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("Error fetching assigned lands:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
