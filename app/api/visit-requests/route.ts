import { auth } from "@clerk/nextjs/server";  // or your exact import path
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // adjust path if needed

export async function POST(request: NextRequest) {
  try {
    // Await the promise to get the auth object
    const { userId: clerkId } = await auth();

    // If user is not authenticated
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { name, email, phone, date, time, plotId } = body;

    // Validate input (optional, but recommended)
    if (!name || !email || !phone || !date || !time || !plotId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Save to DB
    const visitRequest = await prisma.visitRequest.create({
      data: {
        userId: clerkId,
        name,
        email,
        phone,
        date,
        time,
        plotId,
      },
    });

    return NextResponse.json(visitRequest, { status: 201 });
  } catch (error) {
    console.error("Error creating visit request:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
