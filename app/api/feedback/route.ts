import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: Submit feedback for a visit request
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const data = await req.json();
    const {
      visitRequestId,
      rating,
      experience,
      suggestions,
      purchaseInterest,
      clerkId,
    } = data;

    // Validate required fields
    if (!clerkId) {
      return NextResponse.json(
        { error: "Unauthorized: No Clerk user ID provided" },
        { status: 401 }
      );
    }
    if (!visitRequestId || !rating || !experience || !suggestions) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Find user by clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if visit request exists
    const visitRequest = await prisma.visitRequest.findUnique({
      where: { id: visitRequestId },
    });

    if (!visitRequest) {
      return NextResponse.json(
        { error: "Visit request not found" },
        { status: 404 }
      );
    }

    // Check for duplicate feedback
    const existingFeedback = await prisma.feedback.findUnique({
      where: {
        visitRequestId_userId: {
          visitRequestId,
          userId: user.id,
        },
      },
    });

    if (existingFeedback) {
      return NextResponse.json(
        { error: "Feedback already submitted for this visit" },
        { status: 409 }
      );
    }

    // Create feedback
    const feedback = await prisma.feedback.create({
      data: {
        id: require('crypto').randomUUID(), // Generate UUID for id
        visitRequestId,
        rating,
        experience,
        suggestions,
        purchaseInterest,
        userId: user.id,
        createdAt: new Date(),
      },
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error("Feedback submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}

// GET: Retrieve feedback for a user
export async function GET(req: NextRequest) {
  try {
    // Get clerkId from query parameters
    const clerkId = req.nextUrl.searchParams.get("clerkId");

    if (!clerkId) {
      return NextResponse.json(
        { error: "Unauthorized: No Clerk user ID provided" },
        { status: 401 }
      );
    }

    // Find user by clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get feedback for the user
    const feedback = await prisma.feedback.findMany({
      where: { userId: user.id },
      include: {
        visitRequest: {
          select: {
            id: true,
            date: true,
            time: true,
            plot: {
              select: {
                id: true,
                title: true,
                project: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}