import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// For App Router (Next.js 13+)
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const {
      bookingId,
      rating,
      experience,
      suggestions,
      purchaseInterest,
      clerkId,
    } = body;

    // Validate required fields
    if (!clerkId?.trim()) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }

    if (!bookingId?.trim()) {
      return Response.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return Response.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    if (!experience?.trim()) {
      return Response.json(
        { error: "Experience feedback is required" },
        { status: 400 }
      );
    }

    if (!suggestions?.trim()) {
      return Response.json(
        { error: "Suggestions are required" },
        { status: 400 }
      );
    }

    if (purchaseInterest === undefined) {
      return Response.json(
        { error: "Purchase interest is required" },
        { status: 400 }
      );
    }

    // Find the user by Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkId.trim() },
    });

    if (!user) {
      return Response.json(
        { error: "User not found - Please sign up first" },
        { status: 404 }
      );
    }

    // Verify the visit request exists and belongs to the user
    const visitRequest = await prisma.visitRequest.findFirst({
      where: {
        id: bookingId,
        userId: user.id,
      },
      include: {
        plot: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!visitRequest) {
      return Response.json(
        { error: "Visit request not found or does not belong to this user" },
        { status: 404 }
      );
    }

    // Check if feedback already exists for this visit request and user
    const existingFeedback = await prisma.feedback.findUnique({
      where: {
        visitRequestId_userId: {
          visitRequestId: bookingId,
          userId: user.id,
        },
      },
    });

    if (existingFeedback) {
      return Response.json(
        { error: "Feedback already submitted for this visit" },
        { status: 409 }
      );
    }

    // Create the feedback
    const feedback = await prisma.feedback.create({
      data: {
        visitRequestId: bookingId,
        userId: user.id,
        rating: parseInt(rating),
        experience: experience.trim(),
        suggestions: suggestions.trim(),
        purchaseInterest:
          purchaseInterest === true
            ? true
            : purchaseInterest === false
            ? false
            : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        visitRequest: {
          include: {
            plot: {
              include: {
                project: true,
              },
            },
          },
        },
      },
    });

    return Response.json(
      {
        success: true,
        message: "Feedback submitted successfully",
        feedback: {
          id: feedback.id,
          rating: feedback.rating,
          experience: feedback.experience,
          suggestions: feedback.suggestions,
          purchaseInterest: feedback.purchaseInterest,
          createdAt: feedback.createdAt,
          visitRequest: {
            id: feedback.visitRequest.id,
            date: feedback.visitRequest.date,
            plot: {
              id: feedback.visitRequest.plot.id,
              title: feedback.visitRequest.plot.title,
              location: feedback.visitRequest.plot.location,
              project: {
                id: feedback.visitRequest.plot.project.id,
                name: feedback.visitRequest.plot.project.name,
              },
            },
          },
          user: {
            id: feedback.user.id,
            name: feedback.user.name,
            email: feedback.user.email,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Feedback submission error:", error);

    // Type guard for Prisma errors
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === "P2002") {
        return Response.json(
          { error: "Feedback already exists for this visit" },
          { status: 409 }
        );
      }

      if (prismaError.code === "P2025") {
        return Response.json(
          { error: "Visit request not found" },
          { status: 404 }
        );
      }
    }

    return Response.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
