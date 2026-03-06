"use strict";
// app/backend/lib/auth.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signOut = exports.signIn = exports.credentialsProvider = void 0;
exports.getUserByEmail = getUserByEmail;
const credentials_1 = __importDefault(require("next-auth/providers/credentials"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../utilities/db"));
const zod_1 = require("zod");
// --- Helper: fetch user by email ---
async function getUserByEmail(email) {
    try {
        const rows = await (0, db_1.default) `
      SELECT * FROM ssu_users WHERE email = ${email} LIMIT 1
    `;
        return rows[0] || null;
    }
    catch (err) {
        console.error("Failed to fetch user:", err);
        return null;
    }
}
// --- Credentials provider (backend-safe) ---
exports.credentialsProvider = (0, credentials_1.default)({
    name: "Credentials",
    credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
        if (!credentials)
            return null;
        const parsed = zod_1.z
            .object({
            email: zod_1.z.string().email(),
            password: zod_1.z.string().min(6),
        })
            .safeParse(credentials);
        if (!parsed.success)
            return null;
        const { email, password } = parsed.data;
        const user = await getUserByEmail(email);
        if (!user)
            return null;
        const isValid = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isValid)
            return null;
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            biography: user.biography,
        };
    },
});
// --- STUB EXPORTS for frontend-only functions ---
// These exist so backend compiles cleanly without importing frontend code
const signIn = async () => null;
exports.signIn = signIn;
const signOut = async () => null;
exports.signOut = signOut;
