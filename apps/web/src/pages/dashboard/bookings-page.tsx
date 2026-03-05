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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { queryKeys } from "@/lib/query-client";
import {
  type BookingItem,
  type BookingPayload,
  type BookingStats,
  type BookingStatus,
  bookingsService,
} from "@/services/bookings.service";
import { customersService } from "@/services/customers.service";
import { servicesService } from "@/services/services.service";
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
        className="w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-xl border border-border bg-white p-5 shadow-xl"
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
  no_show: "Không đến (No-show)",
};

const statusClass: Record<BookingStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  checkin: "bg-purple-100 text-purple-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-rose-100 text-rose-700",
  no_show: "bg-red-100 text-red-700",
};

const emptyStats: BookingStats = {
  total: 0,
  pending: 0,
  confirmed: 0,
  completed: 0,
  cancelled: 0,
  noShow: 0,
  cancelRate: 0,
  noShowRate: 0,
  lostRate: 0,
};
const NONE_OPTION_VALUE = "__none__";
type ServiceSelectionForm = {
  categoryId: string;
  serviceId: string;
  memberId: string;
};

type GuestServicesForm = {
  services: ServiceSelectionForm[];
};

function createEmptyServiceSelection(): ServiceSelectionForm {
  return {
    categoryId: "",
    serviceId: "",
    memberId: "",
  };
}

function createEmptyGuestServices(): GuestServicesForm {
  return {
    services: [createEmptyServiceSelection()],
  };
}

function todayString() {
  return new Date().toISOString().split("T")[0] ?? "";
}

export function BookingsPage() {
  const queryClient = useQueryClient();

  const [actionError, setActionError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [fromDate, setFromDate] = useState(todayString());
  const [toDate, setToDate] = useState(todayString());

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);

  const [formCustomerId, setFormCustomerId] = useState("");
  const [formBranchId, setFormBranchId] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formGuestCount, setFormGuestCount] = useState("1");
  const [formGuests, setFormGuests] = useState<GuestServicesForm[]>([createEmptyGuestServices()]);
  const [formStatus, setFormStatus] = useState<BookingStatus>("pending");
  const [formDepositAmount, setFormDepositAmount] = useState("0");
  const [formNoShowReason, setFormNoShowReason] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [quickCustomerOpen, setQuickCustomerOpen] = useState(false);
  const [quickCustomerName, setQuickCustomerName] = useState("");
  const [quickCustomerPhone, setQuickCustomerPhone] = useState("");

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
      branchId: branchFilter === "all" ? undefined : Number(branchFilter),
      from: fromDate,
      to: toDate,
      status: statusFilter,
      search: debouncedSearchQuery,
      page: 1,
      limit: 100,
    }),
    [branchFilter, debouncedSearchQuery, fromDate, statusFilter, toDate],
  );

  const dependenciesQuery = useQuery({
    queryKey: queryKeys.bookingDependencies,
    queryFn: () => bookingsService.listDependencies(),
  });
  const serviceCategoriesQuery = useQuery({
    queryKey: queryKeys.serviceCategories,
    queryFn: () => servicesService.listCategories(),
  });

  const bookingsQuery = useQuery({
    queryKey: queryKeys.bookings(filters),
    queryFn: () => bookingsService.list(filters),
  });

  const statsQuery = useQuery({
    queryKey: queryKeys.bookingStats(
      fromDate,
      toDate,
      branchFilter === "all" ? undefined : Number(branchFilter),
    ),
    queryFn: () =>
      bookingsService.stats(
        fromDate,
        toDate,
        branchFilter === "all" ? undefined : Number(branchFilter),
      ),
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

  const createCustomerMutation = useMutation({
    mutationFn: (payload: { name: string; phone: string }) =>
      customersService.create({
        name: payload.name,
        phone: payload.phone,
        email: null,
        notes: "",
        gender: null,
        location: null,
      }),
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
    mutationFn: ({
      id,
      status,
      noShowReason,
    }: {
      id: number;
      status: BookingStatus;
      noShowReason?: string;
    }) => bookingsService.updateStatus(id, status, noShowReason),
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
  const branches = dependenciesQuery.data?.[3] ?? [];

  const bookings = bookingsQuery.data?.data ?? [];
  const stats = statsQuery.data ?? emptyStats;

  const loading =
    dependenciesQuery.isLoading ||
    serviceCategoriesQuery.isLoading ||
    bookingsQuery.isLoading ||
    statsQuery.isLoading;
  const saving =
    createCustomerMutation.isPending ||
    createMutation.isPending ||
    updateMutation.isPending ||
    updateStatusMutation.isPending ||
    deleteMutation.isPending;

  const error =
    actionError ??
    (dependenciesQuery.error instanceof Error ? dependenciesQuery.error.message : null) ??
    (serviceCategoriesQuery.error instanceof Error ? serviceCategoriesQuery.error.message : null) ??
    (bookingsQuery.error instanceof Error ? bookingsQuery.error.message : null) ??
    (statsQuery.error instanceof Error ? statsQuery.error.message : null) ??
    (createCustomerMutation.error instanceof Error ? createCustomerMutation.error.message : null) ??
    (createMutation.error instanceof Error ? createMutation.error.message : null) ??
    (updateMutation.error instanceof Error ? updateMutation.error.message : null) ??
    (updateStatusMutation.error instanceof Error ? updateStatusMutation.error.message : null) ??
    (deleteMutation.error instanceof Error ? deleteMutation.error.message : null);

  function resetForm() {
    setFormCustomerId("");
    setFormBranchId("");
    setFormDate("");
    setFormGuestCount("1");
    setFormGuests([createEmptyGuestServices()]);
    setFormStatus("pending");
    setFormDepositAmount("0");
    setFormNoShowReason("");
    setFormNotes("");
    setQuickCustomerOpen(false);
    setQuickCustomerName("");
    setQuickCustomerPhone("");
  }

  const customerById = useMemo(
    () => new Map(customers.map((item) => [String(item.id), item])),
    [customers],
  );
  const branchById = useMemo(
    () => new Map(branches.map((item) => [item.id, item])),
    [branches],
  );

  const serviceById = useMemo(() => new Map(services.map((item) => [item.id, item])), [services]);
  const serviceCategoryOptions = useMemo(() => {
    const categories = serviceCategoriesQuery.data ?? [];
    if (categories.length > 0) {
      return categories.map((item) => ({ id: item.id, name: item.name }));
    }

    const categoryMap = new Map<number, string>();
    for (const service of services) {
      if (!categoryMap.has(service.categoryId)) {
        categoryMap.set(service.categoryId, `Nhóm #${service.categoryId}`);
      }
    }
    return Array.from(categoryMap.entries()).map(([id, name]) => ({ id, name }));
  }, [serviceCategoriesQuery.data, services]);

  const memberById = useMemo(() => {
    return new Map(
      members.map((item) => [item.id, item.user?.name ?? item.user?.email ?? item.id]),
    );
  }, [members]);

  function setGuestCount(nextValue: string) {
    setFormGuestCount(nextValue);
    const nextCount = Number(nextValue);
    if (!Number.isInteger(nextCount) || nextCount <= 0) return;

    setFormGuests((previous) => {
      if (previous.length === nextCount) return previous;
      if (previous.length > nextCount) return previous.slice(0, nextCount);
      return [
        ...previous,
        ...Array.from({ length: nextCount - previous.length }, () => createEmptyGuestServices()),
      ];
    });
  }

  function updateGuestService(
    guestIndex: number,
    serviceIndex: number,
    field: keyof ServiceSelectionForm,
    value: string,
  ) {
    setFormGuests((previous) =>
      previous.map((guest, index) => {
        if (index !== guestIndex) return guest;
        return {
          ...guest,
          services: guest.services.map((service, entryIndex) => {
            if (entryIndex !== serviceIndex) return service;
            const next = { ...service, [field]: value };
            if (field === "categoryId") {
              next.serviceId = "";
            }
            if (field === "serviceId") {
              const selectedService = value ? serviceById.get(Number(value)) : undefined;
              next.categoryId = selectedService ? String(selectedService.categoryId) : service.categoryId;
            }
            return next;
          }),
        };
      }),
    );
  }

  function addGuestService(guestIndex: number) {
    setFormGuests((previous) =>
      previous.map((guest, index) =>
        index === guestIndex
          ? { ...guest, services: [...guest.services, createEmptyServiceSelection()] }
          : guest,
      ),
    );
  }

  function removeGuestService(guestIndex: number, serviceIndex: number) {
    setFormGuests((previous) =>
      previous.map((guest, index) => {
        if (index !== guestIndex) return guest;
        const nextServices = guest.services.filter((_, entryIndex) => entryIndex !== serviceIndex);
        return {
          ...guest,
          services: nextServices.length > 0 ? nextServices : [createEmptyServiceSelection()],
        };
      }),
    );
  }

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
      id: "branch",
      header: "Chi nhánh",
      cell: ({ row }) => {
        const branchId = Number(row.original.branchId ?? 0);
        return row.original.branch?.name || branchById.get(branchId)?.name || "Toàn hệ thống";
      },
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
        <div className="space-y-1">
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusClass[row.original.status]}`}
          >
            {statusText[row.original.status]}
          </span>
          {row.original.status === "no_show" && row.original.noShowReason ? (
            <div className="max-w-52 truncate text-[11px] text-muted-foreground">
              Lý do: {row.original.noShowReason}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      id: "deposit",
      header: "Tiền cọc",
      meta: {
        className: "text-right",
        headerClassName: "text-right",
      },
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {Number(row.original.depositPaid ?? row.original.depositAmount ?? 0).toLocaleString("vi-VN")}đ
        </div>
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

  function setFormError(message: string) {
    setActionError(message);
    toast.error(message);
  }

  function buildPayload(): BookingPayload | null {
    const customerId = Number(formCustomerId);
    const branchId = formBranchId ? Number(formBranchId) : undefined;
    const guestCount = Number(formGuestCount);
    const depositAmount = Number(formDepositAmount);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      setFormError("Vui lòng chọn khách hàng");
      return null;
    }
    if (typeof branchId === "number" && (!Number.isInteger(branchId) || branchId <= 0)) {
      setFormError("Chi nhánh không hợp lệ");
      return null;
    }
    if (!formDate) {
      setFormError("Vui lòng chọn ngày giờ");
      return null;
    }
    if (!Number.isInteger(guestCount) || guestCount <= 0) {
      setFormError("Số lượng khách không hợp lệ");
      return null;
    }
    if (!Number.isFinite(depositAmount) || depositAmount < 0) {
      setFormError("Số tiền cọc không hợp lệ");
      return null;
    }
    if (formStatus === "no_show" && !formNoShowReason.trim()) {
      setFormError("Vui lòng nhập lý do no-show");
      return null;
    }

    if (formGuests.length !== guestCount) {
      setFormError("Số lượng khu vực dịch vụ chưa khớp số khách");
      return null;
    }

    try {
      const guests = formGuests.map((guest, guestIndex) => {
        if (!guest.services.length) {
          throw new Error(`Vui lòng chọn ít nhất 1 dịch vụ cho khách ${guestIndex + 1}`);
        }

        const mappedServices = guest.services.map((entry, serviceIndex) => {
          const categoryId = Number(entry.categoryId);
          const serviceId = Number(entry.serviceId);
          if (!Number.isInteger(categoryId) || categoryId <= 0) {
            throw new Error(
              `Vui lòng chọn nhóm dịch vụ cho khách ${guestIndex + 1}, mục ${serviceIndex + 1}`,
            );
          }
          if (!Number.isInteger(serviceId) || serviceId <= 0) {
            throw new Error(`Vui lòng chọn dịch vụ cho khách ${guestIndex + 1}, mục ${serviceIndex + 1}`);
          }

          const service = serviceById.get(serviceId);
          if (!service) {
            throw new Error(
              `Dịch vụ đã chọn cho khách ${guestIndex + 1}, mục ${serviceIndex + 1} không tồn tại`,
            );
          }
          if (service.categoryId !== categoryId) {
            throw new Error(
              `Nhóm dịch vụ không khớp với dịch vụ đã chọn ở khách ${guestIndex + 1}, mục ${serviceIndex + 1}`,
            );
          }

          return {
            categoryId,
            serviceId,
            memberId: entry.memberId || undefined,
            price: service.price,
          };
        });

        return { services: mappedServices };
      });

      return {
        customerId,
        branchId,
        guests,
        guestCount,
        date: new Date(formDate).toISOString(),
        status: formStatus,
        depositAmount,
        depositPaid: depositAmount,
        noShowReason: formStatus === "no_show" ? formNoShowReason.trim() : undefined,
        notes: formNotes,
      };
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Dữ liệu lịch hẹn không hợp lệ");
      return null;
    }
  }

  async function createBooking(event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    const payload = buildPayload();
    if (!payload) return;

    setActionError(null);
    try {
      await createMutation.mutateAsync(payload);
      toast.success("Tạo lịch hẹn thành công");
      setCreateOpen(false);
      resetForm();
    } catch {
      // handled by mutation state
    }
  }

  async function quickCreateCustomer() {
    const name = quickCustomerName.trim();
    const phone = quickCustomerPhone.trim();

    if (!name) {
      setFormError("Vui lòng nhập tên khách hàng");
      return;
    }
    if (!phone) {
      setFormError("Vui lòng nhập số điện thoại khách hàng");
      return;
    }

    setActionError(null);
    try {
      const created = await createCustomerMutation.mutateAsync({ name, phone });
      await queryClient.invalidateQueries({ queryKey: queryKeys.bookingDependencies });
      const refreshed = await dependenciesQuery.refetch();
      const refreshedCustomers = refreshed.data?.[0] ?? [];
      const matchedCustomer =
        refreshedCustomers.find((item) => item.id === created.id) ??
        refreshedCustomers.find((item) => item.phone === phone && item.name === name);
      if (matchedCustomer) {
        setFormCustomerId(String(matchedCustomer.id));
      }
      setQuickCustomerName("");
      setQuickCustomerPhone("");
      setQuickCustomerOpen(false);
      toast.success("Đã tạo khách hàng mới");
    } catch {
      // handled by mutation state
    }
  }

  function openEdit(booking: BookingItem) {
    setSelectedBooking(booking);
    setFormCustomerId(String(booking.customerId));
    setFormBranchId(booking.branchId ? String(booking.branchId) : "");
    const iso = new Date(booking.date).toISOString();
    setFormDate(iso.slice(0, 16));
    setFormGuestCount(String(booking.guestCount));
    const mappedGuests =
      booking.guests.length > 0
        ? booking.guests.map((guest) => ({
            services:
              guest.services.length > 0
                ? guest.services.map((serviceEntry) => ({
                    categoryId: String(
                      serviceEntry.categoryId ?? serviceById.get(serviceEntry.serviceId)?.categoryId ?? "",
                    ),
                    serviceId: String(serviceEntry.serviceId),
                    memberId: serviceEntry.memberId ?? "",
                  }))
                : [createEmptyServiceSelection()],
          }))
        : Array.from({ length: Math.max(booking.guestCount, 1) }, () => createEmptyGuestServices());
    const normalizedGuestCount = Math.max(booking.guestCount, 1);
    if (mappedGuests.length < normalizedGuestCount) {
      mappedGuests.push(
        ...Array.from({ length: normalizedGuestCount - mappedGuests.length }, () => createEmptyGuestServices()),
      );
    }
    setFormGuests(mappedGuests.slice(0, normalizedGuestCount));
    setFormStatus(booking.status);
    setFormDepositAmount(String(booking.depositPaid ?? booking.depositAmount ?? 0));
    setFormNoShowReason(booking.noShowReason ?? "");
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
      toast.success("Cập nhật lịch hẹn thành công");
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
      await updateStatusMutation.mutateAsync({
        id,
        status,
        noShowReason:
          status === "no_show" ? "Đánh dấu no-show nhanh từ danh sách lịch hẹn" : undefined,
      });
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
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
          <div className="space-y-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Khách hàng</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickCustomerOpen((previous) => !previous)}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Tạo nhanh khách
                </Button>
              </div>
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
              {quickCustomerOpen ? (
                <div className="mt-1 grid gap-3 rounded-lg border border-border/70 bg-muted/20 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                  <div className="grid gap-1.5">
                    <Label>Tên khách</Label>
                    <Input
                      value={quickCustomerName}
                      onChange={(event) => setQuickCustomerName(event.target.value)}
                      placeholder="Ví dụ: Nguyễn Thị A"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Số điện thoại</Label>
                    <Input
                      value={quickCustomerPhone}
                      onChange={(event) => setQuickCustomerPhone(event.target.value)}
                      placeholder="Ví dụ: 09xxxxxxxx"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => void quickCreateCustomer()}
                    disabled={createCustomerMutation.isPending}
                  >
                    {createCustomerMutation.isPending ? "Đang tạo..." : "Tạo khách"}
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label>Chi nhánh</Label>
              <Select
                value={formBranchId || NONE_OPTION_VALUE}
                onValueChange={(value) => setFormBranchId(value === NONE_OPTION_VALUE ? "" : value)}
              >
                <SelectTrigger className="h-10 rounded-md border px-3 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_OPTION_VALUE}>Tự động theo mặc định</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={String(branch.id)}>
                      {branch.name}
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
                  onChange={(event) => setGuestCount(event.target.value)}
                />
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
              <Label>Tiền cọc (₫)</Label>
              <Input
                type="number"
                min={0}
                step="1000"
                value={formDepositAmount}
                onChange={(event) => setFormDepositAmount(event.target.value)}
              />
            </div>

            {formStatus === "no_show" ? (
              <div className="grid gap-2">
                <Label>Lý do no-show</Label>
                <Textarea
                  value={formNoShowReason}
                  onChange={(event) => setFormNoShowReason(event.target.value)}
                  placeholder="Ví dụ: Khách báo bận sát giờ, không thể đến..."
                />
              </div>
            ) : null}

            <div className="grid gap-2">
              <Label>Ghi chú</Label>
              <Textarea value={formNotes} onChange={(event) => setFormNotes(event.target.value)} />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-border/70 bg-muted/15 p-3 lg:max-h-[72vh] lg:overflow-y-auto">
            <div className="flex items-center justify-between">
              <Label>Dịch vụ theo từng khách</Label>
              <span className="text-xs text-muted-foreground">
                {formGuests.length} khu vực cho {formGuestCount} khách
              </span>
            </div>
            {formGuests.map((guest, guestIndex) => (
              <div
                key={`guest-${guestIndex}`}
                className="space-y-2 rounded-lg border border-border/70 bg-background p-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Khách {guestIndex + 1}</h4>
                  <Button type="button" variant="outline" size="sm" onClick={() => addGuestService(guestIndex)}>
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Thêm dịch vụ
                  </Button>
                </div>
                {guest.services.map((serviceEntry, serviceIndex) => {
                  const filteredServices = serviceEntry.categoryId
                    ? services.filter((item) => String(item.categoryId) === serviceEntry.categoryId)
                    : [];
                  return (
                    <div
                      key={`guest-${guestIndex}-service-${serviceIndex}`}
                      className="grid gap-2 rounded-md border border-border/60 bg-muted/10 p-2 sm:grid-cols-[1fr_1.2fr_1fr_auto]"
                    >
                      <div className="grid gap-1">
                        <Label>Nhóm dịch vụ</Label>
                        <Select
                          value={serviceEntry.categoryId || NONE_OPTION_VALUE}
                          onValueChange={(value) =>
                            updateGuestService(
                              guestIndex,
                              serviceIndex,
                              "categoryId",
                              value === NONE_OPTION_VALUE ? "" : value,
                            )
                          }
                        >
                          <SelectTrigger className="h-9 rounded-md border px-2 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE_OPTION_VALUE}>Chọn nhóm</SelectItem>
                            {serviceCategoryOptions.map((category) => (
                              <SelectItem key={category.id} value={String(category.id)}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-1">
                        <Label>Dịch vụ</Label>
                        <Select
                          value={serviceEntry.serviceId || NONE_OPTION_VALUE}
                          onValueChange={(value) =>
                            updateGuestService(
                              guestIndex,
                              serviceIndex,
                              "serviceId",
                              value === NONE_OPTION_VALUE ? "" : value,
                            )
                          }
                        >
                          <SelectTrigger className="h-9 rounded-md border px-2 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE_OPTION_VALUE}>Chọn dịch vụ</SelectItem>
                            {filteredServices.map((item) => (
                              <SelectItem key={item.id} value={String(item.id)}>
                                {item.name} - {item.price.toLocaleString("vi-VN")}đ
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-1">
                        <Label>Nhân viên</Label>
                        <Select
                          value={serviceEntry.memberId || NONE_OPTION_VALUE}
                          onValueChange={(value) =>
                            updateGuestService(
                              guestIndex,
                              serviceIndex,
                              "memberId",
                              value === NONE_OPTION_VALUE ? "" : value,
                            )
                          }
                        >
                          <SelectTrigger className="h-9 rounded-md border px-2 text-sm">
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

                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-rose-600 hover:text-rose-700"
                          onClick={() => removeGuestService(guestIndex, serviceIndex)}
                          title="Xóa dịch vụ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
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
          <div className="text-xs text-muted-foreground">No-show</div>
          <div className="text-xl font-semibold text-red-700">{stats.noShow}</div>
          <div className="text-xs text-muted-foreground">{stats.noShowRate.toFixed(1)}%</div>
        </div>
        <div className="rounded-xl border bg-white p-3">
          <div className="text-xs text-muted-foreground">Tỷ lệ mất lịch</div>
          <div className="text-xl font-semibold text-rose-700">{stats.lostRate.toFixed(1)}%</div>
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
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="h-10 rounded-md border px-3 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả chi nhánh</SelectItem>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={String(branch.id)}>
                {branch.name}
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
