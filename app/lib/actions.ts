'use server';

import { signIn } from './auth';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    // v5 signIn returns a Promise with the result
    const result = await signIn('credentials', { 
      redirect: false, 
      ...Object.fromEntries(formData),
    });

    if (!result?.ok) {
      // result.error contains the error message from NextAuth
      if (result?.error === 'CredentialsSignin') {
        return 'Invalid credentials.';
      } else {
        return 'Something went wrong.';
      }
    }

    return null; // no error
  } catch (error: any) {
    console.error('Authentication error:', error);
    return 'Something went wrong.';
  }
}