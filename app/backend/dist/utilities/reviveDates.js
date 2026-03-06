"use strict";
// @/utilities/reviveDates.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviveDates = reviveDates;
function reviveDates(data) {
    // Handle arrays
    if (Array.isArray(data)) {
        return data.map(item => reviveDates(item));
    }
    // Handle objects
    if (data !== null && typeof data === "object") {
        const result = {};
        for (const [key, value] of Object.entries(data)) {
            if (isDateString(value)) {
                result[key] = new Date(value);
            }
            else {
                result[key] = value;
            }
        }
        return result;
    }
    // Primitives (string, number, null, etc)
    return data;
}
function isDateString(value) {
    return (typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{300}Z$/.test(value));
}
