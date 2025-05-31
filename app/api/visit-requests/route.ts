import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = auth(); // ✅ no await needed

    const body = await request.json();
    const { name, email, phone, date, time, plotId } = body;

    // ✅ Basic field validation
    if (!name || !email || !phone || !date || !time || !plotId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ✅ Validate plot existence
    const plotExists = await prisma.plot.findUnique({
      where: { id: plotId },
    });

    if (!plotExists) {
      return NextResponse.json({ error: "Plot not found" }, { status: 404 });
    }

    // ✅ Lookup DB user ID if authenticated
    let userId: string | undefined = undefined;
    if (clerkId) {
      const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      });
      if (user) userId = user.id;
    }

    // ✅ Parse and validate date
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    // ✅ Create visit request
    const visit = await prisma.visitRequest.create({
      data: {
        name,
        email,
        phone,
        date: parsedDate,
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

    return NextResponse.json(visit, { status: 201 });
  } catch (error) {
    console.error("Error creating visit request:", error);
    return NextResponse.json(
      {
        error: "Failed to create visit request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
