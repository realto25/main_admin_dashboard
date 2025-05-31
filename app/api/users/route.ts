import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Handle POST requests - Create or update user
export async function POST(req: NextRequest) {
  try {
    const { clerkId, email, name, phone, role } = await req.json();

    if (!clerkId || !email || !name) {
      return NextResponse.json(
        { error: "clerkId, name, and email are required." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (existingUser) {
      // Update existing user if role or other details changed
      const updatedUser = await prisma.user.update({
        where: { clerkId },
        data: {
          email,
          name,
          phone,
          role,
        },
      });
      return NextResponse.json(updatedUser, { status: 200 });
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        clerkId,
        email,
        name,
        phone: phone || null,
        role: role || "GUEST",
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Failed to create/update user:", error);
    return NextResponse.json(
      { error: "Failed to create or update user" },
      { status: 500 }
    );
  }
}

// Handle GET requests - Get all users (if needed)
export async function GET(req: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
