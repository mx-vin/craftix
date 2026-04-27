import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import sql from "../../../../utilities/db";
import { corsHeaders } from "../../../../utilities/cors";

function verifyToken(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    return jwt.verify(authHeader.split(" ")[1], process.env.ACCESS_TOKEN_SECRET!) as {
      id: string;
      email: string;
    };
  } catch {
    return null;
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const user = verifyToken(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const [folder] = await sql`
      SELECT id
      FROM folders
      WHERE id = ${id}::uuid
        AND user_id = ${user.id}::uuid
      LIMIT 1
    `;

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404, headers: corsHeaders });
    }

    await sql`
      UPDATE formulas
      SET folder_id = NULL
      WHERE folder_id = ${id}::uuid
        AND user_id = ${user.id}::uuid
    `;

    await sql`
      DELETE FROM folders
      WHERE id = ${id}::uuid
        AND user_id = ${user.id}::uuid
    `;

    return NextResponse.json({ success: true }, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("deleteFolder error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500, headers: corsHeaders });
  }
}