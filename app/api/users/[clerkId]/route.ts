import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Handle GET requests - Get user by Clerk ID
export async function GET(
  req: NextRequest,
  { params }: { params: { clerkId: string } }
) {
  try {
    const { clerkId } = params;

    if (!clerkId) {
      return NextResponse.json(
        { error: "Clerk ID is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
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

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch user by Clerk ID:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// Handle PUT requests - Update user by Clerk ID
export async function PUT(
  req: NextRequest,
  { params }: { params: { clerkId: string } }
) {
  try {
    const { clerkId } = params;
    const { email, name, phone, role } = await req.json();

    if (!clerkId) {
      return NextResponse.json(
        { error: "Clerk ID is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { clerkId },
      data: {
        ...(email && { email }),
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(role && { role }),
      },
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// Handle DELETE requests - Delete user by Clerk ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: { clerkId: string } }
) {
  try {
    const { clerkId } = params;

    if (!clerkId) {
      return NextResponse.json(
        { error: "Clerk ID is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Delete user
    await prisma.user.delete({
      where: { clerkId },
    });

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}