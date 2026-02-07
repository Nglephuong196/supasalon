<script lang="ts">
  import { Card, CardContent } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import * as Tabs from "$lib/components/ui/tabs";
  import {
    CalendarCheck,
    Clock,
    UserCheck,
    UserX,
    Plus,
    Search,
    Calendar,
    Download,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    Pencil,
    Trash,
    Filter,
    Check,
    Calendar as CalendarIcon,
  } from "@lucide/svelte";
  import { cn } from "$lib/utils";
  import { goto, invalidateAll } from "$app/navigation";
  import { page } from "$app/stores";
  import { get } from "svelte/store";
  import { enhance } from "$app/forms";
  import DateTimePicker from "$lib/components/ui/date-time-picker/date-time-picker.svelte";
  import { RangeCalendar } from "$lib/components/ui/range-calendar/index.js";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import Combobox from "$lib/components/ui/combobox/combobox.svelte";
  import * as Select from "$lib/components/ui/select";
  import { toast } from "svelte-sonner";
  import type { PageData } from "./$types";
  import {
    DateFormatter,
    getLocalTimeZone,
    today,
    type DateValue,
    parseDate,
  } from "@internationalized/date";

  let { data }: { data: PageData } = $props();

  let activeTab = $state("list");

  // Filter states
  let dateFilter = $state<"today" | "pastWeek" | "week" | "month" | "custom">("today");

  // Date Range State
  const df = new DateFormatter("vi-VN", {
    dateStyle: "medium",
  });

  let value = $state<{
    start: DateValue | undefined;
    end: DateValue | undefined;
  }>({
    start: undefined,
    end: undefined,
  });

  let fromDate = $state("");
  let toDate = $state("");
  let statusFilter = $state("all");
  let searchQuery = $state("");
  let currentPage = $state(1);
  let pageSize = $state(20);
  let calendarServiceFilter = $state("all");
  let calendarStaffFilter = $state("all");

  // Sync filter states from URL on data change
  $effect(() => {
    const filters = data.filters as any;
    if (filters) {
      fromDate = filters.from || "";
      toDate = filters.to || "";
      const today = getDateOnly(new Date());
      const todayStr = today.toISOString().split("T")[0];
      const sevenDaysAgoStr = addDays(today, -7).toISOString().split("T")[0];
      const nextWeekStr = addDays(today, 7).toISOString().split("T")[0];
      const firstDayOfMonthStr = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      const lastDayOfMonthStr = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];

      if (fromDate === todayStr && toDate === todayStr) {
        dateFilter = "today";
      } else if (fromDate === sevenDaysAgoStr && toDate === todayStr) {
        dateFilter = "pastWeek";
      } else if (fromDate === todayStr && toDate === nextWeekStr) {
        dateFilter = "week";
      } else if (fromDate === firstDayOfMonthStr && toDate === lastDayOfMonthStr) {
        dateFilter = "month";
      } else {
        dateFilter = "custom";
      }

      // Parse existing dates into RangeCalendar value if present
      if (fromDate && toDate) {
        try {
          value = {
            start: parseDate(fromDate),
            end: parseDate(toDate),
          };
        } catch (e) {
          // ignore parse error
        }
      } else if (!fromDate && !toDate && dateFilter === "today") {
        // Default to today if nothing set? Or leave undefined?
        // The original code had init logic maybe?
        // Let's rely on dateFilter logic or user input.
      }

      statusFilter = filters.status || "all";
      searchQuery = filters.search || "";
    }
    if (data.pagination) {
      currentPage = data.pagination.page || 1;
      pageSize = data.pagination.limit || 20;
    }
  });

  // Dialog states
  let isCreateOpen = $state(false);
  let isDeleteOpen = $state(false);
  let deletingBooking = $state<any>(null);
  let isQuickCreateOpen = $state(false);

  // Customer Autocomplete state
  let customerSearchQuery = $state("");
  let showCustomerResults = $state(false);

  // Quick Create Validation Errors
  let quickNameError = $state("");
  let quickPhoneError = $state("");

  let customerItems = $derived(
    (data.customers || []).map((c: any) => ({
      value: c.id.toString(),
      label: `${c.name} - ${c.phone}`,
    })),
  );

  let calendarServiceOptions = $derived([
    { value: "all", label: "Tất cả dịch vụ" },
    ...(data.services || []).map((service: any) => ({
      value: service.id.toString(),
      label: service.name,
    })),
  ]);

  let calendarStaffOptions = $derived([
    { value: "all", label: "Tất cả nhân viên" },
    ...(data.members || []).map((member: any) => ({
      value: member.id.toString(),
      label: member.user?.name || member.name || `NV #${member.id}`,
    })),
  ]);

  $effect(() => {
    if (newBooking.customerId) {
      const customer = data.customers?.find((c: any) => c.id.toString() === newBooking.customerId);
      if (customer) {
        newBooking.customerPhone = customer.phone;
      }
    }
  });

  function selectCustomer(customer: any) {
    newBooking.customerId = customer.id.toString();
    newBooking.customerPhone = customer.phone;
    customerSearchQuery = `${customer.name} - ${customer.phone}`;
    showCustomerResults = false;
  }

  // Form states for create/edit
  let editingBookingId = $state<number | null>(null);
  let newBooking = $state({
    customerId: "",
    customerPhone: "",
    date: "",
    guestCount: "1",
    status: "confirmed",
    notes: "",
    guests: [{ services: [{ categoryId: "", serviceId: "", memberId: "" }] }],
  });

  // Sync guest count with guests array
  $effect(() => {
    const count = parseInt(newBooking.guestCount) || 1;
    const currentGuests = newBooking.guests.length;

    if (count > currentGuests) {
      // Add new guest areas
      for (let i = currentGuests; i < count; i++) {
        newBooking.guests = [
          ...newBooking.guests,
          {
            services: [{ categoryId: "", serviceId: "", memberId: "" }],
          },
        ];
      }
    } else if (count < currentGuests) {
      // Remove extra guest areas
      newBooking.guests = newBooking.guests.slice(0, count);
    }
  });

  let selectedCustomer = $derived(
    (data.customers || []).find((c: any) => c.id.toString() === newBooking.customerId),
  );

  let totalGuestServices = $derived(
    (newBooking.guests || []).reduce(
      (total: number, guest: any) =>
        total + (guest.services || []).filter((service: any) => service.serviceId).length,
      0,
    ),
  );

  let canSubmitBooking = $derived(
    Boolean(
      newBooking.customerId &&
      newBooking.date &&
      (parseInt(newBooking.guestCount) || 0) > 0 &&
      totalGuestServices > 0,
    ),
  );

  const statusStyles: Record<string, string> = {
    confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    completed: "bg-blue-100 text-blue-700 border-blue-200",
    cancelled: "bg-rose-100 text-rose-700 border-rose-200",
    checkin: "bg-purple-100 text-purple-700 border-purple-200",
  };

  const statusLabels: Record<string, string> = {
    confirmed: "Đã xác nhận",
    pending: "Chờ xác nhận",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
    checkin: "Đã check-in",
  };

  const statusOptions = [
    { value: "all", label: "Tất cả" },
    { value: "pending", label: "Chờ xác nhận" },
    { value: "confirmed", label: "Đã xác nhận" },
    { value: "checkin", label: "Đã check-in" },
    { value: "completed", label: "Hoàn thành" },
    { value: "cancelled", label: "Đã hủy" },
  ];

  let selectedStatusLabel = $derived(
    statusOptions.find((o) => o.value === statusFilter)?.label || "Trạng thái",
  );

  const TEST_CALENDAR_START_HOUR = 8;
  const TEST_CALENDAR_END_HOUR = 21;
  const TEST_CALENDAR_HOUR_HEIGHT = 64;
  const TEST_CALENDAR_EVENT_HEIGHT = 74;
  const TEST_CALENDAR_WEEK_EVENT_HEIGHT = TEST_CALENDAR_EVENT_HEIGHT - 14;
  const DRAG_BOOKING_MIME = "application/x-booking";

  let testCalendarView = $state<"day" | "week" | "month">("day");
  let testCalendarDate = $state(getDateOnly(new Date()));

  let testCalendarDayStripDays = $derived(
    Array.from({ length: 7 }, (_, index) => addDays(testCalendarDate, index - 3)),
  );

  let testCalendarWeekDays = $derived(
    Array.from({ length: 7 }, (_, index) => addDays(getStartOfWeek(testCalendarDate), index)),
  );

  let calendarFilteredBookings = $derived(
    (data.bookings || []).filter((booking: any) =>
      bookingMatchesCalendarFilters(booking, calendarServiceFilter, calendarStaffFilter),
    ),
  );

  let bookingsByDate = $derived(groupBookingsByDate(calendarFilteredBookings));

  let testCalendarDayBookings = $derived(
    calendarFilteredBookings
      .filter((booking: any) => isSameDay(new Date(booking.date), testCalendarDate))
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  );

  let testCalendarMonthDays = $derived(getMonthGridDays(testCalendarDate));

  let testCalendarTimelineHeight = $derived(
    (TEST_CALENDAR_END_HOUR - TEST_CALENDAR_START_HOUR) * TEST_CALENDAR_HOUR_HEIGHT,
  );

  let dayCalendarLayout = $derived(
    buildOverlapLayout(testCalendarDayBookings, TEST_CALENDAR_EVENT_HEIGHT),
  );

  let weekCalendarLayouts = $derived(
    Object.fromEntries(
      Object.entries(bookingsByDate).map(([dayKey, bookings]) => [
        dayKey,
        buildOverlapLayout(bookings as any[], TEST_CALENDAR_WEEK_EVENT_HEIGHT),
      ]),
    ) as Record<string, Record<number, { leftPct: number; widthPct: number; zIndex: number }>>,
  );

  function formatDate(dateStr: string) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatShortDate(dateStr: string) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  }

  function formatTime(dateStr: string) {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function generateBookingCode(id: number) {
    return `LH${String(id).padStart(6, "0")}`;
  }

  function getDateOnly(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function addDays(date: Date, amount: number) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
  }

  function addMonths(date: Date, amount: number) {
    return new Date(date.getFullYear(), date.getMonth() + amount, 1);
  }

  function isSameDay(left: Date, right: Date) {
    return (
      left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() &&
      left.getDate() === right.getDate()
    );
  }

  function isSameMonth(left: Date, right: Date) {
    return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
  }

  function getStartOfWeek(date: Date) {
    const result = getDateOnly(date);
    const day = result.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    result.setDate(result.getDate() + diff);
    return result;
  }

  function toDateKey(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function groupBookingsByDate(bookings: any[]) {
    const grouped: Record<string, any[]> = {};
    for (const booking of bookings) {
      const key = toDateKey(new Date(booking.date));
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(booking);
    }
    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    return grouped;
  }

  function getBookingServiceAndStaffIds(booking: any): {
    serviceIds: Set<string>;
    staffIds: Set<string>;
  } {
    const serviceIds = new Set<string>();
    const staffIds = new Set<string>();

    for (const guest of booking?.guests || []) {
      for (const item of guest?.services || []) {
        if (item?.serviceId != null) {
          serviceIds.add(String(item.serviceId));
        }
        if (item?.memberId != null) {
          staffIds.add(String(item.memberId));
        } else if (item?.staffId != null) {
          staffIds.add(String(item.staffId));
        }
      }
    }

    // Backward compatibility in case legacy bookingServices still appears in payload.
    for (const legacy of booking?.bookingServices || []) {
      if (legacy?.serviceId != null) {
        serviceIds.add(String(legacy.serviceId));
      } else if (legacy?.service?.id != null) {
        serviceIds.add(String(legacy.service.id));
      }
      if (legacy?.memberId != null) {
        staffIds.add(String(legacy.memberId));
      } else if (legacy?.staffId != null) {
        staffIds.add(String(legacy.staffId));
      }
    }

    return { serviceIds, staffIds };
  }

  function bookingMatchesCalendarFilters(
    booking: any,
    selectedService: string,
    selectedStaff: string,
  ) {
    if (selectedService === "all" && selectedStaff === "all") return true;

    const { serviceIds, staffIds } = getBookingServiceAndStaffIds(booking);

    if (selectedService !== "all" && !serviceIds.has(selectedService)) {
      return false;
    }
    if (selectedStaff !== "all" && !staffIds.has(selectedStaff)) {
      return false;
    }
    return true;
  }

  function getMonthGridDays(date: Date) {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const gridStart = getStartOfWeek(firstDayOfMonth);
    return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  }

  function isToday(dateStr: string) {
    const date = new Date(dateStr);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  function getDateLabel(dateStr: string) {
    if (isToday(dateStr)) return "(Hôm nay)";
    const date = new Date(dateStr);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) return "(Ngày mai)";
    return "";
  }

  function isPastBooking(dateStr: string) {
    return new Date(dateStr).getTime() < Date.now();
  }

  function formatCalendarDateHeader(date: Date) {
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatCalendarWeekday(date: Date) {
    return date.toLocaleDateString("vi-VN", { weekday: "short" });
  }

  function formatHourLabel(hour: number) {
    return `${String(hour).padStart(2, "0")}:00`;
  }

  function formatMonthLabel(date: Date) {
    return date.toLocaleDateString("vi-VN", {
      month: "long",
      year: "numeric",
    });
  }

  function formatWeekRangeLabel(date: Date) {
    const start = getStartOfWeek(date);
    const end = addDays(start, 6);
    return `${start.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} - ${end.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}`;
  }

  function shiftTestCalendar(amount: number) {
    if (testCalendarView === "month") {
      testCalendarDate = addMonths(testCalendarDate, amount);
      return;
    }
    if (testCalendarView === "week") {
      testCalendarDate = addDays(testCalendarDate, amount * 7);
      return;
    }
    testCalendarDate = addDays(testCalendarDate, amount);
  }

  function getTestCalendarTop(dateStr: string) {
    const date = new Date(dateStr);
    const minutesFromStart = (date.getHours() - TEST_CALENDAR_START_HOUR) * 60 + date.getMinutes();
    const rawTop = (minutesFromStart / 60) * TEST_CALENDAR_HOUR_HEIGHT;
    const maxTop = testCalendarTimelineHeight - TEST_CALENDAR_EVENT_HEIGHT;
    return Math.max(0, Math.min(maxTop, rawTop));
  }

  function buildOverlapLayout(bookings: any[], eventHeight: number) {
    type Positioned = { id: number; top: number; bottom: number };
    const positioned: Positioned[] = bookings
      .map((booking) => {
        const top = getTestCalendarTop(booking.date);
        return {
          id: booking.id,
          top,
          bottom: top + eventHeight,
        };
      })
      .sort((a, b) => (a.top !== b.top ? a.top - b.top : a.id - b.id));

    const columnById: Record<number, number> = {};
    const totalColumnsById: Record<number, number> = {};

    let active: Array<{ id: number; bottom: number; col: number }> = [];
    let groupIds: number[] = [];
    let groupMaxColumns = 1;

    const flushGroup = () => {
      for (const bookingId of groupIds) {
        totalColumnsById[bookingId] = Math.max(1, groupMaxColumns);
      }
      groupIds = [];
      groupMaxColumns = 1;
    };

    for (const event of positioned) {
      active = active.filter((item) => item.bottom > event.top);

      if (active.length === 0 && groupIds.length > 0) {
        flushGroup();
      }

      const usedCols = new Set(active.map((item) => item.col));
      let col = 0;
      while (usedCols.has(col)) col += 1;

      active.push({ id: event.id, bottom: event.bottom, col });
      groupIds.push(event.id);
      columnById[event.id] = col;
      groupMaxColumns = Math.max(groupMaxColumns, active.length);
    }

    if (groupIds.length > 0) {
      flushGroup();
    }

    const layout: Record<number, { leftPct: number; widthPct: number; zIndex: number }> = {};
    for (const booking of bookings) {
      const total = Math.max(1, totalColumnsById[booking.id] || 1);
      const col = Math.max(0, columnById[booking.id] || 0);
      const widthPct = 100 / total;
      const leftPct = col * widthPct;
      layout[booking.id] = {
        leftPct,
        widthPct,
        zIndex: col + 1,
      };
    }

    return layout;
  }

  function getDropDateByY(baseDate: Date, clientY: number, containerRect: DOMRect) {
    const y = Math.max(0, Math.min(containerRect.height, clientY - containerRect.top));
    const totalMinutes = (y / TEST_CALENDAR_HOUR_HEIGHT) * 60 + TEST_CALENDAR_START_HOUR * 60;
    const roundedMinutes = Math.round(totalMinutes / 15) * 15;
    const startMinutes = TEST_CALENDAR_START_HOUR * 60;
    const endMinutes = TEST_CALENDAR_END_HOUR * 60 - 15;
    const clampedMinutes = Math.max(startMinutes, Math.min(endMinutes, roundedMinutes));
    const hour = Math.floor(clampedMinutes / 60);
    const minute = clampedMinutes % 60;

    return new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      hour,
      minute,
      0,
      0,
    );
  }

  function readDraggedBooking(event: DragEvent): { id: number; date: string } | null {
    try {
      const payload = event.dataTransfer?.getData(DRAG_BOOKING_MIME);
      if (!payload) return null;
      const parsed = JSON.parse(payload);
      const id = Number(parsed?.id);
      const date = parsed?.date?.toString?.() || "";
      if (!id || !date) return null;
      return { id, date };
    } catch {
      return null;
    }
  }

  function handleBookingDragStart(event: DragEvent, booking: any) {
    if (!data.canUpdate) return;
    const payload = JSON.stringify({
      id: booking.id,
      date: booking.date,
    });
    event.dataTransfer?.setData(DRAG_BOOKING_MIME, payload);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
    }
  }

  async function moveBookingByDrop(bookingId: number, nextDate: Date) {
    const formData = new FormData();
    formData.set("id", bookingId.toString());
    formData.set("date", nextDate.toISOString());

    const res = await fetch("?/moveBooking", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      toast.success("Đã di chuyển lịch hẹn");
      await invalidateAll();
      return;
    }

    try {
      const result = await res.json();
      toast.error(result?.message || "Không thể di chuyển lịch hẹn");
    } catch {
      toast.error("Không thể di chuyển lịch hẹn");
    }
  }

  async function handleDropOnDayTimeline(event: DragEvent) {
    event.preventDefault();
    if (!data.canUpdate) return;

    const dragged = readDraggedBooking(event);
    if (!dragged) return;

    const container = event.currentTarget as HTMLDivElement | null;
    if (!container) return;

    const nextDate = getDropDateByY(
      testCalendarDate,
      event.clientY,
      container.getBoundingClientRect(),
    );
    await moveBookingByDrop(dragged.id, nextDate);
  }

  async function handleDropOnWeekColumn(event: DragEvent, day: Date) {
    event.preventDefault();
    if (!data.canUpdate) return;

    const dragged = readDraggedBooking(event);
    if (!dragged) return;

    const container = event.currentTarget as HTMLDivElement | null;
    if (!container) return;

    const nextDate = getDropDateByY(day, event.clientY, container.getBoundingClientRect());
    await moveBookingByDrop(dragged.id, nextDate);
  }

  async function handleDropOnMonthDay(event: DragEvent, day: Date) {
    event.preventDefault();
    if (!data.canUpdate) return;

    const dragged = readDraggedBooking(event);
    if (!dragged) return;

    const sourceDate = new Date(dragged.date);
    const nextDate = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      sourceDate.getHours(),
      sourceDate.getMinutes(),
      0,
      0,
    );
    await moveBookingByDrop(dragged.id, nextDate);
  }

  // Group bookings by date
  function groupByDate(bookings: any[]) {
    const groups: Record<string, any[]> = {};
    for (const booking of bookings) {
      const dateKey = new Date(booking.date).toDateString();
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(booking);
    }
    return Object.entries(groups).map(([dateKey, items]) => ({
      date: items[0].date,
      bookings: items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    }));
  }

  let groupedBookings = $derived(groupByDate(data.bookings || []));

  function getNowLocalDateTimeString() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const h = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${d}T${h}:${min}`;
  }

  function openCreateDialog() {
    editingBookingId = null;
    newBooking = {
      customerId: "",
      customerPhone: "",
      date: getNowLocalDateTimeString(),
      guestCount: "1",
      status: "confirmed",
      notes: "",
      guests: [
        {
          services: [{ categoryId: "", serviceId: "", memberId: "" }],
        },
      ],
    };
    isCreateOpen = true;
  }

  // Apply filters
  function applyFilters() {
    const params = new URLSearchParams();

    if (dateFilter === "today") {
      const today = new Date().toISOString().split("T")[0];
      params.set("from", today);
      params.set("to", today);
    } else if (dateFilter === "pastWeek") {
      const today = getDateOnly(new Date());
      const pastWeek = addDays(today, -7);
      params.set("from", pastWeek.toISOString().split("T")[0]);
      params.set("to", today.toISOString().split("T")[0]);
    } else if (dateFilter === "week") {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      params.set("from", today.toISOString().split("T")[0]);
      params.set("to", nextWeek.toISOString().split("T")[0]);
    } else if (dateFilter === "month") {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      params.set("from", firstDay.toISOString().split("T")[0]);
      params.set("to", lastDay.toISOString().split("T")[0]);
    } else if (fromDate && toDate) {
      params.set("from", fromDate);
      params.set("to", toDate);
    }

    if (statusFilter && statusFilter !== "all") {
      params.set("status", statusFilter);
    }
    if (searchQuery) {
      params.set("search", searchQuery);
    }
    params.set("page", "1");
    params.set("limit", pageSize.toString());

    goto(`/bookings?${params.toString()}`);
  }

  function setDateFilter(filter: "today" | "pastWeek" | "week" | "month" | "custom") {
    dateFilter = filter;
    if (filter !== "custom") {
      applyFilters();
    }
  }

  function goToPage(pageNum: number) {
    const currentPage = get(page);
    const params = new URLSearchParams(currentPage.url.searchParams);
    params.set("page", pageNum.toString());
    goto(`/bookings?${params.toString()}`);
  }

  function handleFormResult() {
    return async ({ result, update }: any) => {
      if (result.type === "success") {
        toast.success(editingBookingId ? "Đã cập nhật lịch hẹn" : "Thao tác thành công");
        isCreateOpen = false;
        isDeleteOpen = false;
        editingBookingId = null;
        // Force reload
        await invalidateAll();

        newBooking = {
          customerId: "",
          customerPhone: "",
          date: getNowLocalDateTimeString(),
          guestCount: "1",
          status: "confirmed",
          notes: "",
          guests: [
            {
              services: [{ categoryId: "", serviceId: "", memberId: "" }],
            },
          ],
        };
      } else if (result.type === "failure") {
        const errorMessage =
          typeof result.data?.message === "string"
            ? result.data.message
            : "Có lỗi xảy ra khi lưu lịch hẹn (Lỗi dữ liệu)";
        toast.error(errorMessage);
        console.error("Booking save error:", result);
      }
      await update();
    };
  }

  async function handleStatusChange(bookingId: number, newStatus: string) {
    const formData = new FormData();
    formData.set("id", bookingId.toString());
    formData.set("status", newStatus);

    const res = await fetch("?/updateStatus", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      toast.success("Đã cập nhật trạng thái");
      // Refresh the page to get updated data
      goto($page.url.toString(), { invalidateAll: true });
    } else {
      toast.error("Không thể cập nhật trạng thái");
    }
  }

  function openDeleteDialog(booking: any) {
    deletingBooking = booking;
    isDeleteOpen = true;
  }

  function openEditDialog(booking: any) {
    editingBookingId = booking.id;

    let guests = booking.guests || [];

    if (!guests.length || guests.length === 0) {
      guests = [{ services: [{ categoryId: "", serviceId: "", memberId: "" }] }];
    } else {
      // Map JSON structure to Form structure (strings)
      guests = guests.map((g: any) => ({
        services: (g.services || []).map((s: any) => ({
          categoryId: s.categoryId?.toString() || "",
          serviceId: s.serviceId?.toString() || "",
          memberId: s.memberId?.toString() || s.staffId?.toString() || "",
        })),
      }));
    }

    newBooking = {
      customerId: booking.customerId.toString(),
      customerPhone: booking.customer?.phone || "",
      date: booking.date,
      guestCount: booking.guestCount?.toString() || "1",
      status: booking.status,
      notes: booking.notes || "",
      guests: guests,
    };

    isCreateOpen = true;
  }
</script>

<svelte:head>
  <title>Lịch hẹn | SupaSalon</title>
</svelte:head>

<div class="flex flex-col gap-4">
  <!-- Header -->
  <div class="page-hero p-5 sm:p-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="section-title text-2xl font-bold tracking-tight">Lịch hẹn</h1>
        <p class="text-muted-foreground">Quản lý lịch hẹn của khách hàng</p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" class="gap-2 soft-input">
          <Download class="h-4 w-4" />
          Xuất Excel
        </Button>
        {#if data.canCreate}
          <Button class="btn-gradient gap-2" onclick={openCreateDialog}>
            <Plus class="h-4 w-4" />
            Tạo mới lịch hẹn
          </Button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Stats Cards -->
  <div class="grid gap-4 grid-cols-2 sm:grid-cols-4">
    <Card class="premium-card card-hover">
      <CardContent class="p-4">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Tổng lịch hẹn
            </p>
            <span class="text-2xl font-bold">{data.stats?.total || 0}</span>
          </div>
          <div class="p-2.5 rounded-lg bg-purple-100">
            <CalendarCheck class="h-5 w-5 text-purple-600" />
          </div>
        </div>
      </CardContent>
    </Card>
    <Card class="premium-card card-hover">
      <CardContent class="p-4">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Chờ xác nhận
            </p>
            <span class="text-2xl font-bold text-yellow-600">{data.stats?.pending || 0}</span>
          </div>
          <div class="p-2.5 rounded-lg bg-yellow-100">
            <Clock class="h-5 w-5 text-yellow-600" />
          </div>
        </div>
      </CardContent>
    </Card>
    <Card class="premium-card card-hover">
      <CardContent class="p-4">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Hoàn thành
            </p>
            <span class="text-2xl font-bold text-green-600">{data.stats?.completed || 0}</span>
          </div>
          <div class="p-2.5 rounded-lg bg-green-100">
            <UserCheck class="h-5 w-5 text-green-600" />
          </div>
        </div>
      </CardContent>
    </Card>
    <Card class="premium-card card-hover">
      <CardContent class="p-4">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Tỷ lệ hủy
            </p>
            <span class="text-2xl font-bold text-red-600">{data.stats?.cancelRate || 0}%</span>
          </div>
          <div class="p-2.5 rounded-lg bg-red-100">
            <UserX class="h-5 w-5 text-red-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>

  <Tabs.Root bind:value={activeTab} class="space-y-4">
    <Tabs.List class="w-fit">
      <Tabs.Trigger value="list">Danh sách</Tabs.Trigger>
      <Tabs.Trigger value="calendar">Lịch</Tabs.Trigger>
    </Tabs.List>

    <Tabs.Content value="list">
      <!-- Bookings Table Card -->
      <div class="table-shell bg-card text-card-foreground">
        <!-- Filters Header -->
        <div class="filter-strip rounded-none border-x-0 border-t-0 p-4 space-y-4">
          <div class="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
            <!-- Date Filter Buttons -->
            <div class="flex items-center gap-2 flex-wrap">
              <div class="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
                <Button
                  variant="ghost"
                  class={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors h-auto",
                    dateFilter === "today"
                      ? "bg-white shadow-sm text-purple-600"
                      : "text-gray-600 hover:text-gray-900 hover:bg-transparent",
                  )}
                  onclick={() => setDateFilter("today")}
                >
                  Hôm nay
                </Button>
                <Button
                  variant="ghost"
                  class={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors h-auto",
                    dateFilter === "pastWeek"
                      ? "bg-white shadow-sm text-purple-600"
                      : "text-gray-600 hover:text-gray-900 hover:bg-transparent",
                  )}
                  onclick={() => setDateFilter("pastWeek")}
                >
                  7 ngày qua
                </Button>
                <Button
                  variant="ghost"
                  class={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors h-auto",
                    dateFilter === "week"
                      ? "bg-white shadow-sm text-purple-600"
                      : "text-gray-600 hover:text-gray-900 hover:bg-transparent",
                  )}
                  onclick={() => setDateFilter("week")}
                >
                  7 ngày tới
                </Button>
                <Button
                  variant="ghost"
                  class={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors h-auto",
                    dateFilter === "month"
                      ? "bg-white shadow-sm text-purple-600"
                      : "text-gray-600 hover:text-gray-900 hover:bg-transparent",
                  )}
                  onclick={() => setDateFilter("month")}
                >
                  Tháng này
                </Button>
              </div>

              <!-- Custom Date Range -->
              <div class="flex items-center gap-2">
                <Popover.Root>
                  <Popover.Trigger>
                    {#snippet child({ props })}
                      <Button
                        variant="outline"
                        class={cn(
                          "w-[280px] justify-start text-left font-normal",
                          !value && "text-muted-foreground",
                        )}
                        {...props}
                      >
                        <CalendarIcon class="mr-2 h-4 w-4" />
                        {#if value && value.start}
                          {#if value.end}
                            {df.format(value.start.toDate(getLocalTimeZone()))} - {df.format(
                              value.end.toDate(getLocalTimeZone()),
                            )}
                          {:else}
                            {df.format(value.start.toDate(getLocalTimeZone()))}
                          {/if}
                        {:else}
                          <span>Chọn khoảng thời gian</span>
                        {/if}
                      </Button>
                    {/snippet}
                  </Popover.Trigger>
                  <Popover.Content class="w-auto p-0" align="start">
                    <RangeCalendar bind:value class="rounded-md border" />
                  </Popover.Content>
                </Popover.Root>

                {#if value && value.start}
                  <Button
                    variant="outline"
                    size="sm"
                    class="h-9"
                    onclick={() => {
                      dateFilter = "custom";
                      // Support single-date selection by using start as both from/to.
                      if (value.start) {
                        const endDate = value.end || value.start;
                        fromDate = value.start.toString();
                        toDate = endDate.toString();
                        applyFilters();
                      }
                    }}
                  >
                    Áp dụng
                  </Button>
                {/if}
              </div>
            </div>

            <!-- Status Filter -->
            <div class="flex items-center gap-2">
              <Select.Root
                type="single"
                bind:value={statusFilter}
                onValueChange={() => applyFilters()}
              >
                <Select.Trigger class="w-[160px] h-9">
                  {selectedStatusLabel}
                </Select.Trigger>
                <Select.Content>
                  {#each statusOptions as option}
                    <Select.Item value={option.value} label={option.label}>
                      {option.label}
                    </Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
            </div>
          </div>

          <!-- Search Row -->
          <div class="flex items-center gap-4">
            <div class="relative flex-1 max-w-sm">
              <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm theo tên hoặc SĐT..."
                class="soft-input h-9 pl-9"
                bind:value={searchQuery}
                onkeydown={(e) => e.key === "Enter" && applyFilters()}
              />
            </div>
            <Button variant="outline" size="sm" onclick={() => applyFilters()}>
              <Filter class="h-4 w-4 mr-2" />
              Lọc
            </Button>
          </div>
        </div>

        <!-- Bookings Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="border-b border-gray-100 bg-muted/40">
              <tr>
                <th
                  class="h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap"
                  >Ngày đặt</th
                >
                <th
                  class="h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap"
                  >Giờ</th
                >
                <th
                  class="h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap"
                  >Mã</th
                >
                <th
                  class="h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap"
                  >Khách hàng</th
                >
                <th
                  class="h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap"
                  >Dịch vụ & Ghi chú</th
                >
                <th
                  class="h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap"
                  >Trạng thái</th
                >
                <th class="h-12 px-4 text-right align-middle font-medium text-muted-foreground"
                ></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              {#each groupedBookings as group, groupIndex}
                {#each group.bookings as booking, bookingIndex}
                  <tr
                    class={cn(
                      "hover:bg-muted/50 transition-colors",
                      bookingIndex === 0 && groupIndex > 0 ? "border-t border-gray-100" : "",
                    )}
                  >
                    <!-- Date (show only for first item in group) -->
                    <td class="p-4 align-top w-[140px]">
                      {#if bookingIndex === 0}
                        <div class="flex flex-col">
                          <span class="font-semibold text-foreground">
                            {formatShortDate(booking.date)}
                          </span>
                          <span class="text-xs text-muted-foreground">
                            {getDateLabel(booking.date)}
                            {#if group.bookings.length > 1}
                              <span
                                class="ml-1 inline-flex items-center justify-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium"
                              >
                                {group.bookings.length}
                              </span>
                            {/if}
                          </span>
                        </div>
                      {/if}
                    </td>

                    <!-- Time -->
                    <td class="p-4 align-top font-medium w-[100px]">
                      {formatTime(booking.date)}
                    </td>

                    <!-- Code -->
                    <td class="p-4 align-top w-[120px]">
                      <span class="font-mono text-xs font-medium bg-muted px-2 py-1 rounded">
                        {generateBookingCode(booking.id)}
                      </span>
                    </td>

                    <!-- Customer -->
                    <td class="p-4 align-top">
                      <div class="flex flex-col gap-1">
                        <div class="font-medium text-primary hover:underline cursor-pointer">
                          {booking.customer?.name || "N/A"}
                        </div>
                        <div class="flex items-center text-xs text-muted-foreground gap-1">
                          <span class="tabular-nums">{booking.customer?.phone || "N/A"}</span>
                        </div>
                      </div>
                    </td>

                    <!-- Service & Notes -->
                    <td class="p-4 align-top max-w-[300px]">
                      <div class="space-y-1">
                        <div class="font-medium">
                          {booking.bookingServices?.[0]?.service?.name || "N/A"}
                        </div>
                        {#if booking.notes}
                          <div class="text-xs text-muted-foreground italic flex items-start gap-1">
                            <span class="mt-0.5 opacity-70">Note:</span>
                            {booking.notes}
                          </div>
                        {/if}
                      </div>
                    </td>

                    <!-- Status -->
                    <td class="p-4 align-top">
                      {#if data.canUpdate}
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger>
                            {#snippet child({ props })}
                              <Button
                                {...props}
                                variant="outline"
                                class={cn(
                                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold h-auto",
                                  statusStyles[booking.status],
                                )}
                              >
                                {statusLabels[booking.status] || booking.status}
                                <ChevronRight class="h-3 w-3 rotate-90 opacity-50 ml-1" />
                              </Button>
                            {/snippet}
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Content>
                            {#each statusOptions.slice(1) as option}
                              <DropdownMenu.Item
                                onclick={() => handleStatusChange(booking.id, option.value)}
                              >
                                {#if booking.status === option.value}
                                  <Check class="mr-2 h-4 w-4" />
                                {:else}
                                  <span class="mr-6"></span>
                                {/if}
                                {option.label}
                              </DropdownMenu.Item>
                            {/each}
                          </DropdownMenu.Content>
                        </DropdownMenu.Root>
                      {:else}
                        <span
                          class={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                            statusStyles[booking.status],
                          )}
                        >
                          {statusLabels[booking.status] || booking.status}
                        </span>
                      {/if}
                    </td>

                    <!-- Actions -->
                    <td class="p-4 align-top text-right">
                      {#if data.canUpdate || data.canDelete}
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger>
                            {#snippet child({ props })}
                              <Button
                                {...props}
                                variant="ghost"
                                size="icon"
                                class="h-8 w-8 text-muted-foreground hover:text-foreground"
                              >
                                <MoreVertical class="h-4 w-4" />
                              </Button>
                            {/snippet}
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Content align="end">
                            {#if data.canUpdate}
                              <DropdownMenu.Item onclick={() => openEditDialog(booking)}>
                                <Pencil class="mr-2 h-4 w-4" />
                                Chỉnh sửa
                              </DropdownMenu.Item>
                            {/if}
                            {#if data.canDelete}
                              <DropdownMenu.Item
                                variant="destructive"
                                onclick={() => openDeleteDialog(booking)}
                              >
                                <Trash class="mr-2 h-4 w-4" />
                                Xóa
                              </DropdownMenu.Item>
                            {/if}
                          </DropdownMenu.Content>
                        </DropdownMenu.Root>
                      {/if}
                    </td>
                  </tr>
                {/each}
              {:else}
                <tr>
                  <td colspan="7" class="h-[400px] text-center">
                    <div
                      class="flex flex-col items-center justify-center gap-2 text-muted-foreground"
                    >
                      <div class="rounded-full bg-muted/50 p-4 mb-2">
                        <CalendarCheck class="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <h3 class="text-lg font-semibold">Chưa có lịch hẹn</h3>
                      <p class="text-sm max-w-sm mx-auto mb-4">
                        Hiện tại chưa có lịch hẹn nào. Hãy tạo lịch hẹn mới đ bắ đầu.
                      </p>
                      {#if data.canCreate}
                        <Button onclick={() => (isCreateOpen = true)}>
                          <Plus class="mr-2 h-4 w-4" />
                          Tạo lịch hẹn mới
                        </Button>
                      {/if}
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        {#if data.pagination && data.pagination.totalPages > 1}
          <div class="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
            <div class="text-sm text-muted-foreground">
              Hiển thị {(currentPage - 1) * pageSize + 1} đến {Math.min(
                currentPage * pageSize,
                data.pagination.total,
              )} / {data.pagination.total} lịch hẹn
            </div>
            <div class="flex items-center gap-2">
              <Select.Root
                type="single"
                value={pageSize.toString()}
                onValueChange={(v) => {
                  if (v) {
                    pageSize = parseInt(v);
                    currentPage = 1;
                    applyFilters();
                  }
                }}
              >
                <Select.Trigger class="h-8 w-[120px]">
                  {pageSize} / trang
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="10" label="10 / trang">10 / trang</Select.Item>
                  <Select.Item value="20" label="20 / trang">20 / trang</Select.Item>
                  <Select.Item value="50" label="50 / trang">50 / trang</Select.Item>
                </Select.Content>
              </Select.Root>
              <div class="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  class="h-8 w-8"
                  disabled={currentPage <= 1}
                  onclick={() => goToPage(currentPage - 1)}
                >
                  <ChevronLeft class="h-4 w-4" />
                </Button>
                {#each Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => i + 1) as pageNum}
                  <Button
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="icon"
                    class="h-8 w-8"
                    onclick={() => goToPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                {/each}
                <Button
                  variant="outline"
                  size="icon"
                  class="h-8 w-8"
                  disabled={currentPage >= data.pagination.totalPages}
                  onclick={() => goToPage(currentPage + 1)}
                >
                  <ChevronRight class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </Tabs.Content>

    <Tabs.Content value="calendar">
      <div class="panel-shell bg-card text-card-foreground p-4">
        <div class="rounded-xl border border-border bg-background">
          <div class="border-b border-border p-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="inline-flex rounded-lg border border-border bg-muted/30 p-1">
                <button
                  class={cn(
                    "h-8 rounded-md px-3 text-sm font-medium transition-colors",
                    testCalendarView === "day"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onclick={() => (testCalendarView = "day")}
                >
                  Ngày
                </button>
                <button
                  class={cn(
                    "h-8 rounded-md px-3 text-sm font-medium transition-colors",
                    testCalendarView === "week"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onclick={() => (testCalendarView = "week")}
                >
                  Tuần
                </button>
                <button
                  class={cn(
                    "h-8 rounded-md px-3 text-sm font-medium transition-colors",
                    testCalendarView === "month"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onclick={() => (testCalendarView = "month")}
                >
                  Tháng
                </button>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  class="h-9 w-9"
                  onclick={() => shiftTestCalendar(-1)}
                >
                  <ChevronLeft class="h-4 w-4" />
                </Button>

                {#if testCalendarView === "week"}
                  <Button variant="outline" class="h-9" onclick={() => shiftTestCalendar(-1)}>
                    Tuần trước
                  </Button>
                  <Button
                    variant="outline"
                    class="h-9"
                    onclick={() => (testCalendarDate = getDateOnly(new Date()))}
                  >
                    Tuần này
                  </Button>
                  <Button variant="outline" class="h-9" onclick={() => shiftTestCalendar(1)}>
                    Tuần sau
                  </Button>
                {:else if testCalendarView === "month"}
                  <Button variant="outline" class="h-9" onclick={() => shiftTestCalendar(-1)}>
                    Tháng trước
                  </Button>
                  <Button
                    variant="outline"
                    class="h-9"
                    onclick={() => (testCalendarDate = getDateOnly(new Date()))}
                  >
                    Tháng này
                  </Button>
                  <Button variant="outline" class="h-9" onclick={() => shiftTestCalendar(1)}>
                    Tháng sau
                  </Button>
                {:else}
                  <Button
                    variant="outline"
                    class="h-9"
                    onclick={() => (testCalendarDate = getDateOnly(new Date()))}
                  >
                    Hôm nay
                  </Button>
                {/if}

                <Button
                  variant="outline"
                  size="icon"
                  class="h-9 w-9"
                  onclick={() => shiftTestCalendar(1)}
                >
                  <ChevronRight class="h-4 w-4" />
                </Button>
                {#if testCalendarView === "month"}
                  <p class="ml-1 text-sm font-medium capitalize">
                    {formatMonthLabel(testCalendarDate)}
                  </p>
                {:else if testCalendarView === "week"}
                  <p class="ml-1 text-sm font-medium">{formatWeekRangeLabel(testCalendarDate)}</p>
                {:else}
                  <p class="ml-1 text-sm font-medium capitalize">
                    {formatCalendarDateHeader(testCalendarDate)}
                  </p>
                {/if}
              </div>
            </div>

            <div class="mt-3 flex flex-wrap items-center gap-2">
              <Select.Root type="single" bind:value={calendarServiceFilter}>
                <Select.Trigger class="h-9 w-[220px]">
                  {calendarServiceOptions.find((opt) => opt.value === calendarServiceFilter)
                    ?.label || "Tất cả dịch vụ"}
                </Select.Trigger>
                <Select.Content>
                  {#each calendarServiceOptions as option}
                    <Select.Item value={option.value} label={option.label}>
                      {option.label}
                    </Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>

              <Select.Root type="single" bind:value={calendarStaffFilter}>
                <Select.Trigger class="h-9 w-[220px]">
                  {calendarStaffOptions.find((opt) => opt.value === calendarStaffFilter)?.label ||
                    "Tất cả nhân viên"}
                </Select.Trigger>
                <Select.Content>
                  {#each calendarStaffOptions as option}
                    <Select.Item value={option.value} label={option.label}>
                      {option.label}
                    </Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
            </div>

            {#if testCalendarView === "day"}
              <div class="mt-4 flex gap-2 overflow-x-auto pb-1">
                {#each testCalendarDayStripDays as day}
                  <button
                    class={cn(
                      "min-w-[72px] rounded-lg border px-3 py-2 text-center transition-colors",
                      isSameDay(day, testCalendarDate)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-muted",
                    )}
                    onclick={() => (testCalendarDate = day)}
                  >
                    <p class="text-[11px] uppercase tracking-wide opacity-80">
                      {formatCalendarWeekday(day)}
                    </p>
                    <p class="text-base font-semibold">{day.getDate()}</p>
                  </button>
                {/each}
              </div>
            {/if}
          </div>

          {#if testCalendarView === "day"}
            {#if testCalendarDayBookings.length === 0}
              <div class="p-8 text-center">
                <div
                  class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted"
                >
                  <Calendar class="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 class="font-semibold">Không có lịch hẹn</h3>
                <p class="mt-1 text-sm text-muted-foreground">
                  Thử chọn ngày khác hoặc đổi bộ lọc để xem thêm lịch hẹn.
                </p>
              </div>
            {:else}
              <div class="overflow-auto p-4">
                <div
                  class="relative min-w-[640px] overflow-hidden rounded-xl border border-border bg-card"
                  style={`height: ${testCalendarTimelineHeight}px`}
                  role="application"
                  aria-label="Lưới kéo thả lịch hẹn theo ngày"
                  ondragover={(event) => event.preventDefault()}
                  ondrop={handleDropOnDayTimeline}
                >
                  {#each Array.from({ length: TEST_CALENDAR_END_HOUR - TEST_CALENDAR_START_HOUR + 1 }, (_, i) => i) as hourIndex}
                    {@const hour = TEST_CALENDAR_START_HOUR + hourIndex}
                    <div
                      class="absolute inset-x-0"
                      style={`top: ${hourIndex * TEST_CALENDAR_HOUR_HEIGHT}px`}
                    >
                      <div class="grid grid-cols-[68px_1fr]">
                        <div class="pr-2 pt-1 text-right text-[11px] text-muted-foreground">
                          {formatHourLabel(hour)}
                        </div>
                        <div class="mt-2 border-t border-border"></div>
                      </div>
                    </div>
                  {/each}

                  {#each testCalendarDayBookings as booking}
                    {@const dayLayout = dayCalendarLayout[booking.id] || {
                      leftPct: 0,
                      widthPct: 100,
                      zIndex: 1,
                    }}
                    <button
                      class={cn(
                        "absolute rounded-lg border px-3 py-2 text-left shadow-sm transition-colors hover:brightness-95",
                        isPastBooking(booking.date) ? "opacity-75 saturate-75" : "",
                        statusStyles[booking.status] || "border-border bg-muted text-foreground",
                      )}
                      style={`top: ${getTestCalendarTop(booking.date)}px; left: calc(72px + (100% - 84px) * ${dayLayout.leftPct / 100} + 2px); width: calc((100% - 84px) * ${dayLayout.widthPct / 100} - 4px); min-height: ${TEST_CALENDAR_EVENT_HEIGHT}px; z-index: ${dayLayout.zIndex};`}
                      draggable={data.canUpdate}
                      ondragstart={(event) => handleBookingDragStart(event, booking)}
                      onclick={() => data.canUpdate && openEditDialog(booking)}
                    >
                      <div class="flex items-start justify-between gap-2">
                        <div class="min-w-0">
                          <p class="truncate text-sm font-semibold">
                            {booking.customer?.name || "Khách vãng lai"}
                          </p>
                          <p class="text-xs opacity-80">
                            {formatTime(booking.date)} • {generateBookingCode(booking.id)}
                          </p>
                        </div>
                        <span
                          class="shrink-0 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold"
                        >
                          {#if isPastBooking(booking.date)}Đã qua •
                          {/if}{statusLabels[booking.status] || booking.status}
                        </span>
                      </div>
                      <p class="mt-1 truncate text-xs opacity-90">
                        {booking.bookingServices?.[0]?.service?.name || "Chưa chọn dịch vụ"}
                      </p>
                    </button>
                  {/each}
                </div>
              </div>
            {/if}
          {:else if testCalendarView === "week"}
            <div class="overflow-auto p-4">
              <div class="min-w-[980px] overflow-hidden rounded-xl border border-border bg-card">
                <div
                  class="grid grid-cols-[68px_repeat(7,minmax(130px,1fr))] border-b border-border bg-muted/30"
                >
                  <div class="h-12 border-r border-border"></div>
                  {#each testCalendarWeekDays as day}
                    <button
                      class={cn(
                        "h-12 border-r border-border px-2 text-center last:border-r-0",
                        isSameDay(day, testCalendarDate) ? "bg-primary/10" : "",
                      )}
                      onclick={() => {
                        testCalendarDate = day;
                        testCalendarView = "day";
                      }}
                    >
                      <p class="text-[11px] uppercase tracking-wide text-muted-foreground">
                        {formatCalendarWeekday(day)}
                      </p>
                      <p class="text-sm font-semibold">{day.getDate()}</p>
                    </button>
                  {/each}
                </div>

                <div
                  class="grid grid-cols-[68px_1fr]"
                  style={`height: ${testCalendarTimelineHeight}px`}
                >
                  <div class="relative border-r border-border">
                    {#each Array.from({ length: TEST_CALENDAR_END_HOUR - TEST_CALENDAR_START_HOUR + 1 }, (_, i) => i) as hourIndex}
                      {@const hour = TEST_CALENDAR_START_HOUR + hourIndex}
                      <div
                        class="absolute inset-x-0"
                        style={`top: ${hourIndex * TEST_CALENDAR_HOUR_HEIGHT}px`}
                      >
                        <div class="pr-2 pt-1 text-right text-[11px] text-muted-foreground">
                          {formatHourLabel(hour)}
                        </div>
                      </div>
                    {/each}
                  </div>

                  <div class="grid grid-cols-7">
                    {#each testCalendarWeekDays as day}
                      {@const dayKey = toDateKey(day)}
                      {@const dayBookings = bookingsByDate[dayKey] || []}
                      <div
                        class="relative border-r border-border last:border-r-0"
                        role="application"
                        aria-label={`Cột lịch hẹn ${formatCalendarWeekday(day)} ${day.getDate()}`}
                        ondragover={(event) => event.preventDefault()}
                        ondrop={(event) => handleDropOnWeekColumn(event, day)}
                      >
                        {#each Array.from({ length: TEST_CALENDAR_END_HOUR - TEST_CALENDAR_START_HOUR + 1 }, (_, i) => i) as hourIndex}
                          <div
                            class="absolute inset-x-0 border-t border-border"
                            style={`top: ${hourIndex * TEST_CALENDAR_HOUR_HEIGHT + 8}px`}
                          ></div>
                        {/each}

                        {#each dayBookings as booking}
                          {@const weekLayout = (weekCalendarLayouts[dayKey] &&
                            weekCalendarLayouts[dayKey][booking.id]) || {
                            leftPct: 0,
                            widthPct: 100,
                            zIndex: 1,
                          }}
                          <button
                            class={cn(
                              "absolute rounded-md border px-2 py-1 text-left shadow-sm transition-colors hover:brightness-95",
                              isPastBooking(booking.date) ? "opacity-70 saturate-75" : "",
                              statusStyles[booking.status] ||
                                "border-border bg-muted text-foreground",
                            )}
                            style={`top: ${getTestCalendarTop(booking.date)}px; left: calc(${weekLayout.leftPct}% + 2px); width: calc(${weekLayout.widthPct}% - 4px); min-height: ${TEST_CALENDAR_WEEK_EVENT_HEIGHT}px; z-index: ${weekLayout.zIndex};`}
                            draggable={data.canUpdate}
                            ondragstart={(event) => handleBookingDragStart(event, booking)}
                            onclick={() => data.canUpdate && openEditDialog(booking)}
                          >
                            <p class="truncate text-xs font-semibold">
                              {booking.customer?.name || "Khách vãng lai"}
                            </p>
                            <p class="text-[11px] opacity-80">{formatTime(booking.date)}</p>
                          </button>
                        {/each}
                      </div>
                    {/each}
                  </div>
                </div>
              </div>
            </div>
          {:else}
            <div class="p-4">
              <div class="overflow-auto rounded-xl border border-border">
                <div class="grid min-w-[860px] grid-cols-7 border-b border-border bg-muted/30">
                  {#each ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as weekday}
                    <div
                      class="border-r border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground last:border-r-0"
                    >
                      {weekday}
                    </div>
                  {/each}
                </div>

                <div class="grid min-w-[860px] grid-cols-7">
                  {#each testCalendarMonthDays as day}
                    {@const dayKey = toDateKey(day)}
                    {@const dayBookings = bookingsByDate[dayKey] || []}
                    <button
                      class={cn(
                        "min-h-[130px] border-b border-r border-border p-2 text-left align-top transition-colors hover:bg-muted/40",
                        !isSameMonth(day, testCalendarDate)
                          ? "bg-muted/20 text-muted-foreground"
                          : "bg-background",
                        isSameDay(day, testCalendarDate) ? "ring-1 ring-inset ring-primary" : "",
                      )}
                      ondragover={(event) => event.preventDefault()}
                      ondrop={(event) => handleDropOnMonthDay(event, day)}
                      onclick={() => {
                        testCalendarDate = day;
                        testCalendarView = "day";
                      }}
                    >
                      <div class="mb-2 flex items-center justify-between">
                        <span
                          class={cn(
                            "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                            isSameDay(day, getDateOnly(new Date()))
                              ? "bg-primary text-primary-foreground"
                              : "bg-transparent",
                          )}
                        >
                          {day.getDate()}
                        </span>
                        {#if dayBookings.length > 0}
                          <span class="text-[11px] text-muted-foreground"
                            >{dayBookings.length} lịch</span
                          >
                        {/if}
                      </div>

                      <div class="space-y-1">
                        {#each dayBookings.slice(0, 2) as booking}
                          <div
                            class={cn(
                              "rounded border border-border bg-card px-2 py-1",
                              isPastBooking(booking.date) ? "opacity-70" : "",
                            )}
                            role="button"
                            tabindex="-1"
                            aria-label={`Kéo lịch hẹn ${booking.customer?.name || "Khách vãng lai"} lúc ${formatTime(booking.date)}`}
                            draggable={data.canUpdate}
                            ondragstart={(event) => handleBookingDragStart(event, booking)}
                          >
                            <p class="truncate text-[11px] font-semibold">
                              {formatTime(booking.date)}
                            </p>
                            <p class="truncate text-[11px] text-muted-foreground">
                              {booking.customer?.name || "Khách vãng lai"}
                            </p>
                          </div>
                        {/each}
                        {#if dayBookings.length > 2}
                          <p class="text-[11px] text-muted-foreground">
                            +{dayBookings.length - 2} lịch khác
                          </p>
                        {/if}
                      </div>
                    </button>
                  {/each}
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </Tabs.Content>
  </Tabs.Root>
</div>

<!-- Create Booking Dialog -->
<Dialog.Root bind:open={isCreateOpen}>
  <Dialog.Content class="sm:max-w-6xl max-h-[92vh] !p-0 !gap-0 overflow-hidden flex flex-col">
    <Dialog.Header class="border-b border-border bg-muted/30 p-6 pb-4">
      <Dialog.Title class="text-lg font-semibold">
        {editingBookingId ? "Chỉnh sửa lịch hẹn" : "Tạo lịch hẹn mới"}
      </Dialog.Title>
      <Dialog.Description class="mt-1 text-sm text-muted-foreground">
        Chọn khách hàng, thời gian và dịch vụ. Thông tin tổng quan được cập nhật trực tiếp khi bạn
        thay đổi biểu mẫu.
      </Dialog.Description>
    </Dialog.Header>
    <form
      action={editingBookingId ? "?/update" : "?/create"}
      method="POST"
      class="flex min-h-0 flex-1 flex-col"
      use:enhance={handleFormResult}
    >
      {#if editingBookingId}
        <input type="hidden" name="id" value={editingBookingId} />
      {/if}
      <input type="hidden" name="guests" value={JSON.stringify(newBooking.guests)} />
      <input type="hidden" name="customerId" bind:value={newBooking.customerId} />
      <input type="hidden" name="customerPhone" bind:value={newBooking.customerPhone} />
      <input type="hidden" name="date" bind:value={newBooking.date} />
      <div class="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div class="min-h-0 overflow-y-auto border-r border-border bg-muted/20 p-5">
          <div class="space-y-4">
            <section class="rounded-xl border border-border bg-background p-4">
              <div class="mb-3 flex items-center justify-between">
                <h3 class="text-sm font-semibold">1. Khách hàng</h3>
                {#if newBooking.customerId}
                  <Button
                    type="button"
                    variant="link"
                    class="h-auto p-0 text-xs text-red-500 hover:text-red-600"
                    onclick={() => {
                      newBooking.customerId = "";
                      newBooking.customerPhone = "";
                      customerSearchQuery = "";
                    }}
                  >
                    Bỏ chọn
                  </Button>
                {/if}
              </div>
              <div class="flex gap-2">
                <Combobox
                  items={customerItems}
                  bind:value={newBooking.customerId}
                  placeholder="Tìm khách hàng..."
                  searchPlaceholder="Tìm theo tên hoặc SĐT..."
                  emptyText="Không tìm thấy khách hàng."
                  class="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Thêm khách hàng mới"
                  onclick={() => (isQuickCreateOpen = true)}
                >
                  <Plus class="h-4 w-4" />
                </Button>
              </div>
            </section>

            <section class="rounded-xl border border-border bg-background p-4 space-y-3">
              <h3 class="text-sm font-semibold">2. Thông tin lịch hẹn</h3>
              <div class="space-y-1">
                <Label for="bookingDateTime" class="text-xs text-muted-foreground">Thời gian</Label>
                <DateTimePicker bind:value={newBooking.date} />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <Label for="guestCount" class="text-xs text-muted-foreground">Số khách</Label>
                  <Input
                    type="number"
                    id="guestCount"
                    min="1"
                    name="guestCount"
                    bind:value={newBooking.guestCount}
                  />
                </div>
                <div class="space-y-1">
                  <Label for="status" class="text-xs text-muted-foreground">Trạng thái</Label>
                  <Select.Root type="single" bind:value={newBooking.status} name="status">
                    <Select.Trigger class="w-full">
                      {#snippet children()}
                        {statusLabels[newBooking.status] || "Chọn trạng thái"}
                      {/snippet}
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="confirmed" label="Đã xác nhận">Đã xác nhận</Select.Item>
                      <Select.Item value="pending" label="Chờ xác nhận">Chờ xác nhận</Select.Item>
                      <Select.Item value="checkin" label="Đã check-in">Đã check-in</Select.Item>
                      <Select.Item value="completed" label="Hoàn thành">Hoàn thành</Select.Item>
                      <Select.Item value="cancelled" label="Đã hủy">Đã hủy</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </div>
              </div>
              <div class="space-y-1">
                <Label for="notes" class="text-xs text-muted-foreground">Ghi chú</Label>
                <textarea
                  id="notes"
                  name="notes"
                  placeholder="Nhập ghi chú cho lịch hẹn này..."
                  rows="3"
                  class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  bind:value={newBooking.notes}
                ></textarea>
              </div>
            </section>

            <section class="rounded-xl border border-border bg-background p-4">
              <h3 class="mb-3 text-sm font-semibold">Tổng quan</h3>
              <div class="grid grid-cols-[110px_1fr] gap-y-2 text-sm">
                <span class="text-muted-foreground">Khách hàng</span>
                <span class="font-medium">{selectedCustomer?.name || "Chưa chọn"}</span>

                <span class="text-muted-foreground">SĐT</span>
                <span>{selectedCustomer?.phone || newBooking.customerPhone || "-"}</span>

                <span class="text-muted-foreground">Thời gian</span>
                <span
                  >{newBooking.date
                    ? `${formatDate(newBooking.date)} ${formatTime(newBooking.date)}`
                    : "-"}</span
                >

                <span class="text-muted-foreground">Số khách</span>
                <span>{newBooking.guestCount || "1"}</span>

                <span class="text-muted-foreground">Dịch vụ đã chọn</span>
                <span>{totalGuestServices}</span>
              </div>
              {#if !canSubmitBooking}
                <p class="mt-3 text-xs text-amber-600">
                  Cần chọn khách hàng, thời gian và ít nhất một dịch vụ để lưu.
                </p>
              {/if}
            </section>
          </div>
        </div>

        <div class="min-h-0 overflow-y-auto bg-background p-5">
          <div class="mb-4 flex items-center justify-between">
            <div>
              <h3 class="text-sm font-semibold">3. Dịch vụ theo từng khách</h3>
              <p class="text-xs text-muted-foreground">
                Chọn nhóm, dịch vụ và nhân viên thực hiện.
              </p>
            </div>
            <span class="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              {totalGuestServices} dịch vụ đã chọn
            </span>
          </div>

          {#each newBooking.guests as guest, guestIndex}
            <section class="mb-4 rounded-xl border border-border bg-muted/20 p-4 last:mb-0">
              <div class="mb-3 flex items-center justify-between">
                <h4 class="text-sm font-semibold">Khách #{guestIndex + 1}</h4>
                <span class="text-xs text-muted-foreground"
                  >{guest.services.length} dòng dịch vụ</span
                >
              </div>

              {#each guest.services as service, serviceIndex}
                <div
                  class="mb-2 grid grid-cols-1 gap-2 rounded-lg border border-border bg-background p-3 xl:grid-cols-[26px_160px_minmax(0,1fr)_170px_auto]"
                >
                  <div
                    class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                  >
                    {serviceIndex + 1}
                  </div>

                  <Combobox
                    items={(data.serviceCategories || []).map(
                      (c: { id: number; name: string }) => ({
                        value: c.id.toString(),
                        label: c.name,
                      }),
                    )}
                    bind:value={service.categoryId}
                    placeholder="Nhóm dịch vụ"
                    searchPlaceholder="Tìm nhóm dịch vụ..."
                    emptyText="Không tìm thấy nhóm dịch vụ."
                    onchange={() => {
                      service.serviceId = "";
                    }}
                  />

                  <Combobox
                    class="w-full"
                    placeholder={service.categoryId ? "Chọn dịch vụ" : "Chọn nhóm trước"}
                    searchPlaceholder="Tìm dịch vụ..."
                    emptyText="Không tìm thấy dịch vụ."
                    disabled={!service.categoryId}
                    items={(data.services || [])
                      .filter(
                        (s: any) =>
                          service.categoryId && s.categoryId === parseInt(service.categoryId),
                      )
                      .map((s: any) => ({
                        value: s.id.toString(),
                        label: s.name,
                      }))}
                    bind:value={service.serviceId}
                  />

                  <Combobox
                    items={(data.members || []).map(
                      (m: { id: string; user?: { name: string }; name?: string }) => ({
                        value: m.id,
                        label: m.user?.name || m.name || "",
                      }),
                    )}
                    bind:value={service.memberId}
                    placeholder="Nhân viên phụ trách"
                    searchPlaceholder="Tìm nhân viên..."
                    emptyText="Không tìm thấy nhân viên."
                  />

                  {#if guest.services.length > 1}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      class="h-9 w-9 shrink-0 text-muted-foreground hover:text-red-600"
                      title="Xóa dòng dịch vụ"
                      onclick={() => {
                        guest.services = guest.services.filter((_, i) => i !== serviceIndex);
                      }}
                    >
                      <Trash class="h-4 w-4" />
                    </Button>
                  {:else}
                    <div></div>
                  {/if}
                </div>
              {/each}

              <Button
                type="button"
                variant="outline"
                size="sm"
                class="mt-2"
                onclick={() => {
                  guest.services = [
                    ...guest.services,
                    {
                      categoryId: "",
                      serviceId: "",
                      memberId: "",
                    },
                  ];
                }}
              >
                + Thêm dịch vụ
              </Button>
            </section>
          {/each}
        </div>
      </div>

      <div
        class="shrink-0 flex items-center justify-between gap-3 border-t border-border bg-background/95 p-4 backdrop-blur"
      >
        <p class="text-xs text-muted-foreground">
          {editingBookingId ? "Cập nhật thay đổi lịch hẹn" : "Tạo mới lịch hẹn"} • {totalGuestServices}
          dịch vụ đã chọn
        </p>
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            type="button"
            class="min-w-[100px]"
            onclick={() => (isCreateOpen = false)}
          >
            Hủy
          </Button>
          <Button type="submit" class="min-w-[140px]" disabled={!canSubmitBooking}>
            {editingBookingId ? "Lưu thay đổi" : "Tạo lịch hẹn"}
          </Button>
        </div>
      </div>
    </form>
  </Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation Dialog -->
<AlertDialog.Root bind:open={isDeleteOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Xác nhận xóa lịch hẹn?</AlertDialog.Title>
      <AlertDialog.Description>
        Bạn có chắc chắn muốn xóa lịch hẹn này? Hành động này không thể hoàn tác.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <form action="?/delete" method="POST" use:enhance={handleFormResult}>
      <input type="hidden" name="id" value={deletingBooking?.id} />
      <AlertDialog.Footer>
        <AlertDialog.Cancel onclick={() => (isDeleteOpen = false)}>Hủy</AlertDialog.Cancel>
        <Button type="submit" variant="destructive">Xóa</Button>
      </AlertDialog.Footer>
    </form>
  </AlertDialog.Content>
</AlertDialog.Root>

<!-- Quick Create Customer Dialog -->
<Dialog.Root bind:open={isQuickCreateOpen}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>Thêm nhanh khách hàng</Dialog.Title>
      <Dialog.Description>Tạo khách hàng mới chỉ với tên và số điện thoại.</Dialog.Description>
    </Dialog.Header>
    <form
      action="?/createCustomer"
      method="POST"
      novalidate
      use:enhance={({ formData, cancel }) => {
        const name = formData.get("name")?.toString().trim();
        const phone = formData.get("phone")?.toString().trim();
        quickNameError = "";
        quickPhoneError = "";
        let hasError = false;
        if (!name) {
          quickNameError = "Vui lòng nhập tên khách hàng";
          hasError = true;
        }
        if (!phone) {
          quickPhoneError = "Vui lòng nhập số điện thoại";
          hasError = true;
        }
        if (hasError) {
          cancel();
          return;
        }
        return async ({ result }) => {
          if (result.type === "success") {
            const newCustomer = result.data?.customer as {
              id: number;
              phone: string;
              name: string;
            };
            if (newCustomer) {
              await invalidateAll();
              newBooking.customerId = newCustomer.id.toString();
              newBooking.customerPhone = newCustomer.phone;
              isQuickCreateOpen = false;
              toast.success("Đã thêm khách hàng mới");
            }
          } else if (result.type === "failure") {
            toast.error((result.data as { message?: string })?.message || "Có lỗi xảy ra");
          }
        };
      }}
      class="space-y-4 py-4"
    >
      <div class="space-y-2">
        <Label for="quickName">Tên khách hàng</Label>
        <Input
          id="quickName"
          name="name"
          placeholder="Nhập tên khách hàng"
          oninput={() => (quickNameError = "")}
        />
        {#if quickNameError}
          <span class="text-red-500 text-xs">{quickNameError}</span>
        {/if}
      </div>
      <div class="space-y-2">
        <Label for="quickPhone">Số điện thoại</Label>
        <Input
          id="quickPhone"
          name="phone"
          placeholder="Nhập số điện thoại"
          value={customerSearchQuery}
          oninput={() => (quickPhoneError = "")}
        />
        {#if quickPhoneError}
          <span class="text-red-500 text-xs">{quickPhoneError}</span>
        {/if}
      </div>
      <Dialog.Footer>
        <Button variant="outline" type="button" onclick={() => (isQuickCreateOpen = false)}
          >Hủy</Button
        >
        <Button type="submit">Lưu khách hàng</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
