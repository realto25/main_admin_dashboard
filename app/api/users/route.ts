import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, clerkId, role } = await req.json();

    if (!name || !email || !clerkId || !role) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: { name, email, phone, clerkId, role },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");

  const users = await prisma.user.findMany({
    where: role ? { role } : {},
    orderBy: { createdAt: "desc" },
  });
  
  return NextResponse.json(users);
}
