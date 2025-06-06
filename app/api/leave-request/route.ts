import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Helper function for retrying database operations
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      if (error.code === "P1001") {
        console.warn(
          `Database connection failed (attempt ${
            i + 1
          }/${maxRetries}). Retrying...`,
          { error: error.message }
        );
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, i) * 500)
        );
        continue;
      }
      console.error("Non-retryable database error:", {
        code: error.code,
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
  console.error("Max retries reached. Last error:", {
    code: lastError.code,
    message: lastError.message,
    stack: lastError.stack,
  });
  throw lastError;
}

export async function GET() {
  try {
    console.log("Fetching all leave requests (admin mode)...");
    const leaveRequests = await withRetry(async () => {
      return await prisma.leaveRequest.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              clerkId: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
        },
      });
    });
    console.log("All leave requests fetched:", leaveRequests.length);

    const transformedData = leaveRequests.map((request) => ({
      ...request,
      startDate: request.startDate.toISOString(),
      endDate: request.endDate.toISOString(),
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
    }));

    return NextResponse.json(transformedData);
  } catch (error: any) {
    console.error("Error fetching leave requests:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Failed to fetch leave requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clerkId, startDate, endDate, reason } = body;

    if (!clerkId || !startDate || !endDate || !reason) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const user = await withRetry(async () => {
      return await prisma.user.findUnique({ where: { clerkId } });
    });

    if (!user || user.role !== "MANAGER") {
      return NextResponse.json(
        { error: "Only managers can submit leave requests" },
        { status: 403 }
      );
    }

    const leaveRequest = await withRetry(async () => {
      return await prisma.leaveRequest.create({
        data: {
          userId: clerkId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          reason,
          status: "PENDING",
        },
        include: {
          user: {
            select: {
              clerkId: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
        },
      });
    });

    const transformedRequest = {
      ...leaveRequest,
      startDate: leaveRequest.startDate.toISOString(),
      endDate: leaveRequest.endDate.toISOString(),
      createdAt: leaveRequest.createdAt.toISOString(),
      updatedAt: leaveRequest.updatedAt.toISOString(),
    };

    return NextResponse.json(transformedRequest, { status: 201 });
  } catch (error: any) {
    console.error("Error submitting leave request:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Failed to submit leave request" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, rejectionReason } = body;

    if (!id || !action) {
      return NextResponse.json(
        { error: "Request ID and action are required" },
        { status: 400 }
      );
    }

    if (action === "REJECT" && !rejectionReason) {
      return NextResponse.json(
        { error: "Rejection reason is required for rejecting a leave request" },
        { status: 400 }
      );
    }

    const leaveRequest = await withRetry(async () => {
      return await prisma.leaveRequest.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              clerkId: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
        },
      });
    });

    if (!leaveRequest) {
      return NextResponse.json(
        { error: "Leave request not found" },
        { status: 404 }
      );
    }

    if (leaveRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Leave request is not in a PENDING state" },
        { status: 400 }
      );
    }

    const updatedRequest = await withRetry(async () => {
      return await prisma.leaveRequest.update({
        where: { id },
        data: {
          status: action === "APPROVE" ? "APPROVED" : "REJECTED",
          rejectionReason: action === "REJECT" ? rejectionReason : null,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              clerkId: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
        },
      });
    });

    // Create notification for the manager using the user's id
    if (updatedRequest.user?.id) {
      await prisma.notification.create({
        data: {
          type:
            action === "APPROVE"
              ? "LEAVE_REQUEST_APPROVED"
              : "LEAVE_REQUEST_REJECTED",
          title: `Leave Request ${
            action === "APPROVE" ? "Approved" : "Rejected"
          }`,
          message:
            action === "APPROVE"
              ? `Your leave request from ${new Date(
                  updatedRequest.startDate
                ).toLocaleDateString()} to ${new Date(
                  updatedRequest.endDate
                ).toLocaleDateString()} has been approved.`
              : `Your leave request from ${new Date(
                  updatedRequest.startDate
                ).toLocaleDateString()} to ${new Date(
                  updatedRequest.endDate
                ).toLocaleDateString()} has been rejected. Reason: ${rejectionReason}`,
          userId: updatedRequest.user.id,
          read: false,
          createdAt: new Date(),
        },
      });
    }

    const transformedRequest = {
      ...updatedRequest,
      startDate: updatedRequest.startDate.toISOString(),
      endDate: updatedRequest.endDate.toISOString(),
      createdAt: updatedRequest.createdAt.toISOString(),
      updatedAt: updatedRequest.updatedAt.toISOString(),
    };

    return NextResponse.json(transformedRequest, { status: 200 });
  } catch (error: any) {
    console.error("Error updating leave request:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Failed to update leave request" },
      { status: 500 }
    );
  }
}
