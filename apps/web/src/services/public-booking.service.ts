import { apiClient } from "@/lib/api";

export type PublicBookingOption = {
  organization: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
  services: Array<{
    id: number;
    name: string;
    price: number;
    duration: number;
    categoryId: number;
  }>;
  staffs: Array<{
    id: string;
    role: string;
    name: string;
  }>;
};

export type PublicBookingGuest = {
  services: Array<{ serviceId: number; memberId?: string }>;
};

export type CreatePublicBookingPayload = {
  customerName: string;
  customerPhone: string;
  dateTime: string;
  guestCount: number;
  guests: PublicBookingGuest[];
  notes?: string;
};

export const publicBookingService = {
  async getOptions(_: string): Promise<PublicBookingOption> {
    void apiClient;
    throw new Error("Public booking endpoints are not available in apps/api yet.");
  },
  async create(
    _: string,
    __: CreatePublicBookingPayload,
  ): Promise<{ success: boolean; message: string; bookingId?: number }> {
    throw new Error("Public booking endpoints are not available in apps/api yet.");
  },
};
