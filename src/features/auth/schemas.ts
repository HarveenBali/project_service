import { z } from 'zod';

const email = z.string().trim().min(1, 'Email is required.').email('Enter a valid email address.');

const password = z
  .string()
  .min(8, 'Use at least 8 characters.')
  .regex(/[a-z]/, 'Include a lowercase letter.')
  .regex(/[A-Z]/, 'Include an uppercase letter.')
  .regex(/\d/, 'Include a number.');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required.'),
});

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your full name.').max(60, 'Name is too long.'),
    email,
    password,
    confirmPassword: z.string().min(1, 'Confirm your password.'),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match.' });

export const resetSchema = z.object({ email });

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;
export type ResetValues = z.infer<typeof resetSchema>;
