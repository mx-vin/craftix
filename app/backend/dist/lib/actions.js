'use server';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const react_1 = require("next-auth/react"); // v5 recommended import
async function authenticate(prevState, formData) {
    try {
        // Convert FormData to a plain object
        const data = Object.fromEntries(formData.entries());
        // Call NextAuth signIn
        const result = await (0, react_1.signIn)('credentials', {
            redirect: false,
            ...data,
        });
        // Check for errors safely
        if (result && !result.ok) {
            if (result.error === 'CredentialsSignin') {
                return 'Invalid credentials.';
            }
            return 'Something went wrong.';
        }
        return null; // no error
    }
    catch (err) {
        console.error('Authentication error:', err);
        return 'Something went wrong.';
    }
}
