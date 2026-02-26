import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryKeys } from "@/lib/query-client";
import { publicBookingService } from "@/services/public-booking.service";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { CalendarDays, CheckCircle2 } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
const NONE_OPTION_VALUE = "__none__";

export function PublicBookingPage() {
  const { slug } = useParams({ from: "/public-layout/book/$slug" });

  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [guestCount, setGuestCount] = useState("1");
  const [serviceId, setServiceId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    document.title = "Đặt lịch | SupaSalon";
  }, []);

  const optionsQuery = useQuery({
    queryKey: queryKeys.publicBookingOptions(slug),
    queryFn: () => publicBookingService.getOptions(slug),
    enabled: Boolean(slug),
  });

  const createBookingMutation = useMutation({
    mutationFn: (payload: {
      customerName: string;
      customerPhone: string;
      dateTime: string;
      guestCount: number;
      guests: Array<{
        services: Array<{ serviceId: number; memberId?: string }>;
      }>;
      notes: string;
    }) => publicBookingService.create(slug, payload),
  });

  const options = optionsQuery.data ?? null;
  const loading = optionsQuery.isLoading;
  const submitting = createBookingMutation.isPending;

  const error =
    formError ??
    (optionsQuery.error instanceof Error ? optionsQuery.error.message : null) ??
    (createBookingMutation.error instanceof Error ? createBookingMutation.error.message : null);

  const selectedService = useMemo(() => {
    return options?.services.find((item) => String(item.id) === serviceId) || null;
  }, [options?.services, serviceId]);

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedGuestCount = Number(guestCount);
    const parsedServiceId = Number(serviceId);

    if (!customerName.trim() || !customerPhone.trim() || !dateTime || !parsedServiceId) {
      setFormError("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    setFormError(null);
    setSuccess(null);

    try {
      const guests = Array.from({ length: parsedGuestCount || 1 }, () => ({
        services: [
          {
            serviceId: parsedServiceId,
            memberId: memberId || undefined,
          },
        ],
      }));

      const result = await createBookingMutation.mutateAsync({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        dateTime: new Date(dateTime).toISOString(),
        guestCount: parsedGuestCount || 1,
        guests,
        notes,
      });

      setSuccess(result.message || "Đặt lịch thành công");
      setCustomerName("");
      setCustomerPhone("");
      setDateTime("");
      setGuestCount("1");
      setServiceId("");
      setMemberId("");
      setNotes("");
    } catch {
      // handled by mutation state
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border border-border/70 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <CalendarDays className="h-6 w-6 text-primary" />
            Đặt lịch salon
          </CardTitle>
          <CardDescription>
            {loading
              ? "Đang tải thông tin salon..."
              : options
                ? `${options.organization.name} (${options.organization.slug})`
                : `Slug salon: ${slug}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {success}
              </div>
            </div>
          ) : null}

          <form className="grid gap-4" onSubmit={submitBooking}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Tên khách hàng</Label>
                <Input
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div className="grid gap-2">
                <Label>Số điện thoại</Label>
                <Input
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder="09xxxxxxxx"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Ngày giờ hẹn</Label>
                <Input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(event) => setDateTime(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Số lượng khách</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={guestCount}
                  onChange={(event) => setGuestCount(event.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Dịch vụ</Label>
                <Select
                  value={serviceId || NONE_OPTION_VALUE}
                  onValueChange={(value) => setServiceId(value === NONE_OPTION_VALUE ? "" : value)}
                >
                  <SelectTrigger className="h-10 w-full rounded-md border px-3 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_OPTION_VALUE}>Chọn dịch vụ</SelectItem>
                    {options?.services.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.name} - {item.price.toLocaleString("vi-VN")}đ
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Nhân viên (tuỳ chọn)</Label>
                <Select
                  value={memberId || NONE_OPTION_VALUE}
                  onValueChange={(value) => setMemberId(value === NONE_OPTION_VALUE ? "" : value)}
                >
                  <SelectTrigger className="h-10 w-full rounded-md border px-3 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_OPTION_VALUE}>Không chỉ định</SelectItem>
                    {options?.staffs.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Ghi chú</Label>
              <textarea
                className="min-h-20 w-full rounded-md border px-3 py-2 text-sm"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>

            <Button type="submit" disabled={submitting || loading}>
              {submitting ? "Đang gửi..." : "Xác nhận đặt lịch"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border border-border/70 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Thông tin dịch vụ</CardTitle>
          <CardDescription>Chọn dịch vụ để xem thời lượng và giá</CardDescription>
        </CardHeader>
        <CardContent>
          {selectedService ? (
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Tên:</span> {selectedService.name}
              </div>
              <div>
                <span className="font-medium">Giá:</span>{" "}
                {selectedService.price.toLocaleString("vi-VN")}đ
              </div>
              <div>
                <span className="font-medium">Thời lượng:</span> {selectedService.duration} phút
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Chưa chọn dịch vụ.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
