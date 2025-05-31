// app/api/visit-requests/route.ts
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.userId;
    const body = await req.json();
    const { name, email, phone, date, time, plotId } = body;

    // Validate required fields
    if (!name || !email || !phone || !date || !time || !plotId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create visit request
    const visitRequest = await prisma.visitRequest.create({
      data: {
        name,
        email,
        phone,
        date,
        time,
        plotId,
        userId: userId || null, // Link to user if authenticated
      },
    });

    return NextResponse.json(visitRequest, { status: 201 });
  } catch (error) {
    console.error("Visit request creation error:", error);
    return NextResponse.json(
      { error: "Failed to create visit request" },
      { status: 500 }
    );
  }
}
