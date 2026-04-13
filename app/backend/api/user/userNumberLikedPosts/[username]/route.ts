import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "../../../../utilities/cors";
import sql from "../../../../utilities/db";

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  if (!username?.trim()) {
    return NextResponse.json(
      { message: "username is required." },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    const ident = username.trim();
    const isUuid = /^[0-9a-fA-F-]{36}$/.test(ident);

    const rows = isUuid
      ? await sql<{ count: number }[]>`
          SELECT COUNT(*)::int AS count
          FROM post_likes
          WHERE user_id = ${ident}::uuid
        `
      : await sql<{ count: number }[]>`
          SELECT COUNT(*)::int AS count
          FROM post_likes l
          JOIN users u ON u.id = l.user_id
          WHERE u.username = ${ident}
        `;

    return NextResponse.json(rows?.[0]?.count ?? 0, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500, headers: corsHeaders }
    );
  }
}