"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
const server_1 = require("next/server");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const verifyToken = (req) => {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) {
        return server_1.NextResponse.json({ message: "Token missing or invalid" }, { status: 401 });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, ACCESS_TOKEN_SECRET);
        if (!decoded.id) {
            return server_1.NextResponse.json({ message: "Token does not contain valid user information" }, { status: 400 });
        }
        return decoded;
    }
    catch {
        return server_1.NextResponse.json({ message: "Invalid or expired token" }, { status: 403 });
    }
};
exports.verifyToken = verifyToken;
