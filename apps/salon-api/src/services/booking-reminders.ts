import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";

import type {
  BookingReminderLog,
  BookingReminderSetting,
  Database,
  NewBookingReminderLog,
  NewBookingReminderSetting,
} from "../db";
import {
  bookingReminderLogs,
  bookingReminderSettings,
  bookings,
  customers,
  serviceCategories,
  services,
} from "../db";

export type ReminderChannel = "sms" | "zalo" | "email";

export type ReminderChannels = {
  sms: boolean;
  zalo: boolean;
  email: boolean;
};

export type BookingReminderSettingInput = {
  enabled?: boolean;
  channels?: ReminderChannels;
  hoursBefore?: number;
  template?: string;
};

export class BookingRemindersService {
  constructor(private db: Database) {}

  private defaultSettings(organizationId: string): BookingReminderSetting {
    const now = new Date();
    return {
      id: 0,
      organizationId,
      enabled: false,
      channels: {
        sms: true,
        zalo: false,
        email: false,
      },
      hoursBefore: 24,
      template:
        "Xin chào {{customerName}}, lịch hẹn {{serviceName}} tại salon vào {{bookingTime}}. Hẹn gặp bạn!",
      updatedByUserId: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  private clampHours(hours: number | undefined) {
    const value = Number(hours ?? 24);
    if (!Number.isFinite(value)) return 24;
    return Math.min(168, Math.max(1, Math.trunc(value)));
  }

  async getSettings(organizationId: string) {
    const settings = await this.db.query.bookingReminderSettings.findFirst({
      where: eq(bookingReminderSettings.organizationId, organizationId),
      with: {
        updatedBy: true,
      },
    });

    if (settings) return settings;
    return this.defaultSettings(organizationId);
  }

  async upsertSettings(
    organizationId: string,
    updatedByUserId: string,
    input: BookingReminderSettingInput,
  ) {
    const existing = await this.db.query.bookingReminderSettings.findFirst({
      where: eq(bookingReminderSettings.organizationId, organizationId),
    });

    const updates: Partial<NewBookingReminderSetting> = {
      enabled: typeof input.enabled === "boolean" ? input.enabled : undefined,
      channels: input.channels,
      hoursBefore: input.hoursBefore !== undefined ? this.clampHours(input.hoursBefore) : undefined,
      template: input.template?.trim() || undefined,
      updatedByUserId,
      updatedAt: new Date(),
    };

    if (existing) {
      const [updated] = await this.db
        .update(bookingReminderSettings)
        .set(updates)
        .where(eq(bookingReminderSettings.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await this.db
      .insert(bookingReminderSettings)
      .values({
        organizationId,
        enabled: updates.enabled ?? false,
        channels: updates.channels ?? {
          sms: true,
          zalo: false,
          email: false,
        },
        hoursBefore: updates.hoursBefore ?? 24,
        template:
          updates.template ||
          "Xin chào {{customerName}}, lịch hẹn {{serviceName}} tại salon vào {{bookingTime}}. Hẹn gặp bạn!",
        updatedByUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return created;
  }

  private enabledChannels(channels: ReminderChannels): ReminderChannel[] {
    const list: ReminderChannel[] = [];
    if (channels.sms) list.push("sms");
    if (channels.zalo) list.push("zalo");
    if (channels.email) list.push("email");
    return list;
  }

  private firstServiceName(guests: unknown, serviceMap: Map<number, string>) {
    if (!Array.isArray(guests)) return "Dịch vụ";
    for (const guest of guests as any[]) {
      for (const service of guest?.services ?? []) {
        const serviceId = Number(service?.serviceId);
        const name = serviceMap.get(serviceId);
        if (name) return name;
      }
    }
    return "Dịch vụ";
  }

  private renderMessage(template: string, data: Record<string, string>) {
    return template.replace(/{{\s*([\w]+)\s*}}/g, (_, key) => data[key] ?? "");
  }

  private async loadServiceNameMap(organizationId: string) {
    const rows = await this.db
      .select({ id: services.id, name: services.name })
      .from(services)
      .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
      .where(eq(serviceCategories.organizationId, organizationId));

    return new Map(rows.map((row) => [row.id, row.name]));
  }

  private async findBooking(organizationId: string, bookingId: number) {
    return this.db.query.bookings.findFirst({
      where: and(eq(bookings.id, bookingId), eq(bookings.organizationId, organizationId)),
      with: {
        customer: true,
      },
    });
  }

  async sendManual(
    organizationId: string,
    bookingId: number,
    createdByUserId: string,
    input?: { channels?: ReminderChannel[]; message?: string },
  ) {
    const booking = await this.findBooking(organizationId, bookingId);
    if (!booking) {
      throw new Error("Không tìm thấy lịch hẹn");
    }

    const settings = await this.getSettings(organizationId);
    const channels = input?.channels?.length
      ? input.channels
      : this.enabledChannels(settings.channels as ReminderChannels);

    if (channels.length === 0) {
      throw new Error("Chưa cấu hình kênh nhắc lịch");
    }

    const serviceMap = await this.loadServiceNameMap(organizationId);
    const defaultMessage = this.renderMessage(settings.template, {
      customerName: booking.customer?.name || "Khách hàng",
      bookingTime: new Date(booking.date).toLocaleString("vi-VN"),
      serviceName: this.firstServiceName(booking.guests as unknown, serviceMap),
    });

    const message = input?.message?.trim() || defaultMessage;
    const now = new Date();

    const values: NewBookingReminderLog[] = channels.map((channel) => ({
      organizationId,
      bookingId,
      channel,
      status: "sent",
      scheduledAt: now,
      sentAt: now,
      message,
      errorMessage: null,
      payload: {
        manual: true,
      },
      createdByUserId,
      createdAt: now,
    }));

    return this.db.insert(bookingReminderLogs).values(values).returning();
  }

  async dispatchUpcoming(organizationId: string, triggeredByUserId?: string | null) {
    const settings = await this.getSettings(organizationId);
    const typedChannels = settings.channels as ReminderChannels;
    const channels = this.enabledChannels(typedChannels);
    if (!settings.enabled || channels.length === 0) {
      return [] as BookingReminderLog[];
    }

    const now = new Date();
    const beforeHours = this.clampHours(settings.hoursBefore);
    const target = new Date(now.getTime() + beforeHours * 60 * 60 * 1000);
    const from = new Date(target.getTime() - 15 * 60 * 1000);
    const to = new Date(target.getTime() + 15 * 60 * 1000);

    const bookingsInWindow = await this.db.query.bookings.findMany({
      where: and(
        eq(bookings.organizationId, organizationId),
        inArray(bookings.status, ["pending", "confirmed"]),
        gte(bookings.date, from),
        lte(bookings.date, to),
      ),
      with: {
        customer: true,
      },
    });

    if (bookingsInWindow.length === 0) return [];

    const serviceMap = await this.loadServiceNameMap(organizationId);
    const created: BookingReminderLog[] = [];

    for (const booking of bookingsInWindow) {
      const existingLogs = await this.db.query.bookingReminderLogs.findMany({
        where: and(
          eq(bookingReminderLogs.organizationId, organizationId),
          eq(bookingReminderLogs.bookingId, booking.id),
          inArray(bookingReminderLogs.channel, channels),
          inArray(bookingReminderLogs.status, ["queued", "sent"]),
        ),
      });
      const sentChannels = new Set(existingLogs.map((log) => log.channel));

      const message = this.renderMessage(settings.template, {
        customerName: booking.customer?.name || "Khách hàng",
        bookingTime: new Date(booking.date).toLocaleString("vi-VN"),
        serviceName: this.firstServiceName(booking.guests as unknown, serviceMap),
      });

      const values: NewBookingReminderLog[] = channels
        .filter((channel) => !sentChannels.has(channel))
        .map((channel) => ({
          organizationId,
          bookingId: booking.id,
          channel,
          status: "sent",
          scheduledAt: target,
          sentAt: now,
          message,
          errorMessage: null,
          payload: {
            auto: true,
            hoursBefore: beforeHours,
          },
          createdByUserId: triggeredByUserId ?? null,
          createdAt: now,
        }));

      if (values.length) {
        const inserted = await this.db.insert(bookingReminderLogs).values(values).returning();
        created.push(...inserted);
      }
    }

    return created;
  }

  async listLogs(
    organizationId: string,
    filters?: {
      bookingId?: number;
      channel?: ReminderChannel;
      status?: "queued" | "sent" | "failed" | "cancelled";
      from?: Date;
      to?: Date;
    },
  ) {
    const conditions = [eq(bookingReminderLogs.organizationId, organizationId)];

    if (filters?.bookingId) {
      conditions.push(eq(bookingReminderLogs.bookingId, filters.bookingId));
    }
    if (filters?.channel) {
      conditions.push(eq(bookingReminderLogs.channel, filters.channel));
    }
    if (filters?.status) {
      conditions.push(eq(bookingReminderLogs.status, filters.status));
    }
    if (filters?.from) {
      conditions.push(gte(bookingReminderLogs.createdAt, filters.from));
    }
    if (filters?.to) {
      conditions.push(lte(bookingReminderLogs.createdAt, filters.to));
    }

    return this.db.query.bookingReminderLogs.findMany({
      where: and(...conditions),
      with: {
        booking: {
          with: {
            customer: true,
          },
        },
        createdBy: true,
      },
      orderBy: [desc(bookingReminderLogs.createdAt)],
      limit: 200,
    });
  }
}
