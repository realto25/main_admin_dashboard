import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, clerkId, role } = await req.json();

    if (!name || !email || !clerkId || !role) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: { name, email, phone, clerkId, role: role as UserRole },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roleParam = searchParams.get("role");

  const users = await prisma.user.findMany({
    where: roleParam ? { role: roleParam as UserRole } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}
