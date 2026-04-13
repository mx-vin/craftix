import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "../../../../utilities/cors";
import sql from "../../../../utilities/db";

const defaultProfileImageUrl =
  "https://ssusocial.s3.amazonaws.com/profilepictures/ProfileIcon.png";

async function fetchImageArrayBuffer(url: string) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "image/png";
    const body = await res.arrayBuffer();
    return { body, contentType };
  } catch {
    return null;
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  if (!username) {
    return NextResponse.json(
      { message: "Username is required." },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    const [user] = await sql<{ profile_image: string | null }[]>`
      SELECT profile_image
      FROM users
      WHERE username = ${username}
      LIMIT 1
    `;

    const candidateUrl = user?.profile_image || defaultProfileImageUrl;
    const primary = await fetchImageArrayBuffer(candidateUrl);
    const chosen = primary ?? (await fetchImageArrayBuffer(defaultProfileImageUrl));

    if (!chosen) {
      return NextResponse.json(
        { message: "Image fetch failed." },
        { status: 502, headers: corsHeaders }
      );
    }

    return new NextResponse(chosen.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": chosen.contentType,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { message: err.message || "Server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}