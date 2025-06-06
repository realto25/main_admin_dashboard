// app/api/webhooks/clerk/route.ts
import { prisma } from "@/lib/prisma";
import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";

// Assert webhookSecret as string since we check for its existence
const webhookSecret = process.env.CLERK_WEBHOOK_SECRET as string;

if (!webhookSecret) {
  throw new Error(
    "Please add CLERK_WEBHOOK_SECRET to your environment variables"
  );
}

interface ClerkUserData {
  id: string;
  email_addresses: {
    id: string;
    email_address: string;
  }[];
  first_name: string | null;
  last_name: string | null;
  phone_numbers: {
    phone_number: string;
  }[];
  primary_email_address_id: string | null;
  image_url: string | null;
  public_metadata: {
    role?: "guest" | "client" | "manager";
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headerPayload = await headers();
    const svixId = headerPayload.get("svix-id");
    const svixTimestamp = headerPayload.get("svix-timestamp");
    const svixSignature = headerPayload.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Error occurred -- no svix headers", { status: 400 });
    }

    const wh = new Webhook(webhookSecret);
    let evt: WebhookEvent;

    try {
      evt = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as WebhookEvent;
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return new Response("Invalid signature", { status: 400 });
    }

    // Only process user events
    if (!evt.type.startsWith("user.")) {
      return NextResponse.json({ message: "Ignoring non-user event" });
    }

    const userData = evt.data as ClerkUserData;
    const eventType = evt.type;

    console.log(`Webhook received: ${eventType}`, userData.id);

    // Safely get primary email
    let primaryEmail = "";
    if (userData.primary_email_address_id) {
      const emailObj = userData.email_addresses.find(
        (email) => email.id === userData.primary_email_address_id
      );
      primaryEmail = emailObj?.email_address || "";
    } else if (userData.email_addresses.length > 0) {
      primaryEmail = userData.email_addresses[0]?.email_address || "";
    }

    // Construct name safely
    const firstName = userData.first_name || "";
    const lastName = userData.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim() || "User";

    // Get phone number safely
    const phone = userData.phone_numbers[0]?.phone_number || "";

    // Get role with default
    const role = userData.public_metadata.role || "guest";

    switch (eventType) {
      case "user.created":
        await handleUserCreated({
          clerkId: userData.id,
          email: primaryEmail,
          name: fullName,
          phone,
          role,
          imageUrl: userData.image_url || "",
        });
        break;

      case "user.updated":
        await handleUserUpdated({
          clerkId: userData.id,
          email: primaryEmail,
          name: fullName,
          phone,
          role,
          imageUrl: userData.image_url || "",
        });
        break;

      case "user.deleted":
        await handleUserDeleted(userData.id);
        break;

      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleUserCreated(userData: {
  clerkId: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  imageUrl: string;
}) {
  try {
    await prisma.user.create({
      data: {
        clerkId: userData.clerkId,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || null,
        role: userData.role.toUpperCase() as "GUEST" | "CLIENT" | "MANAGER",
      },
    });

    console.log(`User created in database: ${userData.clerkId}`);
  } catch (error) {
    // Type guard to check if error is a Prisma error
    if (error && typeof error === "object" && "code" in error) {
      // Now TypeScript knows error has a code property
      if (error.code === "P2002") {
        console.log(
          `User ${userData.clerkId} already exists, skipping creation`
        );
        return;
      }
    }

    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

async function handleUserUpdated(userData: {
  clerkId: string;
  email: string;
  name: string;
  phone: string;
  role: string;
  imageUrl: string;
}) {
  try {
    await prisma.user.upsert({
      where: { clerkId: userData.clerkId },
      update: {
        name: userData.name,
        email: userData.email,
        phone: userData.phone || null,
        role: userData.role.toUpperCase() as "GUEST" | "CLIENT" | "MANAGER",
      },
      create: {
        clerkId: userData.clerkId,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || null,
        role: userData.role.toUpperCase() as "GUEST" | "CLIENT" | "MANAGER",
      },
    });

    console.log(`User updated in database: ${userData.clerkId}`);
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

async function handleUserDeleted(clerkId: string) {
  try {
    await prisma.user.delete({
      where: { clerkId },
    });

    console.log(`User deleted from database: ${clerkId}`);
  } catch (error) {
    console.error("Error deleting user:", error);

    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string };
      if (prismaError.code === "P2025") {
        console.log(`User ${clerkId} not found in database, skipping deletion`);
        return;
      }
    }

    throw error;
  }
}
