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
    if (
      !bookingId ||
      rating == null ||
      experience == null ||
      suggestions == null
    ) {
      return NextResponse.json(
        { error: "Missing required feedback fields." },
        { status: 400 }
      );
    }

    // 🔐 Validate booking exists and get associated user
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

    // Determine user ID for feedback
    let feedbackUserId: string;

    if (clerkId) {
      // For authenticated users, get their DB user ID
      const dbUser = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      });

      if (!dbUser) {
        return NextResponse.json(
          { error: "User not found in database." },
          { status: 400 }
        );
      }

      feedbackUserId = dbUser.id;
    } else if (existingBooking.userId) {
      // If no auth but booking has a user, use that user ID
      feedbackUserId = existingBooking.userId;
    } else {
      // If no authenticated user and booking has no user, we need to handle this case
      // Since userId is NOT NULL, we need to either:
      // 1. Require authentication for feedback, OR
      // 2. Create a guest user entry, OR
      // 3. Use the booking's user if it exists
      return NextResponse.json(
        { error: "Authentication required to submit feedback." },
        { status: 401 }
      );
    }

    // Check if feedback already exists for this booking
    const existingFeedback = await prisma.feedback.findFirst({
      where: { bookingId },
    });

    if (existingFeedback) {
      return NextResponse.json(
        { error: "Feedback has already been submitted for this booking." },
        { status: 409 }
      );
    }

    // Create feedback data object
    const feedbackData = {
      bookingId,
      rating: parseInt(rating.toString()), // Ensure it's an integer
      experience: experience.toString(),
      suggestions: suggestions.toString(),
      purchaseInterest:
        purchaseInterest === null ? null : Boolean(purchaseInterest),
      userId: feedbackUserId, // Now guaranteed to be a valid string
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

    return NextResponse.json(
      {
        message: "Feedback submitted successfully",
        feedback,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Feedback creation error:", err);

    // Type guard for error details
    if (err && typeof err === "object") {
      const errorDetails = {
        name: "name" in err ? String(err.name) : "Unknown",
        message: "message" in err ? String(err.message) : "Unknown error",
        code: "code" in err ? String(err.code) : "Unknown code",
      };
      console.error("Error details:", errorDetails);
    }

    return NextResponse.json(
      { error: "Failed to create feedback. Please try again." },
      { status: 500 }
    );
  }
}
