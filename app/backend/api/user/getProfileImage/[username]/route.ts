import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "../../../../utilities/cors";
import sql from "../../../../utilities/db";

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await ctx.params;
    if (!username) return NextResponse.json({ success: false, message: "Username is required." }, { status: 400, headers: corsHeaders });

    const [user] = await sql`
      SELECT id, profile_image AS "profileImage"
      FROM users
      WHERE username = ${username}
      LIMIT 1
    `;

    if (!user) return NextResponse.json({ success: false, message: "User not found." }, { status: 404, headers: corsHeaders });

    const proxyUrl = new URL(`/api/user/profileImageProxy/${encodeURIComponent(username)}`, req.nextUrl.origin).toString();

    return NextResponse.json({ success: true, imageUri: proxyUrl }, { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error("Error fetching profile image:", error);
    return NextResponse.json({ success: false, message: error.message || "Server error." }, { status: 500, headers: corsHeaders });
  }
}