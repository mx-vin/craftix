// app/backend/api/formulas/createFormula/route.ts
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { corsHeaders } from "../../../utilities/cors";
import sql from "../../../utilities/db";

type FormulaCreateBody = {
  name: string;
  description?: string;
  data: Record<string, any>;
  folderId?: string | null;
};

// Verify JWT using your custom secret
function verifyToken(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
    return decoded as { id: string; email: string };
  } catch (err) {
    console.error("JWT verify error:", err);
    return null;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    // ----------------------
    // AUTH CHECK
    // ----------------------
    const userFromToken = verifyToken(req);

    if (!userFromToken) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    // ----------------------
    // INPUT
    // ----------------------
    const body: FormulaCreateBody = await req.json();
    const { name, description, data, folderId } = body;

    if (!name || !data) {
      return NextResponse.json(
        { success: false, error: "Missing fields" },
        { status: 400, headers: corsHeaders }
      );
    }

    // ----------------------
    // INSERT FORMULA
    // ----------------------
    const rows = await sql`
      INSERT INTO formulas (user_id, folder_id, name, description, data)
      VALUES (${userFromToken.id}::uuid, ${folderId ?? null}::uuid, ${name}, ${description ?? null}, ${data})
      RETURNING
        id,
        user_id AS "userId",
        folder_id AS "folderId",
        name,
        description,
        data,
        version,
        is_latest AS "isLatest",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `;

    return NextResponse.json(
      { success: true, formula: rows[0] },
      { status: 201, headers: corsHeaders }
    );
  } catch (err) {
    console.error("Create formula error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}