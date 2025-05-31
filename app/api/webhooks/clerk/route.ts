// pages/api/webhooks/clerk.ts
import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createOrUpdateUser } from "@/lib/api";

export async function POST(req: Request) {
  const payload = await req.json();
  const headersList = headers();
  
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(
      JSON.stringify(payload),
      headersList.get("svix-signature")!,
      headersList.get("svix-timestamp")!,
      headersList.get("svix-id")!
    ) as WebhookEvent;
  } catch (err) {
    return new Response("Invalid signature", { status: 400 });
  }

  const { id, email_addresses, first_name, last_name, phone_numbers, primary_email_address_id, public_metadata } = evt.data;
  
  const primaryEmail = email_addresses?.find(
    email => email.id === primary_email_address_id
  )?.email_address;

  try {
    await createOrUpdateUser({
      clerkId: id!,
      email: primaryEmail || "",
      name: `${first_name} ${last_name}`.trim() || "User",
      phone: phone_numbers?.[0]?.phone_number,
      role: (public_metadata?.role as "guest" | "client" | "manager") || "guest"
    });
    return new Response("User updated", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Database error", { status: 500 });
  }
}
