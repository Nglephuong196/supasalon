import { z } from "zod/v4";

/**
 * Validation schemas for Booking API endpoints.
 * Using Zod for type-safe request validation.
 */

export const createBookingSchema = z.object({
  customerId: z
    .union([z.number(), z.string().transform((val) => parseInt(val, 10))])
    .pipe(z.number().int().positive()),
  branchId: z
    .union([z.number(), z.string().transform((val) => parseInt(val, 10))])
    .pipe(z.number().int().positive())
    .optional(),
  guests: z
    .array(
      z.object({
        services: z.array(
          z.object({
            categoryId: z
              .union([z.number(), z.string().transform((val) => parseInt(val, 10))])
              .optional(),
            serviceId: z
              .union([z.number(), z.string().transform((val) => parseInt(val, 10))])
              .pipe(z.number().int().positive()),
            memberId: z.string().optional(),
            price: z.union([z.number(), z.string().transform((val) => parseFloat(val))]).optional(),
          }),
        ),
      }),
    )
    .min(1, "At least one guest is required"),
  guestCount: z
    .union([z.number(), z.string().transform((val) => parseInt(val, 10))])
    .pipe(z.number().int().positive())
    .optional()
    .default(1),
  date: z
    .string()
    .datetime({ message: "Date must be a valid ISO datetime string" })
    .transform((str) => new Date(str)),
  notes: z.string().max(500).optional().default(""),
  depositAmount: z
    .union([z.number(), z.string().transform((val) => parseFloat(val))])
    .pipe(z.number().min(0))
    .optional()
    .default(0),
  depositPaid: z
    .union([z.number(), z.string().transform((val) => parseFloat(val))])
    .pipe(z.number().min(0))
    .optional()
    .default(0),
  status: z
    .enum(["pending", "confirmed", "checkin", "completed", "cancelled", "no_show"])
    .optional()
    .default("pending"),
  noShowReason: z.string().max(500).optional(),
});
// Removed refine check as guests array min(1) covers it.

export const updateBookingSchema = z.object({
  customerId: z.number().int().positive().optional(),
  branchId: z.number().int().positive().nullable().optional(),
  serviceId: z.number().int().positive().optional(),
  date: z
    .string()
    .datetime()
    .transform((str) => new Date(str))
    .optional(),
  notes: z.string().max(500).optional(),
  status: z.enum(["pending", "confirmed", "checkin", "completed", "cancelled", "no_show"]).optional(),
  depositAmount: z
    .union([z.number(), z.string().transform((val) => parseFloat(val))])
    .pipe(z.number().min(0))
    .optional(),
  depositPaid: z
    .union([z.number(), z.string().transform((val) => parseFloat(val))])
    .pipe(z.number().min(0))
    .optional(),
  noShowReason: z.string().max(500).optional(),
  noShowAt: z
    .string()
    .datetime()
    .transform((str) => new Date(str))
    .optional(),
  guestCount: z
    .union([z.number(), z.string().transform((val) => parseInt(val, 10))])
    .pipe(z.number().int().positive())
    .optional(),
  guests: z
    .array(
      z.object({
        services: z.array(
          z.object({
            categoryId: z
              .union([z.number(), z.string().transform((val) => parseInt(val, 10))])
              .optional(),
            serviceId: z
              .union([z.number(), z.string().transform((val) => parseInt(val, 10))])
              .pipe(z.number().int().positive()),
            memberId: z.string().optional(),
            price: z.union([z.number(), z.string().transform((val) => parseFloat(val))]).optional(),
          }),
        ),
      }),
    )
    .optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "checkin", "completed", "cancelled", "no_show"]),
  noShowReason: z.string().max(500).optional(),
});

export const bookingQuerySchema = z.object({
  customerId: z.string().optional(),
  branchId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("20"),
  simple: z.string().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type BookingQueryInput = z.infer<typeof bookingQuerySchema>;
