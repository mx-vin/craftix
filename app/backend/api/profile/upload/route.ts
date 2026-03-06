import { NextResponse } from "next/server";
import { corsHeaders } from "../../../utilities/cors";
import sql from "../../../utilities/db";

// Preflight for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// POST /api/profile/upload
// Expects: { user_id: string, image_url: string }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, image_url } = body as { user_id?: string; image_url?: string };

    if (!user_id) {
      return NextResponse.json(
        { message: "user_id is required" },
        { status: 400, headers: corsHeaders }
      );
    }
    if (!image_url || typeof image_url !== "string" || !image_url.trim()) {
      return NextResponse.json(
        { message: "image_url is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const isHttpUrl = /^(https?:)\/\//i.test(image_url);
    if (!isHttpUrl) {
      return NextResponse.json(
        { message: "image_url must be an http(s) URL" },
        { status: 400, headers: corsHeaders }
      );
    }

    const userRows = await sql<{ id: string; profile_image: string | null }[]>`
      SELECT id::text, profile_image
      FROM users
      WHERE id = ${user_id}::uuid
      LIMIT 1
    `;
    if (userRows.length === 0) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const updated = await sql<{ profile_image: string | null }[]>`
      UPDATE users
      SET profile_image = ${image_url}
      WHERE id = ${user_id}::uuid
      RETURNING profile_image
    `;

    return NextResponse.json(
      { message: "Profile image updated successfully", profileImage: updated?.[0]?.profile_image ?? image_url },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Error uploading profile image:", error);
    return NextResponse.json(
      { message: "Failed to upload profile image", error: String(error?.message ?? error) },
      { status: 500, headers: corsHeaders }
    );
  }
}
