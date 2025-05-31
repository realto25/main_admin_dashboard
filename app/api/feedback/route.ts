import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const clerkId = session?.userId;
    const body = await req.json();
    const { bookingId, rating, experience, suggestions, purchaseInterest } = body;

    console.log("Feedback submission data:", { 
      bookingId, 
      rating, 
      experience, 
      suggestions, 
      purchaseInterest,
      clerkId 
    });

    // 🔍 Validate required fields
    if (!bookingId || rating == null || !experience || !suggestions) {
      console.error("Missing required fields:", { bookingId, rating, experience, suggestions });
      return NextResponse.json(
        { error: "Missing required feedback fields." },
        { status: 400 }
      );
    }

    // Validate rating is a number between 1-5
    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json(
        { error: "Rating must be a number between 1 and 5." },
        { status: 400 }
      );
    }

    // 🔐 Validate booking exists and get associated user
    const existingBooking = await prisma.visitRequest.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        plot: {
          include: {
            project: true
          }
        }
      },
    });

    if (!existingBooking) {
      console.error("Booking not found:", bookingId);
      return NextResponse.json(
        { error: "Invalid booking ID. Booking not found." },
        { status: 404 }
      );
    }

    console.log("Found booking:", {
      id: existingBooking.id,
      userId: existingBooking.userId,
      status: existingBooking.status
    });

    // Check if feedback already exists for this booking
    const existingFeedback = await prisma.feedback.findFirst({
      where: { bookingId },
    });

    if (existingFeedback) {
      console.error("Feedback already exists for booking:", bookingId);
      return NextResponse.json(
        { error: "Feedback has already been submitted for this booking." },
        { status: 409 }
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
        console.error("Authenticated user not found in database:", clerkId);
        return NextResponse.json(
          { error: "User not found in database." },
          { status: 400 }
        );
      }

      feedbackUserId = dbUser.id;
      console.log("Using authenticated user ID:", feedbackUserId);
    } else if (existingBooking.userId) {
      // If no auth but booking has a user, use that user ID
      feedbackUserId = existingBooking.userId;
      console.log("Using booking user ID:", feedbackUserId);
    } else {
      console.error("No user context for feedback submission");
      return NextResponse.json(
        { error: "Authentication required to submit feedback." },
        { status: 401 }
      );
    }

    // Validate the user exists
    const userExists = await prisma.user.findUnique({
      where: { id: feedbackUserId },
      select: { id: true }
    });

    if (!userExists) {
      console.error("User ID does not exist:", feedbackUserId);
      return NextResponse.json(
        { error: "Invalid user for feedback submission." },
        { status: 400 }
      );
    }

    // Create feedback data object with proper type conversion
    const feedbackData = {
      bookingId: bookingId.toString(),
      rating: ratingNum,
      experience: experience.toString().trim(),
      suggestions: suggestions.toString().trim(),
      purchaseInterest: purchaseInterest === null ? null : Boolean(purchaseInterest),
      userId: feedbackUserId,
    };

    console.log("Creating feedback with data:", feedbackData);

    // ✅ Create feedback with transaction to ensure data consistency
    const feedback = await prisma.$transaction(async (tx) => {
      // Create the feedback
      const newFeedback = await tx.feedback.create({
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
              status: true,
              plot: {
                select: {
                  id: true,
                  title: true,
                  project: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            },
          },
        },
      });

      // Optionally update the booking status to COMPLETED if it's not already
      if (existingBooking.status !== 'COMPLETED') {
        await tx.visitRequest.update({
          where: { id: bookingId },
          data: { status: 'COMPLETED' }
        });
      }

      return newFeedback;
    });

    console.log("Feedback created successfully:", feedback.id);

    return NextResponse.json(
      {
        message: "Feedback submitted successfully",
        feedback,
      },
      { status: 201 }
    );

  } catch (err) {
    console.error("Feedback creation error:", err);

    // Enhanced error logging
    if (err && typeof err === "object") {
      console.error("Error details:", {
        name: "name" in err ? String(err.name) : "Unknown",
        message: "message" in err ? String(err.message) : "Unknown error",
        code: "code" in err ? String(err.code) : "Unknown code",
        stack: "stack" in err ? String(err.stack) : "No stack trace"
      });

      // Handle specific Prisma errors
      if ("code" in err) {
        const prismaError = err as any;
        
        if (prismaError.code === 'P2002') {
          return NextResponse.json(
            { error: "Feedback already exists for this booking." },
            { status: 409 }
          );
        } else if (prismaError.code === 'P2003') {
          return NextResponse.json(
            { error: "Invalid reference - booking or user not found." },
            { status: 400 }
          );
        } else if (prismaError.code === 'P2025') {
          return NextResponse.json(
            { error: "Record not found." },
            { status: 404 }
          );
        }
      }
    }

    return NextResponse.json(
      { 
        error: "Failed to create feedback. Please try again.",
        details: process.env.NODE_ENV === 'development' ? String(err) : undefined
      },
      { status: 500 }
    );
  }
}