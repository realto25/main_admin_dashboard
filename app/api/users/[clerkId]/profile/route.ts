// api/users/[clerkId]/profile/route.ts
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

export async function GET(
  request: Request,
  { params }: { params: { clerkId: string } }
) {
  try {
    // Verify webhook signature
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new NextResponse("Missing svix headers", { status: 400 });
    }

    // Get the webhook payload
    const payload = await request.json();
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

    try {
      wh.verify(JSON.stringify(payload), {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err) {
      return new NextResponse("Invalid signature", { status: 400 });
    }

    // Return the user data
    return NextResponse.json(payload.data);
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
