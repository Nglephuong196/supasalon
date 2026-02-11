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
  getOptions(slug: string) {
    return apiClient.get<PublicBookingOption>(`/public/booking/${slug}/options`);
  },
  create(slug: string, payload: CreatePublicBookingPayload) {
    return apiClient.post<{ success: boolean; message: string; bookingId?: number }>(
      `/public/booking/${slug}`,
      payload,
    );
  },
};
