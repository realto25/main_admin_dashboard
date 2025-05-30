import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
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
    });

    if (!existingBooking) {
      return NextResponse.json(
        { error: "Invalid booking ID. Booking not found." },
        { status: 400 }
      );
    }

    if (!existingBooking.userId) {
      return NextResponse.json(
        { error: "Booking is not linked to a user." },
        { status: 400 }
      );
    }

    // ✅ Create feedback with safe userId
    const feedback = await prisma.feedback.create({
      data: {
        booking: {
          connect: { id: bookingId },
        },
        user: {
          connect: { id: existingBooking.userId }, // Now safe
        },
        rating,
        experience,
        suggestions,
        purchaseInterest,
      },
    });

    // 🔔 Send notification
    // Removed notification sending logic

    return NextResponse.json(feedback, { status: 201 });
  } catch (err) {
    console.error("Feedback creation error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
