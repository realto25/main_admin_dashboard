// app/api/feedback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, rating, experience, suggestions, purchaseInterest } = body;

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
    });

    if (!existingBooking) {
      return NextResponse.json(
        { error: "Invalid booking ID. Booking not found." },
        { status: 400 }
      );
    }

    // ✅ Create feedback
    const feedback = await prisma.feedback.create({
      data: {
        bookingId,
        rating,
        experience,
        suggestions,
        purchaseInterest,
      },
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (err) {
    console.error("Error creating feedback:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
