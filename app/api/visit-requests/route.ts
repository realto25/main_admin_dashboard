import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

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

// Function to generate QR code
async function generateQRCode(data: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(data);
    return qrCodeDataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clerkId = searchParams.get("clerkId");
    const userId = searchParams.get("userId");
    const getManagers = searchParams.get("getManagers");
    const role = searchParams.get("role");

    if (getManagers === "true") {
      console.log("Fetching managers...");
      const managers = await withRetry(async () => {
        return await prisma.user.findMany({
          where: { role: "MANAGER" },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            clerkId: true,
            _count: {
              select: {
                assignedVisitRequests: true,
                assignedBuyRequests: true,
              },
            },
          },
        });
      });
      console.log("Managers fetched:", managers.length);

      return NextResponse.json(
        managers.map((manager) => ({
          ...manager,
          stats: {
            totalAssignments:
              manager._count.assignedVisitRequests +
              manager._count.assignedBuyRequests,
            visitRequests: manager._count.assignedVisitRequests,
            buyRequests: manager._count.assignedBuyRequests,
          },
        }))
      );
    }

    let user;
    if (clerkId) {
      console.log(`Fetching user with clerkId: ${clerkId}`);
      user = await withRetry(async () => {
        return await prisma.user.findUnique({ where: { clerkId } });
      });
      if (!user) {
        console.warn(`User with clerkId ${clerkId} not found`);
      }
    } else if (userId) {
      console.log(`Fetching user with userId: ${userId}`);
      user = await withRetry(async () => {
        return await prisma.user.findUnique({ where: { id: userId } });
      });
      if (!user) {
        console.warn(`User with userId ${userId} not found`);
      }
    }

    if (user && role === "MANAGER") {
      console.log(`Fetching visit requests for manager with id: ${user.id}`);
      const visitRequests = await withRetry(async () => {
        return await prisma.visitRequest.findMany({
          where: {
            assignedManagerId: user.id,
          },
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                clerkId: true,
              },
            },
            plot: {
              select: {
                id: true,
                title: true,
                location: true,
                projectId: true,
                project: { select: { id: true, name: true } },
              },
            },
            assignedManager: {
              select: { id: true, name: true, email: true, phone: true, clerkId: true },
              where: { role: "MANAGER" },
            },
          },
        });
      });
      console.log(`Visit requests for manager ${user.id}:`, visitRequests.length);

      const transformedData = visitRequests.map((request) => ({
        id: request.id,
        status: request.status,
        date: request.date.toISOString(),
        time: request.time,
        name: request.name,
        email: request.email,
        phone: request.phone,
        qrCode:
          request.status === "APPROVED" && request.qrCode ? request.qrCode : null,
        expiresAt:
          request.status === "APPROVED"
            ? new Date(
                request.createdAt.getTime() + 24 * 60 * 60 * 1000
              ).toISOString()
            : null,
        title: request.plot?.title || "Plot Visit",
        projectName: request.plot?.project?.name || "Unknown Project",
        plotNumber: request.plot?.title || "N/A",
        plotId: request.plotId,
        userId: request.userId,
        createdAt: request.createdAt.toISOString(),
        updatedAt: request.updatedAt.toISOString(),
        plot: request.plot,
        user: request.user,
        assignedManager: request.assignedManager,
        rejectionReason: request.rejectionReason || null,
      }));

      return NextResponse.json(transformedData);
    }

    if (!clerkId && !userId) {
      console.log("Fetching all visit requests (admin mode)...");
      const data = await withRetry(async () => {
        return await prisma.visitRequest.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                clerkId: true,
              },
            },
            plot: {
              select: {
                id: true,
                title: true,
                location: true,
                projectId: true,
                project: { select: { id: true, name: true } },
              },
            },
            assignedManager: {
              select: { id: true, name: true, email: true, phone: true, clerkId: true },
              where: { role: "MANAGER" },
            },
          },
        });
      });
      console.log("All visit requests fetched:", data.length);
      return NextResponse.json(data);
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`Fetching visit requests for user with id: ${user.id}`);
    const visitRequests = await withRetry(async () => {
      return await prisma.visitRequest.findMany({
        where: {
          OR: [{ userId: user.id }, { email: user.email }],
        },
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              clerkId: true,
            },
          },
          plot: {
            select: {
              id: true,
              title: true,
              location: true,
              projectId: true,
              project: { select: { id: true, name: true } },
            },
          },
          assignedManager: {
            select: { id: true, name: true, email: true, phone: true, clerkId: true },
            where: { role: "MANAGER" },
          },
        },
      });
    });
    console.log(`Visit requests for user ${user.id}:`, visitRequests.length);

    const transformedData = visitRequests.map((request) => ({
      id: request.id,
      status: request.status,
      date: request.date.toISOString(),
      time: request.time,
      name: request.name,
      email: request.email,
      phone: request.phone,
      qrCode:
        request.status === "APPROVED" && request.qrCode ? request.qrCode : null,
      expiresAt:
        request.status === "APPROVED"
          ? new Date(
              request.createdAt.getTime() + 24 * 60 * 60 * 1000
            ).toISOString()
          : null,
      title: request.plot?.title || "Plot Visit",
      projectName: request.plot?.project?.name || "Unknown Project",
      plotNumber: request.plot?.title || "N/A",
      plotId: request.plotId,
      userId: request.userId,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
      plot: request.plot,
      user: request.user,
      assignedManager: request.assignedManager,
      rejectionReason: request.rejectionReason || null,
    }));

    return NextResponse.json(transformedData);
  } catch (error: any) {
    console.error("Error fetching visit requests:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    if (error.code === "P1001") {
      return NextResponse.json(
        {
          error: "Database connection error",
          message:
            "Unable to connect to the database. Please try again in a few moments.",
          code: "DB_CONNECTION_ERROR",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch visit requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.pathname.split('/').pop();
    const body = await request.json();
    const { clerkId, reason, plotId, visitorName, visitDate, visitTime } = body;

    console.log(`POST request received for action: ${action}, requestId: ${url.pathname.split('/')[3]}`);

    if (action === "accept") {
      const requestId = url.pathname.split('/')[3];
      
      const visitRequest = await withRetry(async () => {
        return await prisma.visitRequest.findUnique({
          where: { id: requestId },
          include: {
            plot: {
              select: {
                id: true,
                title: true,
                location: true,
                project: { select: { id: true, name: true } },
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                clerkId: true,
              },
            },
            assignedManager: {
              select: { id: true, name: true, email: true, phone: true, clerkId: true },
            },
          },
        });
      });

      if (!visitRequest) {
        console.log(`Visit request ${requestId} not found`);
        return NextResponse.json(
          { error: "Visit request not found" },
          { status: 404 }
        );
      }

      if (visitRequest.status !== "ASSIGNED") {
        console.log(`Visit request ${requestId} is not in ASSIGNED state, current status: ${visitRequest.status}`);
        return NextResponse.json(
          { error: "Visit request is not in an ASSIGNED state" },
          { status: 400 }
        );
      }

      const manager = await withRetry(async () => {
        return await prisma.user.findUnique({
          where: { clerkId },
        });
      });

      if (!manager || manager.role !== "MANAGER") {
        console.log(`Invalid manager for clerkId ${clerkId}, role: ${manager?.role}`);
        return NextResponse.json(
          { error: "Invalid manager" },
          { status: 403 }
        );
      }

      if (visitRequest.assignedManager?.clerkId !== manager.clerkId) {
        console.log(`Manager ${manager.clerkId} is not assigned to visit request ${requestId}`);
        return NextResponse.json(
          { error: "You are not assigned to this visit request" },
          { status: 403 }
        );
      }

      const qrData = `visit://request/${requestId}?status=APPROVED&plot=${plotId}&visitor=${visitorName}&date=${visitDate}&time=${visitTime}`;
      const qrCodeDataUrl = await generateQRCode(qrData);

      const updatedRequest = await withRetry(async () => {
        return await prisma.visitRequest.update({
          where: { id: requestId },
          data: {
            status: "APPROVED",
            qrCode: qrCodeDataUrl,
            updatedAt: new Date(),
          },
          include: {
            user: true,
            plot: {
              include: { project: true },
            },
            assignedManager: true,
          },
        });
      });

      if (updatedRequest.user) {
        await prisma.notification.create({
          data: {
            type: "VISIT_REQUEST_APPROVED",
            title: "Visit Request Approved",
            message: `Your visit request for ${updatedRequest.plot.title} has been approved by the manager.`,
            userId: updatedRequest.user.id,
            read: false,
            createdAt: new Date(),
          },
        });
      }

      console.log(`Visit request ${requestId} approved successfully`);
      return NextResponse.json(updatedRequest, { status: 200 });
    }

    if (action === "reject") {
      const requestId = url.pathname.split('/')[3];

      const visitRequest = await withRetry(async () => {
        return await prisma.visitRequest.findUnique({
          where: { id: requestId },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                clerkId: true,
              },
            },
            plot: {
              select: {
                id: true,
                title: true,
                location: true,
                project: { select: { id: true, name: true } },
              },
            },
            assignedManager: {
              select: { id: true, name: true, email: true, phone: true, clerkId: true },
            },
          },
        });
      });

      if (!visitRequest) {
        console.log(`Visit request ${requestId} not found`);
        return NextResponse.json(
          { error: "Visit request not found" },
          { status: 404 }
        );
      }

      if (visitRequest.status !== "ASSIGNED") {
        console.log(`Visit request ${requestId} is not in ASSIGNED state, current status: ${visitRequest.status}`);
        return NextResponse.json(
          { error: "Visit request is not in an ASSIGNED state" },
          { status: 400 }
        );
      }

      const manager = await withRetry(async () => {
        return await prisma.user.findUnique({
          where: { clerkId },
        });
      });

      if (!manager || manager.role !== "MANAGER") {
        console.log(`Invalid manager for clerkId ${clerkId}, role: ${manager?.role}`);
        return NextResponse.json(
          { error: "Invalid manager" },
          { status: 403 }
        );
      }

      if (visitRequest.assignedManager?.clerkId !== manager.clerkId) {
        console.log(`Manager ${manager.clerkId} is not assigned to visit request ${requestId}`);
        return NextResponse.json(
          { error: "You are not assigned to this visit request" },
          { status: 403 }
        );
      }

      const updatedRequest = await withRetry(async () => {
        return await prisma.visitRequest.update({
          where: { id: requestId },
          data: {
            status: "REJECTED",
            rejectionReason: reason,
            updatedAt: new Date(),
          },
          include: {
            user: true,
            plot: {
              include: { project: true },
            },
            assignedManager: true,
          },
        });
      });

      if (updatedRequest.user) {
        await prisma.notification.create({
          data: {
            type: "VISIT_REQUEST_REJECTED",
            title: "Visit Request Rejected",
            message: `Your visit request for ${updatedRequest.plot.title} has been rejected by the manager. Reason: ${reason}`,
            userId: updatedRequest.user.id,
            read: false,
            createdAt: new Date(),
          },
        });
      }

      console.log(`Visit request ${requestId} rejected successfully`);
      return NextResponse.json(updatedRequest, { status: 200 });
    }

    console.log(`Invalid action: ${action}`);
    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error handling visit request:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, managerClerkId } = await request.json();

    if (!id || !managerClerkId) {
      return NextResponse.json(
        { error: "Request ID and manager Clerk ID are required" },
        { status: 400 }
      );
    }

    const manager = await prisma.user.findFirst({
      where: { clerkId: managerClerkId, role: "MANAGER" },
    });

    if (!manager) {
      return NextResponse.json(
        { error: "Invalid manager Clerk ID or user is not a manager" },
        { status: 400 }
      );
    }

    const currentRequest = await prisma.visitRequest.findUnique({
      where: { id },
      include: {
        plot: {
          select: {
            id: true,
            title: true,
            location: true,
            project: { select: { id: true, name: true } },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            clerkId: true,
          },
        },
      },
    });

    if (!currentRequest) {
      return NextResponse.json(
        { error: "Visit request not found" },
        { status: 404 }
      );
    }

    if (currentRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Visit request is not in a PENDING state" },
        { status: 400 }
      );
    }

    const updatedRequest = await prisma.visitRequest.update({
      where: { id },
      data: {
        assignedManagerId: manager.id,
        status: "ASSIGNED",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            clerkId: true,
          },
        },
        plot: {
          select: {
            id: true,
            title: true,
            location: true,
            project: { select: { id: true, name: true } },
          },
        },
        assignedManager: {
          select: { id: true, name: true, email: true, phone: true, clerkId: true },
        },
      },
    });

    await prisma.notification.create({
      data: {
        type: "VISIT_REQUEST_ASSIGNED",
        title: "New Visit Request Assignment",
        message: `You have been assigned to handle a visit request for ${currentRequest.plot.title}. Please review and accept/reject.`,
        userId: manager.id,
        read: false,
      },
    });

    if (currentRequest.user) {
      await prisma.notification.create({
        data: {
          type: "VISIT_REQUEST_UPDATED",
          title: "Visit Request Updated",
          message: `Your visit request has been assigned to manager ${manager.name}. Waiting for manager's response.`,
          userId: currentRequest.user.id,
          read: false,
        },
      });
    }

    return NextResponse.json(updatedRequest);
  } catch (error: any) {
    console.error("Error assigning manager:", error);
    return NextResponse.json(
      { error: "Failed to assign manager" },
      { status: 500 }
    );
  }
}