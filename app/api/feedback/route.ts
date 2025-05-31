import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const clerkId = session?.userId;
    const body = await req.json();
    const { bookingId, rating, experience, suggestions, purchaseInterest } =
      body;

    // 🔍 Validate required fields
    if (!bookingId || rating == null || !experience || !suggestions) {
      return NextResponse.json(
        { error: "Missing required feedback fields." },
        { status: 400 }
      );
    }

    // 🔐 Validate booking exists
    const existingBooking = await prisma.visitRequest.findUnique({
      where: { id: bookingId },
      include: {
        user: true, // Include user details
      },
    });

    if (!existingBooking) {
      return NextResponse.json(
        { error: "Invalid booking ID. Booking not found." },
        { status: 400 }
      );
    }

    // Get user ID if authenticated
    let dbUserId: string | null = null;
    if (clerkId) {
      const dbUser = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      });
      if (dbUser) {
        dbUserId = dbUser.id;
      }
    }

    // Create feedback data object
    const feedbackData: any = {
      bookingId,
      rating,
      experience,
      suggestions,
      purchaseInterest,
      userId: dbUserId, // This will be null for guest users
    };

    // ✅ Create feedback
    const feedback = await prisma.feedback.create({
      data: feedbackData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        booking: {
          select: {
            id: true,
            name: true,
            email: true,
            date: true,
            time: true,
          },
        },
      },
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (err) {
    console.error("Feedback creation error:", err);
    return NextResponse.json(
      { error: "Failed to create feedback. Please try again." },
      { status: 500 }
    );
  }
}
