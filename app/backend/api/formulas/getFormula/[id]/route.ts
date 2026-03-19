import { NextResponse } from "next/server";
import sql from "../../../../utilities/db";
import { corsHeaders } from "../../../../utilities/cors";
import jwt from "jsonwebtoken";

function verifyToken(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
    return decoded as { id: string; email: string };
  } catch (err) {
    console.error("JWT verify error:", err);
    return null;
  }
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> } // NOTE: params is a Promise
) {
  try {
    // ----------------------
    // AUTH
    // ----------------------
    const user = verifyToken(req);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    // ----------------------
    // GET PARAMS
    // ----------------------
    const params = await ctx.params; // must await
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { error: "Formula ID is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // ----------------------
    // FETCH DATA
    // ----------------------
    const [formula] = await sql`
      SELECT * FROM formulas WHERE id = ${id}::uuid
    `;
    if (!formula) {
      return NextResponse.json(
        { error: "Formula not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const variables = await sql`
      SELECT * FROM formula_variables WHERE formula_id = ${id}::uuid
    `;

    const links = await sql`
      SELECT * FROM formula_links WHERE from_formula_id = ${id}::uuid
    `;

    return NextResponse.json(
      { formula, variables, links },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("Get formula error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}