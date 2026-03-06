"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
function generateAccessToken(user) {
    return jsonwebtoken_1.default.sign(user, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
}
function generateRefreshToken(user) {
    return jsonwebtoken_1.default.sign(user, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
}
