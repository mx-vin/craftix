// @/utilities/fetchPosts.ts
 

export type Post = {
  id: string;
  userId: string;
  username?: string;
  content: string;
  imageUri: string | null;
  isSensitive: boolean;
  hasOffensiveText: boolean;
  created_at: string;
  date?: string;
};

import sql from "./db";

export default async function fetchPosts(query: string): Promise<Post[]> {
  const rows = await sql<Post[]>`
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
