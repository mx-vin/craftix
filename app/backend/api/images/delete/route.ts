import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import sql from "../../../utilities/db";
import { corsHeaders } from "../../../utilities/cors";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function OPTIONS() {
  return NextResponse.json(null, { status: 200, headers: corsHeaders });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const postId = searchParams.get("postId");
  const userId = searchParams.get("userId");

  if (!key) {
    return NextResponse.json({ message: "Missing key" }, { status: 400, headers: corsHeaders });
  }

  try {
    await s3Client.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME!, Key: key }));

    if (postId) {
      await sql`
        DELETE FROM post_images
        WHERE post_id = ${postId} AND image_uri = ${key}
      `;
    } else if (userId) {
      await sql`
        UPDATE users
        SET profile_image = NULL
        WHERE id = ${userId} AND profile_image = ${key}
      `;
    }

    return NextResponse.json({ message: "Deleted successfully" }, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json({ message: "Server error during delete" }, { status: 500, headers: corsHeaders });
  }
}
