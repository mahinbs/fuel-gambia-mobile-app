import { z } from 'zod';

export const phoneNumberSchema = z
  .string()
  .regex(/^\+220\d{7}$/, 'Invalid Gambian phone number format (+220XXXXXXXX)')
  .min(11)
  .max(11);

export const otpSchema = z.string().length(6, 'OTP must be 6 digits');

export const amountSchema = z
  .number()
  .min(100, 'Minimum amount is 100 GMD')
  .max(10000, 'Maximum amount is 10,000 GMD');

export const documentUploadSchema = z.object({
  governmentId: z.string().optional(), // Validated manually in component
  employmentLetter: z.string().optional(), // Validated manually in component
  departmentName: z.string().min(2, 'Department name must be at least 2 characters'),
});

export const fuelPurchaseSchema = z.object({
  fuelType: z.enum(['PETROL', 'DIESEL']),
  amount: amountSchema,
});
