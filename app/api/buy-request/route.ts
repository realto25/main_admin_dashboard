import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, phone, message, selectedLandId } = await req.json();

    if (!name || !phone || !selectedLandId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const land = await prisma.land.findUnique({ where: { id: selectedLandId } });
    if (!land) {
      return NextResponse.json({ error: "Land not found" }, { status: 404 });
    }

    const newRequest = await prisma.buyRequest.create({
      data: {
        name,
        phone,
        message,
        landId: selectedLandId,
      },
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error("Error submitting buy request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
