import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const data = await prisma.visitRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        plot: {
          select: {
            id: true,
            title: true,
            location: true,
          },
        },
      },
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching visit requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch visit requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, date, time, plotId, clerkId } = body;

    // Validate required fields
    if (!name || !email || !phone || !date || !time || !plotId) {
      return NextResponse.json(
        { error: "All fields are required" },
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

    // Verify plot exists
    const plotExists = await prisma.plot.findUnique({
      where: { id: plotId },
    });

    if (!plotExists) {
      return NextResponse.json({ error: "Plot not found" }, { status: 404 });
    }

    let userId: string | undefined;

    // If clerkId is provided, find or create user
    if (clerkId) {
      let user = await prisma.user.findUnique({
        where: { clerkId },
      });

      if (!user) {
        // Create user if doesn't exist
        user = await prisma.user.create({
          data: {
            clerkId,
            name,
            email,
            phone,
            role: "GUEST",
          },
        });
      } else {
        // Update user info if it has changed
        if (
          user.name !== name ||
          user.email !== email ||
          user.phone !== phone
        ) {
          user = await prisma.user.update({
            where: { clerkId },
            data: {
              name,
              email,
              phone: phone || user.phone,
            },
          });
        }
      }

      userId = user.id;

      // Check if user already has a pending visit request for this plot
      const existingRequest = await prisma.visitRequest.findFirst({
        where: {
          userId: user.id,
          plotId,
          status: "PENDING",
        },
      });

      if (existingRequest) {
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
        date: new Date(date),
        time,
        plotId,
        userId, // This will be undefined for guest users, null for logged-in users
        status: "PENDING",
      },
      include: {
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
        plot: {
          select: {
            id: true,
            title: true,
            location: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Visit request submitted successfully",
      data: visitRequest,
    });
  } catch (error) {
    console.error("Error creating visit request:", error);

    // Type guard for Prisma errors
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === "P2002") {
        return NextResponse.json(
          { error: "A visit request with this information already exists" },
          { status: 409 }
        );
      }

      if (prismaError.code === "P2025") {
        return NextResponse.json(
          { error: "Referenced record not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to create visit request" },
      { status: 500 }
    );
  }
}
