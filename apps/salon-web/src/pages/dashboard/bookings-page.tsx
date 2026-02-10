import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
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
import {
  type BookingItem,
  type BookingPayload,
  type BookingStats,
  type BookingStatus,
  bookingsService,
} from "@/services/bookings.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarDays, Check, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function Modal(props: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!props.open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={props.onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-border bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold">{props.title}</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={props.onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {props.children}
      </div>
    </div>
  );
}

const statusText: Record<BookingStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  checkin: "Đã check-in",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

const statusClass: Record<BookingStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  checkin: "bg-purple-100 text-purple-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-rose-100 text-rose-700",
};

const emptyStats: BookingStats = {
  total: 0,
  pending: 0,
  confirmed: 0,
  completed: 0,
  cancelled: 0,
  cancelRate: 0,
};
const NONE_OPTION_VALUE = "__none__";

function todayString() {
  return new Date().toISOString().split("T")[0] ?? "";
}

export function BookingsPage() {
  const queryClient = useQueryClient();

  const [actionError, setActionError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState(todayString());
  const [toDate, setToDate] = useState(todayString());

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);

  const [formCustomerId, setFormCustomerId] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formGuestCount, setFormGuestCount] = useState("1");
  const [formServiceId, setFormServiceId] = useState("");
  const [formMemberId, setFormMemberId] = useState("");
  const [formStatus, setFormStatus] = useState<BookingStatus>("pending");
  const [formNotes, setFormNotes] = useState("");

  useEffect(() => {
    document.title = "Lịch hẹn | SupaSalon";
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filters = useMemo(
    () => ({
      from: fromDate,
      to: toDate,
      status: statusFilter,
      search: debouncedSearchQuery,
      page: 1,
      limit: 100,
    }),
    [debouncedSearchQuery, fromDate, statusFilter, toDate],
  );

  const dependenciesQuery = useQuery({
    queryKey: queryKeys.bookingDependencies,
    queryFn: () => bookingsService.listDependencies(),
  });

  const bookingsQuery = useQuery({
    queryKey: queryKeys.bookings(filters),
    queryFn: () => bookingsService.list(filters),
  });

  const statsQuery = useQuery({
    queryKey: queryKeys.bookingStats(fromDate, toDate),
    queryFn: () => bookingsService.stats(fromDate, toDate),
  });

  const createMutation = useMutation({
    mutationFn: (payload: BookingPayload) => bookingsService.create(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["bookings"] }),
        queryClient.invalidateQueries({ queryKey: ["booking-stats"] }),
      ]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<BookingPayload>;
    }) => bookingsService.update(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["bookings"] }),
        queryClient.invalidateQueries({ queryKey: ["booking-stats"] }),
      ]);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: BookingStatus }) =>
      bookingsService.updateStatus(id, status),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["bookings"] }),
        queryClient.invalidateQueries({ queryKey: ["booking-stats"] }),
      ]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => bookingsService.remove(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["bookings"] }),
        queryClient.invalidateQueries({ queryKey: ["booking-stats"] }),
      ]);
    },
  });

  const customers = dependenciesQuery.data?.[0] ?? [];
  const services = dependenciesQuery.data?.[1] ?? [];
  const members = dependenciesQuery.data?.[2] ?? [];

  const bookings = bookingsQuery.data?.data ?? [];
  const stats = statsQuery.data ?? emptyStats;

  const loading = dependenciesQuery.isLoading || bookingsQuery.isLoading || statsQuery.isLoading;
  const saving =
    createMutation.isPending ||
    updateMutation.isPending ||
    updateStatusMutation.isPending ||
    deleteMutation.isPending;

  const error =
    actionError ??
    (dependenciesQuery.error instanceof Error ? dependenciesQuery.error.message : null) ??
    (bookingsQuery.error instanceof Error ? bookingsQuery.error.message : null) ??
    (statsQuery.error instanceof Error ? statsQuery.error.message : null) ??
    (createMutation.error instanceof Error ? createMutation.error.message : null) ??
    (updateMutation.error instanceof Error ? updateMutation.error.message : null) ??
    (updateStatusMutation.error instanceof Error ? updateStatusMutation.error.message : null) ??
    (deleteMutation.error instanceof Error ? deleteMutation.error.message : null);

  function resetForm() {
    setFormCustomerId("");
    setFormDate("");
    setFormGuestCount("1");
    setFormServiceId("");
    setFormMemberId("");
    setFormStatus("pending");
    setFormNotes("");
  }

  const customerById = useMemo(
    () => new Map(customers.map((item) => [String(item.id), item])),
    [customers],
  );

  const serviceById = useMemo(() => new Map(services.map((item) => [item.id, item])), [services]);

  const memberById = useMemo(() => {
    return new Map(
      members.map((item) => [item.id, item.user?.name ?? item.user?.email ?? item.id]),
    );
  }, [members]);

  const bookingColumns: Array<ColumnDef<BookingItem>> = [
    {
      id: "customer",
      header: "Khách hàng",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">
            {row.original.customer?.name ||
              customerById.get(String(row.original.customerId))?.name ||
              `KH #${row.original.customerId}`}
          </div>
          <div className="text-xs text-muted-foreground">
            {row.original.customer?.phone ||
              customerById.get(String(row.original.customerId))?.phone ||
              ""}
          </div>
        </div>
      ),
    },
    {
      id: "date",
      header: "Ngày giờ",
      cell: ({ row }) => (
        <div className="inline-flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          {new Date(row.original.date).toLocaleString("vi-VN")}
        </div>
      ),
    },
    {
      id: "service",
      header: "Dịch vụ",
      cell: ({ row }) => {
        const firstService = row.original.guests?.[0]?.services?.[0];
        const serviceName = firstService?.serviceId
          ? serviceById.get(firstService.serviceId)?.name || `#${firstService.serviceId}`
          : "-";
        return (
          <div>
            <div>{serviceName}</div>
            {firstService?.memberId ? (
              <div className="text-xs text-muted-foreground">
                {memberById.get(firstService.memberId) || firstService.memberId}
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClass[row.original.status]}`}
        >
          {statusText[row.original.status]}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Thao tác",
      meta: {
        className: "text-right",
        headerClassName: "text-right",
      },
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Select
            value={row.original.status}
            onValueChange={(value) => void quickStatus(row.original.id, value as BookingStatus)}
          >
            <SelectTrigger className="h-8 rounded-md border px-2 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusText).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => openEdit(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => openDelete(row.original)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  function buildPayload(): BookingPayload | null {
    const customerId = Number(formCustomerId);
    const guestCount = Number(formGuestCount);
    const serviceId = Number(formServiceId);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      setActionError("Vui lòng chọn khách hàng");
      return null;
    }
    if (!formDate) {
      setActionError("Vui lòng chọn ngày giờ");
      return null;
    }
    if (!Number.isInteger(guestCount) || guestCount <= 0) {
      setActionError("Số lượng khách không hợp lệ");
      return null;
    }
    if (!Number.isInteger(serviceId) || serviceId <= 0) {
      setActionError("Vui lòng chọn dịch vụ");
      return null;
    }

    const service = serviceById.get(serviceId);
    if (!service) {
      setActionError("Dịch vụ không tồn tại");
      return null;
    }

    const guests = Array.from({ length: guestCount }, () => ({
      services: [
        {
          categoryId: service.categoryId,
          serviceId,
          memberId: formMemberId || undefined,
          price: service.price,
        },
      ],
    }));

    return {
      customerId,
      guests,
      guestCount,
      date: new Date(formDate).toISOString(),
      status: formStatus,
      notes: formNotes,
    };
  }

  async function createBooking(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    const payload = buildPayload();
    if (!payload) return;

    setActionError(null);
    try {
      await createMutation.mutateAsync(payload);
      setCreateOpen(false);
      resetForm();
    } catch {
      // handled by mutation state
    }
  }

  function openEdit(booking: BookingItem) {
    setSelectedBooking(booking);
    setFormCustomerId(String(booking.customerId));
    const iso = new Date(booking.date).toISOString();
    setFormDate(iso.slice(0, 16));
    setFormGuestCount(String(booking.guestCount));
    const firstService = booking.guests?.[0]?.services?.[0];
    setFormServiceId(firstService?.serviceId ? String(firstService.serviceId) : "");
    setFormMemberId(firstService?.memberId || "");
    setFormStatus(booking.status);
    setFormNotes(booking.notes ?? "");
    setEditOpen(true);
  }

  async function updateBooking(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    if (!selectedBooking) return;

    const payload = buildPayload();
    if (!payload) return;

    setActionError(null);
    try {
      await updateMutation.mutateAsync({
        id: selectedBooking.id,
        payload,
      });
      setEditOpen(false);
      setSelectedBooking(null);
      resetForm();
    } catch {
      // handled by mutation state
    }
  }

  async function quickStatus(id: number, status: BookingStatus) {
    setActionError(null);
    try {
      await updateStatusMutation.mutateAsync({ id, status });
    } catch {
      // handled by mutation state
    }
  }

  function openDelete(booking: BookingItem) {
    setSelectedBooking(booking);
    setDeleteOpen(true);
  }

  async function deleteBooking() {
    if (!selectedBooking) return;
    setActionError(null);
    try {
      await deleteMutation.mutateAsync(selectedBooking.id);
      setDeleteOpen(false);
      setSelectedBooking(null);
    } catch {
      // handled by mutation state
    }
  }

  function renderForm(
    onSubmit: (event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) => void,
  ) {
    return (
      <form className="grid gap-4" onSubmit={onSubmit}>
        <div className="grid gap-2">
          <Label>Khách hàng</Label>
          <Select
            value={formCustomerId || NONE_OPTION_VALUE}
            onValueChange={(value) => setFormCustomerId(value === NONE_OPTION_VALUE ? "" : value)}
          >
            <SelectTrigger className="h-10 rounded-md border px-3 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_OPTION_VALUE}>Chọn khách hàng</SelectItem>
              {customers.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>
                  {item.name} - {item.phone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Ngày giờ</Label>
            <Input
              type="datetime-local"
              value={formDate}
              onChange={(event) => setFormDate(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Số khách</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={formGuestCount}
              onChange={(event) => setFormGuestCount(event.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Dịch vụ</Label>
            <Select
              value={formServiceId || NONE_OPTION_VALUE}
              onValueChange={(value) => setFormServiceId(value === NONE_OPTION_VALUE ? "" : value)}
            >
              <SelectTrigger className="h-10 rounded-md border px-3 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_OPTION_VALUE}>Chọn dịch vụ</SelectItem>
                {services.map((item) => (
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
              value={formMemberId || NONE_OPTION_VALUE}
              onValueChange={(value) => setFormMemberId(value === NONE_OPTION_VALUE ? "" : value)}
            >
              <SelectTrigger className="h-10 rounded-md border px-3 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_OPTION_VALUE}>Không chỉ định</SelectItem>
                {members.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.user?.name || item.user?.email || item.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Trạng thái</Label>
          <Select
            value={formStatus}
            onValueChange={(value) => setFormStatus(value as BookingStatus)}
          >
            <SelectTrigger className="h-10 rounded-md border px-3 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusText).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Ghi chú</Label>
          <textarea
            className="min-h-20 rounded-md border px-3 py-2 text-sm"
            value={formNotes}
            onChange={(event) => setFormNotes(event.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setCreateOpen(false);
              setEditOpen(false);
            }}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu"}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border/70 bg-linear-to-br from-white to-secondary/30 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Lịch hẹn</h1>
            <p className="text-muted-foreground">
              Quản lý lịch hẹn, trạng thái và điều phối dịch vụ
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setActionError(null);
              setCreateOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Tạo lịch hẹn
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border bg-white p-3">
          <div className="text-xs text-muted-foreground">Tổng</div>
          <div className="text-xl font-semibold">{stats.total}</div>
        </div>
        <div className="rounded-xl border bg-white p-3">
          <div className="text-xs text-muted-foreground">Chờ xác nhận</div>
          <div className="text-xl font-semibold text-amber-700">{stats.pending}</div>
        </div>
        <div className="rounded-xl border bg-white p-3">
          <div className="text-xs text-muted-foreground">Đã xác nhận</div>
          <div className="text-xl font-semibold text-emerald-700">{stats.confirmed}</div>
        </div>
        <div className="rounded-xl border bg-white p-3">
          <div className="text-xs text-muted-foreground">Hoàn thành</div>
          <div className="text-xl font-semibold text-blue-700">{stats.completed}</div>
        </div>
        <div className="rounded-xl border bg-white p-3">
          <div className="text-xs text-muted-foreground">Tỷ lệ huỷ</div>
          <div className="text-xl font-semibold text-rose-700">{stats.cancelRate.toFixed(1)}%</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-3">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tìm khách hàng, số điện thoại"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 rounded-md border px-3 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {Object.entries(statusText).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={fromDate}
          onChange={(event) => setFromDate(event.target.value)}
          className="w-auto"
        />
        <Input
          type="date"
          value={toDate}
          onChange={(event) => setToDate(event.target.value)}
          className="w-auto"
        />
      </div>

      <div className="overflow-auto rounded-lg border border-border/70 bg-white">
        <DataTable
          data={bookings}
          columns={bookingColumns}
          loading={loading}
          emptyMessage="Không có lịch hẹn"
        />
      </div>

      <Modal title="Tạo lịch hẹn" open={createOpen} onClose={() => setCreateOpen(false)}>
        {renderForm(createBooking)}
      </Modal>

      <Modal title="Cập nhật lịch hẹn" open={editOpen} onClose={() => setEditOpen(false)}>
        {renderForm(updateBooking)}
      </Modal>

      <Modal title="Xóa lịch hẹn" open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Bạn có chắc muốn xóa lịch hẹn này?</p>
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <div className="font-medium">
              {selectedBooking?.customer?.name || `KH #${selectedBooking?.customerId ?? ""}`}
            </div>
            <div className="text-muted-foreground">
              {selectedBooking?.date ? new Date(selectedBooking.date).toLocaleString("vi-VN") : ""}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Hủy
            </Button>
            <Button disabled={saving} onClick={() => void deleteBooking()}>
              <Check className="mr-2 h-4 w-4" />
              Xác nhận xóa
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
