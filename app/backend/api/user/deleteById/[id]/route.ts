import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { corsHeaders } from "../../../../utilities/cors";
import sql from "../../../../utilities/db";

// Only include fields that exist in your schema
type ApiUser = {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
};

function verifyToken(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
    console.log("Token verified, payload:", payload);
    return payload as { id: string; email: string; iat: number; exp: number };
  } catch (err) {
    console.error("Token verification failed:", err);
    return null;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const userFromToken = verifyToken(_req);
    if (!userFromToken) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    console.log("User from token:", userFromToken, "UserId param:", id);

    // Ensure user can only delete themselves
    if (userFromToken.id?.toString().trim() !== id?.toString().trim()) {
      return NextResponse.json(
        { message: "Not authorized to delete this user" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Delete user
    const rows = await sql<ApiUser[]>`
      DELETE FROM users
      WHERE id = ${id}::uuid
      RETURNING
        id,
        username,
        email,
        is_admin
    `;

    if (!rows.length) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { message: "User deleted successfully", deletedUser: rows[0] },
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}