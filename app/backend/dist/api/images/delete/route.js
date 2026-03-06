"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPTIONS = OPTIONS;
exports.DELETE = DELETE;
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
async function DELETE(req) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const postId = searchParams.get("postId");
    const userId = searchParams.get("userId");
    if (!key) {
        return server_1.NextResponse.json({ message: "Missing key" }, { status: 400, headers: cors_1.corsHeaders });
    }
    try {
        await s3Client.send(new client_s3_1.DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: key }));
        if (postId) {
            await (0, db_1.default) `
        DELETE FROM post_images
        WHERE post_id = ${postId} AND image_uri = ${key}
      `;
        }
        else if (userId) {
            await (0, db_1.default) `
        UPDATE users
        SET profile_image = NULL
        WHERE id = ${userId} AND profile_image = ${key}
      `;
        }
        return server_1.NextResponse.json({ message: "Deleted successfully" }, { status: 200, headers: cors_1.corsHeaders });
    }
    catch (err) {
        console.error("Delete error:", err);
        return server_1.NextResponse.json({ message: "Server error during delete" }, { status: 500, headers: cors_1.corsHeaders });
    }
}
