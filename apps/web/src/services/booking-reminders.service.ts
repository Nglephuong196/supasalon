import { apiClient } from "@/lib/api";

export type ReminderChannel = "sms" | "zalo" | "email";

export type BookingReminderSettings = {
  id: number;
  organizationId: string;
  enabled: boolean;
  channels: {
    sms: boolean;
    zalo: boolean;
    email: boolean;
  };
  hoursBefore: number;
  template: string;
  updatedByUserId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BookingReminderLog = {
  id: number;
  organizationId: string;
  bookingId: number;
  channel: ReminderChannel;
  status: "queued" | "sent" | "failed" | "cancelled";
  scheduledAt: string;
  sentAt?: string | null;
  message?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  booking?: {
    id: number;
    date: string;
    customer?: { id: number; name?: string | null; phone?: string | null } | null;
  };
};

export const bookingRemindersService = {
  getSettings() {
    return apiClient.get<BookingReminderSettings>("/booking-reminders/settings");
  },
  updateSettings(payload: Partial<BookingReminderSettings>) {
    return apiClient.put<BookingReminderSettings>("/booking-reminders/settings", payload);
  },
  listLogs(filters?: {
    bookingId?: number;
    channel?: ReminderChannel;
    status?: "queued" | "sent" | "failed" | "cancelled";
    from?: string;
    to?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.bookingId) params.set("bookingId", String(filters.bookingId));
    if (filters?.channel) params.set("channel", filters.channel);
    if (filters?.status) params.set("status", filters.status);
    if (filters?.from) params.set("from", filters.from);
    if (filters?.to) params.set("to", filters.to);
    const query = params.toString();
    return apiClient.get<BookingReminderLog[]>(
      query ? `/booking-reminders/logs?${query}` : "/booking-reminders/logs",
    );
  },
  sendManual(payload: { bookingId: number; channels?: ReminderChannel[]; message?: string }) {
    return apiClient.post<BookingReminderLog[]>("/booking-reminders/send", payload);
  },
  dispatchAuto() {
    return apiClient.post<{ dispatched: number; logs: BookingReminderLog[] }>(
      "/booking-reminders/dispatch",
    );
  },
};
