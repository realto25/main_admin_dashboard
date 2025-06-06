import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clerkId = searchParams.get("clerkId");

    if (!clerkId) {
      return NextResponse.json({ error: "Missing clerkId" }, { status: 400 });
    }

    const manager = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        managerOffices: true,
      },
    });

    if (!manager) {
      return NextResponse.json({ error: "Manager not found" }, { status: 404 });
    }

    // Transform the data to match what the mobile app expects
    const assignedOffices = manager.managerOffices.map(office => ({
      id: office.id,
      officeName: office.name,
      latitude: office.latitude,
      longitude: office.longitude,
    }));

    return NextResponse.json(assignedOffices);
  } catch (error) {
    console.error("Error fetching assigned offices:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}