import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const clients = await prisma.user.findMany({ where: { role: "CLIENT" } });
  return NextResponse.json(clients);
}
