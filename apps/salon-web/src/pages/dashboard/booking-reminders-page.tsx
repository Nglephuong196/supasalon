import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { queryKeys } from "@/lib/query-client";
import { bookingRemindersService } from "@/services/booking-reminders.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Send } from "lucide-react";
import { useEffect, useState } from "react";

function toDateInput(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function BookingRemindersPage() {
  const queryClient = useQueryClient();

  const [actionError, setActionError] = useState<string | null>(null);
  const [from, setFrom] = useState(toDateInput(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)));
  const [to, setTo] = useState(toDateInput(new Date()));

  const [enabled, setEnabled] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [zaloEnabled, setZaloEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [hoursBefore, setHoursBefore] = useState("24");
  const [template, setTemplate] = useState("");

  const [manualBookingId, setManualBookingId] = useState("");
  const [manualMessage, setManualMessage] = useState("");

  useEffect(() => {
    document.title = "Nhắc lịch | SupaSalon";
  }, []);

  const settingsQuery = useQuery({
    queryKey: queryKeys.reminderSettings,
    queryFn: () => bookingRemindersService.getSettings(),
  });

  const logsQuery = useQuery({
    queryKey: queryKeys.reminderLogs(undefined, from, to),
    queryFn: () => bookingRemindersService.listLogs({ from, to }),
  });

  useEffect(() => {
    if (!settingsQuery.data) return;
    setEnabled(Boolean(settingsQuery.data.enabled));
    setSmsEnabled(Boolean(settingsQuery.data.channels?.sms));
    setZaloEnabled(Boolean(settingsQuery.data.channels?.zalo));
    setEmailEnabled(Boolean(settingsQuery.data.channels?.email));
    setHoursBefore(String(settingsQuery.data.hoursBefore || 24));
    setTemplate(settingsQuery.data.template || "");
  }, [settingsQuery.data]);

  const updateSettingsMutation = useMutation({
    mutationFn: (payload: {
      enabled: boolean;
      channels: { sms: boolean; zalo: boolean; email: boolean };
      hoursBefore: number;
      template: string;
    }) => bookingRemindersService.updateSettings(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.reminderSettings });
    },
  });

  const sendManualMutation = useMutation({
    mutationFn: (payload: { bookingId: number; message?: string }) =>
      bookingRemindersService.sendManual(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.reminderLogs(undefined, from, to) });
    },
  });

  const dispatchMutation = useMutation({
    mutationFn: () => bookingRemindersService.dispatchAuto(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.reminderLogs(undefined, from, to) });
    },
  });

  const logs = logsQuery.data ?? [];

  const saving =
    updateSettingsMutation.isPending || sendManualMutation.isPending || dispatchMutation.isPending;

  const error =
    actionError ??
    (settingsQuery.error instanceof Error ? settingsQuery.error.message : null) ??
    (logsQuery.error instanceof Error ? logsQuery.error.message : null) ??
    (updateSettingsMutation.error instanceof Error ? updateSettingsMutation.error.message : null) ??
    (sendManualMutation.error instanceof Error ? sendManualMutation.error.message : null) ??
    (dispatchMutation.error instanceof Error ? dispatchMutation.error.message : null);

  async function saveSettings() {
    const hours = Number(hoursBefore);
    if (!Number.isFinite(hours) || hours <= 0) {
      setActionError("Số giờ nhắc trước không hợp lệ");
      return;
    }

    setActionError(null);
    try {
      await updateSettingsMutation.mutateAsync({
        enabled,
        channels: {
          sms: smsEnabled,
          zalo: zaloEnabled,
          email: emailEnabled,
        },
        hoursBefore: Math.trunc(hours),
        template: template.trim(),
      });
    } catch {
      // handled by mutation state
    }
  }

  async function sendManual() {
    const bookingId = Number(manualBookingId);
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      setActionError("bookingId không hợp lệ");
      return;
    }

    setActionError(null);
    try {
      await sendManualMutation.mutateAsync({
        bookingId,
        message: manualMessage.trim() || undefined,
      });
      setManualBookingId("");
      setManualMessage("");
    } catch {
      // handled by mutation state
    }
  }

  async function dispatchAuto() {
    setActionError(null);
    try {
      await dispatchMutation.mutateAsync();
    } catch {
      // handled by mutation state
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-border/70 bg-linear-to-br from-white to-secondary/30 p-5 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight">Nhắc lịch tự động</h1>
        <p className="text-sm text-muted-foreground">
          Cấu hình nhắc lịch qua SMS/Zalo/Email, gửi thủ công và kiểm tra log gửi.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <h2 className="font-semibold">Cấu hình nhắc lịch</h2>
          </div>

          <div className="grid gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
              Bật nhắc lịch tự động
            </label>

            <div className="grid gap-1">
              <Label>Nhắc trước (giờ)</Label>
              <Input
                type="number"
                min={1}
                max={168}
                value={hoursBefore}
                onChange={(event) => setHoursBefore(event.target.value)}
              />
            </div>

            <div className="grid gap-1">
              <Label>Kênh gửi</Label>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={smsEnabled}
                    onChange={(event) => setSmsEnabled(event.target.checked)}
                  />
                  SMS
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={zaloEnabled}
                    onChange={(event) => setZaloEnabled(event.target.checked)}
                  />
                  Zalo
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={emailEnabled}
                    onChange={(event) => setEmailEnabled(event.target.checked)}
                  />
                  Email
                </label>
              </div>
            </div>

            <div className="grid gap-1">
              <Label>Template</Label>
              <textarea
                className="min-h-24 rounded-md border px-3 py-2 text-sm"
                value={template}
                onChange={(event) => setTemplate(event.target.value)}
                placeholder="Dùng biến {{customerName}}, {{serviceName}}, {{bookingTime}}"
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={() => void saveSettings()} disabled={saving}>Lưu cấu hình</Button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 font-semibold">Gửi thủ công / Dispatch</h2>
          <div className="grid gap-3">
            <div className="grid gap-1">
              <Label>Booking ID</Label>
              <Input
                type="number"
                min={1}
                value={manualBookingId}
                onChange={(event) => setManualBookingId(event.target.value)}
                placeholder="Ví dụ: 123"
              />
            </div>
            <div className="grid gap-1">
              <Label>Nội dung tùy chỉnh (tuỳ chọn)</Label>
              <textarea
                className="min-h-24 rounded-md border px-3 py-2 text-sm"
                value={manualMessage}
                onChange={(event) => setManualMessage(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button disabled={saving} onClick={() => void sendManual()}>
                <Send className="mr-2 h-4 w-4" />
                Gửi thủ công
              </Button>
              <Button variant="outline" disabled={saving} onClick={() => void dispatchAuto()}>
                Chạy dispatch tự động
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="font-semibold">Log nhắc lịch</h2>
          <div className="ml-auto flex items-center gap-2">
            <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </div>
        </div>

        <div className="max-h-[420px] overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Booking</TableHead>
                <TableHead>Kênh</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Nội dung</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Chưa có log nhắc lịch.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      #{log.bookingId}
                      <div className="text-xs text-muted-foreground">
                        {log.booking?.customer?.name || "Khách"}
                      </div>
                    </TableCell>
                    <TableCell className="uppercase">{log.channel}</TableCell>
                    <TableCell>{log.status}</TableCell>
                    <TableCell className="max-w-[340px] truncate">{log.message || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
