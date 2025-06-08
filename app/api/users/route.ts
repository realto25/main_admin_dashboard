import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clerkId = searchParams.get("clerkId");

    if (clerkId) {
      // Fetch single user by clerkId
      const user = await prisma.user.findUnique({
        where: { clerkId },
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
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json(user);
    }

    // Fetch all users if no clerkId is provided
    const users = await prisma.user.findMany({
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
      take: 50,
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clerkId, name, email, role, phone } = body;

    if (!clerkId || !name || !email || !role) {
      return NextResponse.json(
        { error: "Missing required fields: clerkId, name, email, role" },
        { status: 400 }
      );
    }

    const normalizedRole = role.toUpperCase();
    if (!["GUEST", "CLIENT", "MANAGER"].includes(normalizedRole)) {
      return NextResponse.json(
        { error: "Invalid role. Must be one of: GUEST, CLIENT, MANAGER" },
        { status: 400 }
      );
    }

    const user = await prisma.user.upsert({
      where: { clerkId },
      update: {
        name,
        email,
        phone: phone || null,
        role: normalizedRole as "GUEST" | "CLIENT" | "MANAGER",
      },
      create: {
        clerkId,
        name,
        email,
        phone: phone || null,
        role: normalizedRole as "GUEST" | "CLIENT" | "MANAGER",
      },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Error creating/updating user:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "User with this clerkId already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Failed to create/update user" }, { status: 500 });
  }
}