import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { clerkId, email, name, phone } = await req.json();

    if (!clerkId || !email || !name) {
      return NextResponse.json(
        { error: "clerkId, name, and email are required." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (existingUser) {
      return NextResponse.json(existingUser, { status: 200 });
    }

    const newUser = await prisma.user.create({
      data: {
        clerkId,
        email,
        name,
        phone,
        role: "USER",
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
