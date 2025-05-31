import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const data = await prisma.visitRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = auth();
    const body = await request.json();
    const { name, email, phone, date, time, plotId } = body;

    if (!name || !email || !phone || !date || !time || !plotId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // If user is authenticated, get their database ID
    let userId: string | undefined;
    if (clerkId) {
      const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      });
      if (user) {
        userId = user.id;
      }
    }

    const visit = await prisma.visitRequest.create({
      data: {
        name,
        email,
        phone,
        date: new Date(date),
        time,
        plotId,
        userId, // This will be undefined for guest users
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(visit);
  } catch (error) {
    console.error("Error creating visit request:", error);
    return NextResponse.json(
      { error: "Failed to create visit request" },
      { status: 500 }
    );
  }
}
