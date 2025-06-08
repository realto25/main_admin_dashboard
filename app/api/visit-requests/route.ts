// api/visit-requests/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

// Helper function for retrying database operations
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      if (error.code === "P1001") {
        console.warn(
          `Database connection failed (attempt ${i + 1}/${maxRetries}). Retrying...`,
          { error: error.message }
        );
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 500));
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
        qrCode: request.status === "APPROVED" && request.qrCode ? request.qrCode : null,
        expiresAt:
          request.status === "APPROVED" && request.expiresAt
            ? request.expiresAt.toISOString()
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
            },
          },
        });
      });
      console.log("All visit requests fetched:", data.length);

      const transformedData = data.map((request) => ({
        id: request.id,
        status: request.status,
        date: request.date.toISOString(),
        time: request.time,
        name: request.name,
        email: request.email,
        phone: request.phone,
        qrCode: request.status === "APPROVED" && request.qrCode ? request.qrCode : null,
        expiresAt:
          request.status === "APPROVED" && request.expiresAt
            ? request.expiresAt.toISOString()
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
      qrCode: request.status === "APPROVED" && request.qrCode ? request.qrCode : null,
      expiresAt:
        request.status === "APPROVED" && request.expiresAt
          ? request.expiresAt.toISOString()
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
          message: "Unable to connect to the database. Please try again in a few moments.",
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

    // Handle new visit request submission
    if (!action || action === "visit-requests") {
      const { clerkId, plotId, visitorName, email, phone, visitDate, visitTime } = body;

      // Validate input
      if (!visitorName?.trim()) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
      }
      if (!email?.trim()) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }
      if (!phone?.trim()) {
        return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
      }
      if (!visitDate) {
        return NextResponse.json({ error: "Visit date is required" }, { status: 400 });
      }
      if (!visitTime?.trim()) {
        return NextResponse.json({ error: "Visit time is required" }, { status: 400 });
      }
      if (!plotId?.trim()) {
        return NextResponse.json({ error: "Plot ID is required" }, { status: 400 });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
      }

      // Validate date format
      const date = new Date(visitDate);
      if (isNaN(date.getTime())) {
        return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
      }

      // Validate time format (e.g., HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(visitTime.trim())) {
        return NextResponse.json({ error: "Invalid time format (use HH:MM)" }, { status: 400 });
      }

      // Check if plot exists
      const plot = await withRetry(async () => {
        return await prisma.plot.findUnique({
          where: { id: plotId },
          include: { project: { select: { id: true, name: true } } },
        });
      });

      if (!plot) {
        console.log(`Plot with ID ${plotId} not found`);
        return NextResponse.json({ error: "Plot not found" }, { status: 404 });
      }

      // Check if plot is available
      if (plot.status !== "AVAILABLE") {
        console.log(`Plot ${plotId} is not available, status: ${plot.status}`);
        return NextResponse.json(
          { error: "Plot is not available for visits" },
          { status: 400 }
        );
      }

      // Find user if clerkId is provided
      let user = null;
      if (clerkId) {
        user = await withRetry(async () => {
          return await prisma.user.findUnique({ where: { clerkId } });
        });
        if (!user) {
          console.log(`User with clerkId ${clerkId} not found`);
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
      }

      // Check for duplicate visit request
      const existingRequest = await withRetry(async () => {
        return await prisma.visitRequest.findFirst({
          where: {
            plotId,
            OR: [
              ...(user ? [{ userId: user.id }] : []),
              { email: email.trim().toLowerCase() },
            ],
            status: { in: ["PENDING", "APPROVED", "ASSIGNED"] },
          },
        });
      });

      if (existingRequest) {
        console.log(`Duplicate visit request found for plot ${plotId}, user/email: ${user?.id || email}`);
        return NextResponse.json(
          { error: "You already have a pending visit request for this plot" },
          { status: 409 }
        );
      }

      // Create visit request
      const visitRequest = await withRetry(async () => {
        return await prisma.visitRequest.create({
          data: {
            name: visitorName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            date,
            time: visitTime.trim(),
            plotId,
            userId: user?.id,
            status: "PENDING",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
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

      // Create notification for user (if authenticated)
      if (user) {
        await prisma.notification.create({
          data: {
            type: "VISIT_REQUEST_SUBMITTED",
            title: "Visit Request Submitted",
            message: `Your visit request for ${plot.title} has been submitted successfully. You'll be notified once it's assigned to a manager.`,
            userId: user.id,
            read: false,
            createdAt: new Date(),
          },
        });
      }

      console.log(`Visit request created successfully: ${visitRequest.id}`);
      return NextResponse.json(visitRequest, { status: 201 });
    }

    // Handle accept action
    if (action === "accept") {
      const requestId = url.pathname.split('/')[3];
      const { clerkId, plotId, visitorName, visitDate, visitTime } = body;

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
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
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

    // Handle reject action
    if (action === "reject") {
      const requestId = url.pathname.split('/')[3];
      const { clerkId, reason } = body;

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

      if (!reason?.trim()) {
        return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
      }

      const updatedRequest = await withRetry(async () => {
        return await prisma.visitRequest.update({
          where: { id: requestId },
          data: {
            status: "REJECTED",
            rejectionReason: reason.trim(),
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
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error handling visit request:", {
      message: error.message,
      stack: error.stack,
    });
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Duplicate visit request detected" },
        { status: 409 }
      );
    }
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

    const manager = await withRetry(async () => {
      return await prisma.user.findFirst({
        where: { clerkId: managerClerkId, role: "MANAGER" },
      });
    });

    if (!manager) {
      return NextResponse.json(
        { error: "Invalid manager Clerk ID or user is not a manager" },
        { status: 400 }
      );
    }

    const currentRequest = await withRetry(async () => {
      return await prisma.visitRequest.findUnique({
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

    const updatedRequest = await withRetry(async () => {
      return await prisma.visitRequest.update({
        where: { id },
        data: {
          assignedManagerId: manager.id,
          status: "ASSIGNED",
          updatedAt: new Date(),
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
    });

    await prisma.notification.create({
      data: {
        type: "VISIT_REQUEST_ASSIGNED",
        title: "New Visit Request Assignment",
        message: `You have been assigned to handle a visit request for ${currentRequest.plot.title}. Please review and accept/reject.`,
        userId: manager.id,
        read: false,
        createdAt: new Date(),
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
          createdAt: new Date(),
        },
      });
    }

    console.log(`Visit request ${id} assigned to manager ${manager.id}`);
    return NextResponse.json(updatedRequest);
  } catch (error: any) {
    console.error("Error assigning manager:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Failed to assign manager" },
      { status: 500 }
    );
  }
}
