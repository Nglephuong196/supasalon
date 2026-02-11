import { ACTIONS, RESOURCES } from "@repo/constants";
import { Elysia } from "elysia";

import { db } from "../../db";
import { getQuery } from "../../lib/query";
import { ActivityLogsService, BookingRemindersService, type ReminderChannel } from "../../services";
import { protectedPlugin, requirePermissionFor } from "./plugin";

function parseDateInput(value: unknown, label: string) {
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} không hợp lệ`);
  }
  return date;
}

export const bookingRemindersProtectedRoutes = new Elysia({ name: "protected-booking-reminders-routes" })
  .use(protectedPlugin)
  .group("/booking-reminders", (app) =>
    app
      .get("/settings", async ({ request }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.BOOKING, ACTIONS.READ);
        return new BookingRemindersService(db).getSettings(organization.id);
      })
      .put("/settings", async ({ request, set }) => {
        const { organization, user } = await requirePermissionFor(
          request,
          RESOURCES.BOOKING,
          ACTIONS.UPDATE,
        );
        try {
          const body = (await request.json()) as {
            enabled?: boolean;
            channels?: { sms: boolean; zalo: boolean; email: boolean };
            hoursBefore?: number;
            template?: string;
          };

          return new BookingRemindersService(db).upsertSettings(organization.id, user.id, body);
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể cập nhật cấu hình nhắc lịch" };
        }
      })
      .get("/logs", async ({ request, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.BOOKING, ACTIONS.READ);
        try {
          const query = getQuery(request);
          const bookingId = query.get("bookingId")
            ? Number.parseInt(query.get("bookingId") as string, 10)
            : undefined;
          const channel = query.get("channel");
          const status = query.get("status");
          const from = query.get("from") ? parseDateInput(query.get("from"), "Ngày bắt đầu") : undefined;
          const to = query.get("to") ? parseDateInput(query.get("to"), "Ngày kết thúc") : undefined;

          return new BookingRemindersService(db).listLogs(organization.id, {
            bookingId,
            channel:
              channel === "sms" || channel === "zalo" || channel === "email"
                ? (channel as ReminderChannel)
                : undefined,
            status:
              status === "queued" || status === "sent" || status === "failed" || status === "cancelled"
                ? status
                : undefined,
            from,
            to,
          });
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể tải log nhắc lịch" };
        }
      })
      .post("/send", async ({ request, set }) => {
        const { organization, user } = await requirePermissionFor(
          request,
          RESOURCES.BOOKING,
          ACTIONS.UPDATE,
        );
        try {
          const body = (await request.json()) as {
            bookingId: number;
            channels?: ReminderChannel[];
            message?: string;
          };

          const bookingId = Number(body.bookingId);
          if (!Number.isInteger(bookingId) || bookingId <= 0) {
            throw new Error("bookingId không hợp lệ");
          }

          const logs = await new BookingRemindersService(db).sendManual(organization.id, bookingId, user.id, {
            channels: body.channels,
            message: body.message,
          });

          await new ActivityLogsService(db).log({
            organizationId: organization.id,
            actorUserId: user.id,
            entityType: "booking_reminder",
            entityId: bookingId,
            action: "send_manual",
            metadata: {
              channels: logs.map((item) => item.channel),
              count: logs.length,
            },
          });

          return logs;
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể gửi nhắc lịch" };
        }
      })
      .post("/dispatch", async ({ request, set }) => {
        const { organization, user } = await requirePermissionFor(
          request,
          RESOURCES.BOOKING,
          ACTIONS.UPDATE,
        );

        try {
          const logs = await new BookingRemindersService(db).dispatchUpcoming(organization.id, user.id);

          await new ActivityLogsService(db).log({
            organizationId: organization.id,
            actorUserId: user.id,
            entityType: "booking_reminder",
            entityId: null,
            action: "dispatch_auto",
            metadata: {
              count: logs.length,
            },
          });

          return {
            dispatched: logs.length,
            logs,
          };
        } catch (error: any) {
          set.status = 400;
          return { error: error?.message ?? "Không thể chạy dispatch nhắc lịch" };
        }
      }),
  );
