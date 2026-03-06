"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// /@/utilities/db.ts
const postgres_1 = __importDefault(require("postgres"));
const sql = globalThis.postgresClient ||
    (0, postgres_1.default)(process.env.POSTGRES_URL, {
        ssl: "require",
        idle_timeout: 30,
        max: 14,
        connect_timeout: 10,
    });
// Save the client globally in dev to reuse across HMR reloads
globalThis.postgresClient = sql;
exports.default = sql;
