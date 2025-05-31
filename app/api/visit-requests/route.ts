// app/api/visit-requests/route.ts
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { PlotStatus, VisitStatus } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.userId;
    const body = await req.json();
    const { name, email, phone, date, time, plotId } = body;

    // Validate required fields
    if (!name || !email || !phone || !date || !time || !plotId) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: name, email, phone, date, time, and plotId are required",
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate phone number
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // Parse and validate date
    const visitDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    visitDate.setHours(0, 0, 0, 0);

    if (isNaN(visitDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    if (visitDate < today) {
      return NextResponse.json(
        { error: "Visit date cannot be in the past" },
        { status: 400 }
      );
    }

    // Check if plot exists and is available
    const plot = await prisma.plot.findUnique({
      where: { id: plotId },
      select: {
        id: true,
        status: true,
        title: true,
        location: true,
      },
    });

    if (!plot) {
      return NextResponse.json(
        { error: "Invalid plot ID. Plot not found" },
        { status: 400 }
      );
    }

    if (plot.status !== PlotStatus.AVAILABLE) {
      return NextResponse.json(
        { error: "This plot is no longer available for visits" },
        { status: 400 }
      );
    }

    // Check for existing visit requests for the same plot and time slot
    const existingRequest = await prisma.visitRequest.findFirst({
      where: {
        plotId,
        date: visitDate,
        time,
        status: {
          in: [VisitStatus.PENDING, VisitStatus.APPROVED],
        },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "This time slot is already booked" },
        { status: 409 }
      );
    }

    // If user is authenticated, check for their existing requests
    if (userId) {
      const userExistingRequest = await prisma.visitRequest.findFirst({
        where: {
          userId,
          plotId,
          status: {
            in: [VisitStatus.PENDING, VisitStatus.APPROVED],
          },
        },
      });

      if (userExistingRequest) {
        return NextResponse.json(
          { error: "You already have a pending visit request for this plot" },
          { status: 409 }
        );
      }
    }

    // Create visit request
    const visitRequest = await prisma.visitRequest.create({
      data: {
        name,
        email,
        phone,
        date: visitDate, // Store as DateTime
        time,
        plotId,
        userId: userId || null,
        status: VisitStatus.PENDING,
        // Generate QR code if needed
        qrCode: null, // You can implement QR code generation if needed
        expiresAt: null, // You can set expiration if needed
      },
      include: {
        plot: {
          select: {
            id: true,
            title: true,
            location: true,
            status: true,
          },
        },
        user: userId
          ? {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            }
          : undefined,
      },
    });

    return NextResponse.json(visitRequest, { status: 201 });
  } catch (error) {
    console.error("Visit request creation error:", error);

    // Type guard for Prisma errors
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "A visit request with these details already exists" },
          { status: 409 }
        );
      }

      if (error.code === "P2003") {
        return NextResponse.json({ error: "Invalid plot ID" }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Failed to create visit request. Please try again later" },
      { status: 500 }
    );
  }
}
