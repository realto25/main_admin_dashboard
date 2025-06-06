import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, latitude, longitude } = body;

    if (!name || latitude == null || longitude == null) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const office = await prisma.office.create({
      data: {
        name,
        latitude,
        longitude,
      },
    });

    return NextResponse.json(office);
  } catch (error) {
    console.error("Error creating office:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const offices = await prisma.office.findMany({
      include: {
        managers: {
          select: {
            id: true,
            name: true,
            email: true,
            clerkId: true,
          },
        },
      },
    });

    return NextResponse.json(offices);
  } catch (error) {
    console.error("Error fetching offices:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}