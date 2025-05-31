// app/api/users/route.ts

import { prisma } from "@/lib/prisma"; // Adjust path if needed
import { NextResponse } from "next/server";

// GET all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch users", details: errorMessage },
      { status: 500 }
    );
  }
}
