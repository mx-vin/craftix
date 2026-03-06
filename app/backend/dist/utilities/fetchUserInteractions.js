"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = fetchUserInteractions;
const db_1 = __importDefault(require("./db"));
/**
 * Fetch user interactions from the database.
 * @param userId - The userId of the user.
 * @returns An object containing the user's interactions.
 */
async function fetchUserInteractions(userId) {
    try {
        if (!userId) {
            throw new Error("User ID is required to fetch user interactions.");
        }
        const [likesResult, commentsResult, followingsResult] = await Promise.all([
            fetchLikes(userId),
            fetchComments(userId),
            fetchFollowings(userId),
        ]);
        return {
            likes: likesResult,
            comments: commentsResult,
            followings: followingsResult,
        };
    }
    catch (error) {
        console.error(`Error fetching user interactions: ${error.message}`);
        throw error;
    }
}
async function fetchLikes(userId) {
    const result = await (0, db_1.default) `
    SELECT post_id::text, created_at::text
    FROM likes
    WHERE user_id = ${userId}
  `;
    return result;
}
async function fetchComments(userId) {
    const result = await (0, db_1.default) `
    SELECT comment_id::text, post_id::text, comment_content AS content, created_at::text
    FROM comments
    WHERE user_id = ${userId}
  `;
    return result;
}
async function fetchFollowings(userId) {
    const result = await (0, db_1.default) `
    SELECT user_id::text, follower_id::text, created_at::text
    FROM followers
    WHERE follower_id = ${userId}
  `;
    return result;
}
