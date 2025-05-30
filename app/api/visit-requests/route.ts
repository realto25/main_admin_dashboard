import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const data = await prisma.visitRequest.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, date, time, plotId } = body;

    if (!name || !email || !phone || !date || !time || !plotId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const visit = await prisma.visitRequest.create({
      data: {
        name,
        email,
        phone,
        date: new Date(date),
        time,
        plotId,
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
