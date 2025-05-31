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
      experience: experience?.substring(0, 50) + "...", 
      suggestions: suggestions?.substring(0, 50) + "...", 
      purchaseInterest,
      clerkId 
    });

    // 🔍 Validate required fields
    if (!bookingId || rating == null || !experience || !suggestions) {
      console.error("Missing required fields:", { bookingId, rating, experience: !!experience, suggestions: !!suggestions });
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

    // 🔐 Validate visit request exists
    const existingVisitRequest = await prisma.visitRequest.findUnique({
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

    if (!existingVisitRequest) {
      console.error("Visit request not found:", bookingId);
      return NextResponse.json(
        { error: "Invalid booking ID. Visit request not found." },
        { status: 404 }
      );
    }

    console.log("Found visit request:", {
      id: existingVisitRequest.id,
      userId: existingVisitRequest.userId,
      status: existingVisitRequest.status
    });

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
    } else if (existingVisitRequest.userId) {
      // If no auth but visit request has a user, use that user ID
      feedbackUserId = existingVisitRequest.userId;
      console.log("Using visit request user ID:", feedbackUserId);
    } else {
      console.error("No user context for feedback submission");
      return NextResponse.json(
        { error: "Authentication required to submit feedback." },
        { status: 401 }
      );
    }

    // Check if feedback already exists for this visit request and user
    const existingFeedback = await prisma.feedback.findFirst({
      where: { 
        visitRequestId: bookingId,
        userId: feedbackUserId 
      },
    });

    if (existingFeedback) {
      console.error("Feedback already exists for visit request:", bookingId);
      return NextResponse.json(
        { error: "Feedback has already been submitted for this booking." },
        { status: 409 }
      );
    }

    // Create feedback data object
    const feedbackData = {
      visitRequestId: bookingId, // Updated field name
      rating: ratingNum,
      experience: experience.toString().trim(),
      suggestions: suggestions.toString().trim(),
      purchaseInterest: purchaseInterest === null ? null : Boolean(purchaseInterest),
      userId: feedbackUserId,
    };

    console.log("Creating feedback with data:", {
      ...feedbackData,
      experience: feedbackData.experience.substring(0, 50) + "...",
      suggestions: feedbackData.suggestions.substring(0, 50) + "..."
    });

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
        visitRequest: {
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

    console.log("Feedback created successfully:", feedback.id);

    return NextResponse.json(
      {
        message: "Feedback submitted successfully",
        feedback,
      },
      { status: 201 }
    );

  } catch (err) {
    console.error("=== FEEDBACK CREATION ERROR ===");
    console.error("Raw error:", err);
    console.error("Error type:", typeof err);

    if (err && typeof err === "object") {
      const errorDetails = {
        name: "name" in err ? String(err.name) : "Unknown",
        message: "message" in err ? String(err.message) : "Unknown error",
        code: "code" in err ? String(err.code) : "Unknown code",
      };
      console.error("Structured error details:", errorDetails);

      // Handle specific Prisma errors
      if ("code" in err) {
        const prismaError = err as any;
        console.error("Prisma error code:", prismaError.code);
        
        if (prismaError.code === 'P2002') {
          console.error("Unique constraint violation");
          return NextResponse.json(
            { error: "Feedback already exists for this booking." },
            { status: 409 }
          );
        } else if (prismaError.code === 'P2003') {
          console.error("Foreign key constraint violation");
          return NextResponse.json(
            { error: "Invalid reference - booking or user not found." },
            { status: 400 }
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