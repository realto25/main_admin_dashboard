// app/api/users/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    let whereClause: any = {};

    if (role) {
      whereClause.role = role;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        clerkId: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
        managerOffices: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clerkId, name, email, role, phone } = body;

    if (!clerkId || !name || !email || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        clerkId,
        name,
        email,
        role,
        phone,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error creating user:", error);

    // Handle unique constraint violations
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === "P2002") {
        return NextResponse.json(
          { error: "User with this email or clerkId already exists" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
