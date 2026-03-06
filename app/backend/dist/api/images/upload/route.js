"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPTIONS = OPTIONS;
exports.POST = POST;
const server_1 = require("next/server");
const client_s3_1 = require("@aws-sdk/client-s3");
const db_1 = __importDefault(require("../../../utilities/db"));
const cors_1 = require("../../../utilities/cors");
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
async function OPTIONS() {
    return server_1.NextResponse.json(null, { status: 200, headers: cors_1.corsHeaders });
}
async function POST(req) {
    try {
        const { userId, fileName, fileData, postId } = await req.json();
        if (!userId || !fileName || !fileData) {
            return server_1.NextResponse.json({ message: "Missing parameters" }, { status: 400, headers: cors_1.corsHeaders });
        }
        const s3Key = `user-images/${userId}/${fileName}`;
        await s3Client.send(new client_s3_1.PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key,
            Body: Buffer.from(fileData, "base64"),
            ContentType: "image/png",
        }));
        // Insert into post_images if postId exists; otherwise, update user profile image
        if (postId) {
            await (0, db_1.default) `
        INSERT INTO post_images (post_id, image_uri)
        VALUES (${postId}, ${s3Key})
      `;
        }
        else {
            await (0, db_1.default) `
        UPDATE users
        SET profile_image = ${s3Key}
        WHERE id = ${userId}
      `;
        }
        return server_1.NextResponse.json({ message: "Upload successful", key: s3Key }, { status: 201, headers: cors_1.corsHeaders });
    }
    catch (err) {
        console.error("Upload error:", err);
        return server_1.NextResponse.json({ message: "Server error during upload" }, { status: 500, headers: cors_1.corsHeaders });
    }
}
