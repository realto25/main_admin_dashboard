import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const otherUserId = searchParams.get("otherUserId");

    if (!userId || !otherUserId) {
      return NextResponse.json(
        { error: "Both user IDs are required" },
        { status: 400 }
      );
    }

    // Get messages between two users
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            AND: [{ senderId: userId }, { receiverId: otherUserId }],
          },
          {
            AND: [{ senderId: otherUserId }, { receiverId: userId }],
          },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: {
        receiverId: userId,
        senderId: otherUserId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { senderId, receiverId, text } = await request.json();

    if (!senderId || !receiverId || !text) {
      return NextResponse.json(
        { error: "Sender ID, receiver ID, and text are required" },
        { status: 400 }
      );
    }

    // Check if both users exist
    const [sender, receiver] = await Promise.all([
      prisma.user.findUnique({ where: { id: senderId } }),
      prisma.user.findUnique({ where: { id: receiverId } }),
    ]);

    if (!sender || !receiver) {
      return NextResponse.json(
        { error: "Sender or receiver not found" },
        { status: 404 }
      );
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content: text,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
