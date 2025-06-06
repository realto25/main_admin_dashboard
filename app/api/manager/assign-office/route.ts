import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clerkId, officeId } = body;

    if (!clerkId || !officeId) {
      return NextResponse.json({ error: "Missing clerkId or officeId" }, { status: 400 });
    }

    // Find the manager by clerkId
    const manager = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!manager) {
      return NextResponse.json({ error: "Manager not found" }, { status: 404 });
    }

    // Check if office exists
    const office = await prisma.office.findUnique({
      where: { id: officeId },
    });

    if (!office) {
      return NextResponse.json({ error: "Office not found" }, { status: 404 });
    }

    // Update the manager to be connected to this office
    const updatedManager = await prisma.user.update({
      where: { id: manager.id },
      data: {
        managerOffices: {
          connect: { id: officeId },
        },
      },
      include: {
        managerOffices: true,
      },
    });

    return NextResponse.json({
      message: "Manager assigned to office successfully",
      manager: updatedManager,
    });
  } catch (error) {
    console.error("Error assigning manager to office:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}