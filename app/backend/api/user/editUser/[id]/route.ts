import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { corsHeaders } from "../../../../utilities/cors";
import sql from "../../../../utilities/db";

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    // ----------------------
    // UNWRAP PARAMS
    // ----------------------
    const params = await ctx.params;
    const userId = params.id;

    // ----------------------
    // AUTH CHECK
    // ----------------------
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Missing token" },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
    } catch (err: any) {
      console.error("JWT verify error:", err);
      return NextResponse.json(
        { success: false, message: "Invalid or expired token", error: String(err) },
        { status: 401, headers: corsHeaders }
      );
    }

    // ----------------------
    // DEBUG LOGS
    // ----------------------
    console.log("Decoded token payload:", decoded);
    console.log("URL param userId:", userId);
    console.log(
      "Type check & trimmed comparison:",
      decoded.id?.toString().trim(),
      userId?.toString().trim(),
      decoded.id?.toString().trim() === userId?.toString().trim()
    );

    // ----------------------
    // AUTHORIZATION CHECK
    // ----------------------
    if (decoded.id?.toString().trim() !== userId?.toString().trim()) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403, headers: corsHeaders }
      );
    }

    // ----------------------
    // INPUT
    // ----------------------
    const body = await req.json();
    const username = body.username?.trim() || null;
    const email = body.email?.trim() || null;
    const password = body.password?.trim() || null;
    const biography = body.biography?.trim() || null;
    const profileImage = body.profileImage?.trim() || null;

    const [existingUser] = await sql`
      SELECT * FROM users WHERE id = ${userId}
    `;

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // ----------------------
    // USERNAME CONFLICT CHECK
    // ----------------------
    if (username) {
      const [conflict] = await sql`
        SELECT id FROM users
        WHERE LOWER(username) = LOWER(${username})
        AND id <> ${userId}
      `;

      if (conflict) {
        return NextResponse.json(
          { success: false, message: "Username already taken" },
          { status: 409, headers: corsHeaders }
        );
      }
    }

    // ----------------------
    // PASSWORD HANDLING
    // ----------------------
    let hashedPassword = existingUser.password_hash;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // ----------------------
    // UPDATE USER
    // ----------------------
    const [updatedUser] = await sql`
      UPDATE users
      SET
        username = COALESCE(${username}, username),
        email = COALESCE(${email}, email),
        password_hash = ${hashedPassword},
        biography = COALESCE(${biography}, biography),
        profile_image = COALESCE(${profileImage}, profile_image),
        updated_at = now()
      WHERE id = ${userId}
      RETURNING
        id,
        username,
        email,
        is_admin,
        profile_image AS "profileImage",
        COALESCE(biography, '') AS biography,
        created_at
    `;

    return NextResponse.json(
      { success: true, user: updatedUser },
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error("Edit user error:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}