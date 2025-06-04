// api/lands/by-plot/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const plotId = searchParams.get("plotId");
  if (!plotId) {
    return NextResponse.json({ error: "Missing plotId" }, { status: 400 });
  }

  const lands = await prisma.land.findMany({
    where: { plotId },
    select: {
      id: true,
      number: true,
      size: true,
      price: true,
      status: true,
      owner: {
        select: { name: true },
      },
    },
  });

  return NextResponse.json(lands);
}
