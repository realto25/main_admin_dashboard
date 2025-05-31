import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const clerkId = session?.userId;
    const body = await request.json();
    const { name, email, phone, date, time, plotId } = body;

    // Validate required fields
    if (!name || !email || !phone || !date || !time || !plotId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Validate plot exists
    const plotExists = await prisma.plot.findUnique({
      where: { id: plotId },
    });

    if (!plotExists) {
      return NextResponse.json({ error: "Plot not found" }, { status: 404 });
    }

    // If user is authenticated, get their database ID
    let userId: string | undefined;
    if (clerkId) {
      const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      });
      if (user) userId = user.id;
    }

    // Create visit request
    const visit = await prisma.visitRequest.create({
      data: {
        name,
        email,
        phone,
        date: new Date(date), // Ensure date is converted to Date object
        time,
        plotId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(visit);
  } catch (error) {
    console.error("Error creating visit request:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Failed to create visit request", details: errorMessage },
      { status: 500 }
    );
  }
}
