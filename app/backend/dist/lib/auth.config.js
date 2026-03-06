"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authConfig = void 0;
// @/app/lib/auth.config.ts
const credentials_1 = __importDefault(require("next-auth/providers/credentials"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../utilities/db"));
// --- Auth config ---
exports.authConfig = {
    providers: [
        (0, credentials_1.default)({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
                username: { label: "Username", type: "text" },
                register: { label: "Register?", type: "boolean" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password)
                    return null;
                const rows = await (0, db_1.default) `
          SELECT * FROM ssu_users WHERE email = ${credentials.email} LIMIT 1
        `;
                const existingUser = rows[0];
                // Registration
                if (credentials.register && !existingUser) {
                    const salt = await bcryptjs_1.default.genSalt(10);
                    const hashedPassword = await bcryptjs_1.default.hash(credentials.password, salt);
                    const newUserRows = await (0, db_1.default) `
            INSERT INTO ssu_users (email, username, password_hash, role)
            VALUES (${credentials.email}, ${credentials.username || credentials.email}, ${hashedPassword}, 'user')
            RETURNING *
          `;
                    return newUserRows[0] || null;
                }
                // Login
                if (!existingUser)
                    return null;
                const isValid = await bcryptjs_1.default.compare(credentials.password, existingUser.password_hash);
                if (!isValid)
                    return null;
                return existingUser;
            },
        }),
    ],
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user, }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token, }) {
            // Ensure session.user has id and role
            const user = session.user;
            user.id = token.id;
            user.role = token.role;
            return session;
        },
    },
    pages: {
        signIn: "/auth/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
