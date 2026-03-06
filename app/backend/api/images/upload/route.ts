import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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

export async function POST(req: NextRequest) {
  try {
    const { userId, fileName, fileData, postId } = await req.json();

    if (!userId || !fileName || !fileData) {
      return NextResponse.json({ message: "Missing parameters" }, { status: 400, headers: corsHeaders });
    }

    const s3Key = `user-images/${userId}/${fileName}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: s3Key,
        Body: Buffer.from(fileData, "base64"),
        ContentType: "image/png",
      })
    );

    // Insert into post_images if postId exists; otherwise, update user profile image
    if (postId) {
      await sql`
        INSERT INTO post_images (post_id, image_uri)
        VALUES (${postId}, ${s3Key})
      `;
    } else {
      await sql`
        UPDATE users
        SET profile_image = ${s3Key}
        WHERE id = ${userId}
      `;
    }

    return NextResponse.json({ message: "Upload successful", key: s3Key }, { status: 201, headers: corsHeaders });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ message: "Server error during upload" }, { status: 500, headers: corsHeaders });
  }
}
