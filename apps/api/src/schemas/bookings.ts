import { z } from "zod";

/**
 * Validation schemas for Booking API endpoints.
 * Using Zod for type-safe request validation.
 */

export const createBookingSchema = z.object({
    customerId: z.number().int().positive(),
    serviceId: z.number().int().positive(),
    date: z.string().datetime({ message: "Date must be a valid ISO datetime string" }).transform((str) => new Date(str)),
    notes: z.string().max(500).optional().default(""),
    status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional().default("pending"),
});

export const updateBookingSchema = z.object({
    customerId: z.number().int().positive().optional(),
    serviceId: z.number().int().positive().optional(),
    date: z.string().datetime().transform((str) => new Date(str)).optional(),
    notes: z.string().max(500).optional(),
    status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
});

export const updateStatusSchema = z.object({
    status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
});

export const bookingQuerySchema = z.object({
    customerId: z.string().optional(),
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
