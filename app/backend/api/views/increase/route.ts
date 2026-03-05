import { NextResponse } from "next/server";
import sql from "@/utilities/db";
import { corsHeaders } from "@/utilities/cors";

const isUuid = (val: string) => /^[0-9a-fA-F-]{36}$/.test(val);

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const { userId, postId } = await req.json();

    if (!isUuid(userId) || !isUuid(postId)) {
      return NextResponse.json({ error: "Invalid userId or postId" }, { status: 400, headers: corsHeaders });
    }

    // Only insert if it doesn't exist already
    const existing = await sql`
      SELECT 1 FROM views WHERE user_id = ${userId}::uuid AND post_id = ${postId}::uuid
    `;

    if (existing.length === 0) {
      await sql`
        INSERT INTO views (user_id, post_id)
        VALUES (${userId}::uuid, ${postId}::uuid)
      `;
    }

    // Mimic Mongo behavior: 200 OK, no body
    return new Response(null, { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error("Error adding view:", error);
    return NextResponse.json(
      { error: "Failed to add view", details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
