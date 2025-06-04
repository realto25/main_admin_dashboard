import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const plotId = searchParams.get("plotId");
  if (!plotId)
    return NextResponse.json({ error: "Missing plotId" }, { status: 400 });

  const lands = await prisma.land.findMany({ where: { plotId } });
  return NextResponse.json(lands);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { number, size, price, status, x, y, plotId } = body;

  if (
    !number ||
    !size ||
    !price ||
    !status ||
    x == null ||
    y == null ||
    !plotId
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const land = await prisma.land.create({
    data: { number, size, price, status, x, y, plotId },
  });

  return NextResponse.json(land);
}
