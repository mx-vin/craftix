"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsHeaders = void 0;
// ssu-@/app/@/utilities/cors.ts
exports.corsHeaders = {
    "Access-Control-Allow-Origin": "*", // allows any origin (Vercel, localhost, etc.)
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
