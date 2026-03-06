'use server';

import { signIn as nextAuthSignIn } from 'next-auth/react'; // v5 recommended import
import type { SignInResponse } from 'next-auth/react';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
): Promise<string | null> {
  try {
    // Convert FormData to a plain object
    const data: Record<string, string> = Object.fromEntries(formData.entries()) as Record<
      string,
      string
    >;

    // Call NextAuth signIn
    const result: SignInResponse | undefined = await nextAuthSignIn('credentials', {
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
  } catch (err: unknown) {
    console.error('Authentication error:', err);
    return 'Something went wrong.';
  }
}