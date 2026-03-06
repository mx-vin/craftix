"use strict";
// @/utilities/fetchPosts.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = fetchPosts;
const db_1 = __importDefault(require("./db"));
async function fetchPosts(query) {
    const rows = await (0, db_1.default) `
    SELECT 
      p.post_id::text                         AS "id",
      p.user_id::text                         AS "userId",
      u.username                              AS "username",
      p.content                               AS "content",
      p.image_uri                              AS "imageUri",
      p.is_sensitive                           AS "isSensitive",
      p.has_offensive_text                     AS "hasOffensiveText",
      p.created_at                             AS "created_at",
      p.created_at                             AS "date"
    FROM posts p
    LEFT JOIN ssu_users u ON u.user_id = p.user_id
    WHERE p.content ILIKE ${'%' + query + '%'}
    ORDER BY p.created_at DESC
  `;
    return rows;
}
