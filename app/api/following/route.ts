import { NextResponse } from "next/server";
import sql from "@/utilities/db";
import { corsHeaders } from "@/utilities/cors";

export async function GET() {
  try {
    const rows = await sql`
      SELECT * FROM followers
      ORDER BY created_at DESC
    `;
    return NextResponse.json(rows, { status: 200, headers: corsHeaders });
  } catch (err: any) {
    console.error("Error fetching following relationships:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500, headers: corsHeaders });
  }
}
