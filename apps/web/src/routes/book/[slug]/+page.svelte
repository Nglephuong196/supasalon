<script lang="ts">
import { onMount } from "svelte";
import { Button } from "$lib/components/ui/button";
import Calendar from "$lib/components/ui/calendar/calendar.svelte";
import { Card, CardContent } from "$lib/components/ui/card";
import { Input } from "$lib/components/ui/input";
import { Label } from "$lib/components/ui/label";
import * as Popover from "$lib/components/ui/popover";
import * as Select from "$lib/components/ui/select";
import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
import { getLocalTimeZone, parseDate, today, type CalendarDate } from "@internationalized/date";
import { Clock3, Globe, CircleCheck, Sparkles, Plus, Trash2, Users } from "@lucide/svelte";
import type { ActionData, PageData } from "./$types";

type Locale = "vi" | "en";
type ServiceLine = { serviceId: string; memberId: string };
type GuestForm = { services: ServiceLine[] };

const copy = {
  vi: {
    pageTitle: "Đặt lịch",
    heroTitle: "Đặt lịch hẹn",
    requiredHint: "(*) Vui lòng nhập đầy đủ thông tin bắt buộc",
    stepCustomer: "1. Khách hàng liên hệ",
    stepSchedule: "2. Thời gian",
    stepService: "3. Dịch vụ theo từng khách",
    customerPhone: "Số điện thoại",
    customerName: "Họ và tên",
    customerCount: "Số khách",
    dateLabel: "Chọn ngày",
    timeLabel: "Chọn giờ",
    serviceLabel: "Dịch vụ",
    chooseService: "Vui lòng chọn ít nhất 1 dịch vụ cho mỗi khách.",
    staffLabel: "Nhân viên phụ trách",
    staffAuto: "Để salon sắp xếp",
    notesLabel: "Ghi chú",
    notesPh: "Ví dụ: muốn làm nhanh trước 18:00",
    submit: "Gửi yêu cầu đặt lịch",
    noService: "Salon chưa mở dịch vụ đặt lịch online.",
    success: "Đặt lịch thành công. Salon sẽ liên hệ xác nhận sớm.",
    defaultError: "Vui lòng kiểm tra lại thông tin.",
    mins: "phút",
    contactLine: "Liên hệ đặt lịch nhanh và dễ dàng",
    topTag: "Đặt lịch online",
    addService: "Thêm dịch vụ",
    removeService: "Xóa dịch vụ",
    serviceRow: "Dịch vụ",
    guestLabel: "Khách",
    invalidDateTime: "Vui lòng chọn ngày và giờ hẹn.",
    invalidGuests: "Mỗi khách cần chọn ít nhất 1 dịch vụ.",
    bookingPage: "TRANG ĐẶT LỊCH",
    selectedSummary: "Tổng dịch vụ đã chọn",
  },
  en: {
    pageTitle: "Book Appointment",
    heroTitle: "Book Appointment",
    requiredHint: "(*) Please fill all required fields",
    stepCustomer: "1. Contact",
    stepSchedule: "2. Time",
    stepService: "3. Services per customer",
    customerPhone: "Phone Number",
    customerName: "Full Name",
    customerCount: "Number of customers",
    dateLabel: "Select date",
    timeLabel: "Select time",
    serviceLabel: "Service",
    chooseService: "Please select at least one service per customer.",
    staffLabel: "Preferred staff",
    staffAuto: "Let salon assign",
    notesLabel: "Notes",
    notesPh: "Example: please finish before 6:00 PM",
    submit: "Submit Booking Request",
    noService: "This salon has not enabled online services yet.",
    success: "Booking submitted successfully. The salon will contact you soon.",
    defaultError: "Please review your information.",
    mins: "mins",
    contactLine: "Fast and easy appointment booking",
    topTag: "Online booking",
    addService: "Add service",
    removeService: "Remove service",
    serviceRow: "Service",
    guestLabel: "Customer",
    invalidDateTime: "Please select date and time.",
    invalidGuests: "Each customer needs at least one service.",
    bookingPage: "BOOKING PAGE",
    selectedSummary: "Total selected services",
  },
} as const;

let { data, form }: { data: PageData; form: ActionData } = $props();

let locale = $state<Locale>("vi");

let customerName = $state("");
let customerPhone = $state("");
let notes = $state("");
let guestCount = $state("1");

let bookingDate = $state("");
let bookingTime = $state("");
let bookingDateOpen = $state(false);
let bookingDateValue = $state<CalendarDate | undefined>(undefined);

let guests = $state<GuestForm[]>([{ services: [{ serviceId: "", memberId: "" }] }]);
let clientError = $state("");

const timeSlots = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
];

const t = $derived(copy[locale]);
const dateTimeValue = $derived(bookingDate && bookingTime ? `${bookingDate}T${bookingTime}` : "");
const bookingDateDisplay = $derived(
  bookingDateValue
    ? bookingDateValue
        .toDate(getLocalTimeZone())
        .toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US")
    : t.dateLabel,
);

const selectedServiceCount = $derived(
  guests.reduce(
    (sum, guest) => sum + guest.services.filter((service) => service.serviceId).length,
    0,
  ),
);

const serializedGuests = $derived(
  JSON.stringify(
    guests.map((guest) => ({
      services: guest.services
        .filter((service) => service.serviceId)
        .map((service) => ({
          serviceId: Number(service.serviceId),
          memberId: service.memberId || undefined,
        })),
    })),
  ),
);

function getIsoDate(offsetDays = 0) {
  const now = new Date();
  now.setDate(now.getDate() + offsetDays);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatPrice(price: number) {
  return (
    new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US").format(price) +
    (locale === "vi" ? "đ" : " VND")
  );
}

function getServiceDisplay(serviceId: string): string {
  if (!serviceId) return t.serviceLabel;
  const selected = data.services.find((service) => service.id.toString() === serviceId);
  if (!selected) return t.serviceLabel;
  return `${selected.name} • ${formatPrice(selected.price)} • ${selected.duration} ${t.mins}`;
}

function getStaffDisplay(memberId: string): string {
  if (!memberId) return t.staffAuto;
  return data.staffs.find((staff) => staff.id === memberId)?.name || t.staffAuto;
}

function syncGuestCount() {
  const parsed = Number(guestCount);
  const normalized = Number.isFinite(parsed) ? Math.max(1, Math.min(10, parsed)) : 1;
  guestCount = String(normalized);

  while (guests.length < normalized) {
    guests = [...guests, { services: [{ serviceId: "", memberId: "" }] }];
  }

  if (guests.length > normalized) {
    guests = guests.slice(0, normalized);
  }
}

function addServiceRow(guestIndex: number) {
  guests[guestIndex].services = [...guests[guestIndex].services, { serviceId: "", memberId: "" }];
  guests = [...guests];
}

function removeServiceRow(guestIndex: number, serviceIndex: number) {
  if (guests[guestIndex].services.length <= 1) return;
  guests[guestIndex].services = guests[guestIndex].services.filter(
    (_, index) => index !== serviceIndex,
  );
  guests = [...guests];
}

onMount(() => {
  const saved = localStorage.getItem("public-booking-lang");
  if (saved === "vi" || saved === "en") locale = saved;
  else locale = navigator.language.toLowerCase().startsWith("vi") ? "vi" : "en";

  if (!bookingDate) {
    bookingDate = getIsoDate(0);
  }
});

function switchLocale(next: Locale) {
  locale = next;
  localStorage.setItem("public-booking-lang", next);
}

$effect(() => {
  syncGuestCount();
});

$effect(() => {
  if (!bookingDate) {
    bookingDateValue = undefined;
    return;
  }

  try {
    const parsed = parseDate(bookingDate);
    if (
      bookingDateValue?.year !== parsed.year ||
      bookingDateValue?.month !== parsed.month ||
      bookingDateValue?.day !== parsed.day
    ) {
      bookingDateValue = parsed;
    }
  } catch {
    bookingDateValue = undefined;
  }
});

$effect(() => {
  if (!bookingDateValue) return;
  const y = bookingDateValue.year;
  const m = bookingDateValue.month.toString().padStart(2, "0");
  const d = bookingDateValue.day.toString().padStart(2, "0");
  const nextValue = `${y}-${m}-${d}`;
  if (bookingDate !== nextValue) {
    bookingDate = nextValue;
  }
});

$effect(() => {
  const values = form?.values;
  if (!values) return;
  customerName = values.customerName || "";
  customerPhone = values.customerPhone || "";
  notes = values.notes || "";
  guestCount = values.guestCount || "1";

  const rawDateTime = values.dateTime || "";
  if (rawDateTime && rawDateTime.includes("T")) {
    const [d, tm] = rawDateTime.split("T");
    bookingDate = d || "";
    bookingTime = (tm || "").slice(0, 5);
  }

  if (values.guests) {
    try {
      const parsedGuests = JSON.parse(values.guests) as Array<{
        services: Array<{ serviceId: number | string; memberId?: string }>;
      }>;
      if (Array.isArray(parsedGuests) && parsedGuests.length > 0) {
        guests = parsedGuests.map((guest) => ({
          services:
            guest.services?.length > 0
              ? guest.services.map((service) => ({
                  serviceId: String(service.serviceId || ""),
                  memberId: service.memberId || "",
                }))
              : [{ serviceId: "", memberId: "" }],
        }));
      }
    } catch (_err) {
      // ignore invalid payload
    }
  }
});

function getErrorMessage() {
  if (!form?.message) return "";
  if (locale === "vi") return form.message;
  return t.defaultError;
}

function handleSubmit(event: SubmitEvent) {
  clientError = "";

  if (!bookingDate || !bookingTime) {
    event.preventDefault();
    clientError = t.invalidDateTime;
    return;
  }

  const invalidGuest = guests.some(
    (guest) => guest.services.filter((service) => service.serviceId).length === 0,
  );

  if (invalidGuest) {
    event.preventDefault();
    clientError = t.invalidGuests;
    return;
  }
}
</script>

<svelte:head>
  <title>{t.pageTitle} | {data.organization.name}</title>
</svelte:head>

<div class="booking-shell min-h-screen">
  <header class="scene-header">
    <div class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6">
      <div class="header-brand min-w-0">
        <p class="header-kicker">{t.bookingPage}</p>
        <p class="header-title truncate">{data.organization.name}</p>
        <p class="header-subtitle truncate">{t.contactLine}</p>
      </div>

      <div class="lang-switch" role="group" aria-label="Language switch">
        <button
          type="button"
          class={locale === "en" ? "lang-btn is-active" : "lang-btn"}
          onclick={() => switchLocale("en")}
        >
          <Globe class="h-3.5 w-3.5" /> ENG
        </button>
        <button
          type="button"
          class={locale === "vi" ? "lang-btn is-active" : "lang-btn"}
          onclick={() => switchLocale("vi")}
        >
          <Globe class="h-3.5 w-3.5" /> VIE
        </button>
      </div>
    </div>
  </header>

  <main class="scene-main">
    <section class="booking-panel">
      <div class="panel-head">
        <div
          class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-primary"
        >
          <Sparkles class="h-4 w-4" />
          <span class="text-xs font-semibold uppercase tracking-wide">{t.topTag}</span>
        </div>
        <div class="mt-2 flex flex-wrap items-end justify-between gap-2">
          <h1 class="text-2xl font-semibold tracking-tight text-slate-900">{t.heroTitle}</h1>
          <p class="text-xs text-slate-600">{t.requiredHint}</p>
        </div>
      </div>

      <Card class="booking-card">
        <CardContent class="space-y-4 p-4 sm:p-5">
          {#if form?.success}
            <div class="alert-success">
              <CircleCheck class="h-4 w-4" />
              {locale === "vi" ? form.message : t.success}
            </div>
          {/if}

          {#if getErrorMessage() || clientError}
            <div class="alert-error">{clientError || getErrorMessage()}</div>
          {/if}

          <form method="POST" action="?/create" class="space-y-4" onsubmit={handleSubmit}>
            <fieldset class="group-block">
              <legend>{t.stepCustomer}</legend>
              <div class="grid gap-4 sm:grid-cols-2">
                <div class="grid gap-2">
                  <Label for="customerPhone">{t.customerPhone} *</Label>
                  <Input
                    id="customerPhone"
                    name="customerPhone"
                    required
                    autocomplete="tel"
                    inputmode="tel"
                    placeholder={locale === "vi" ? "Nhập số điện thoại" : "Enter phone number"}
                    bind:value={customerPhone}
                  />
                </div>
                <div class="grid gap-2">
                  <Label for="customerName">{t.customerName} *</Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    required
                    autocomplete="name"
                    placeholder={locale === "vi" ? "Nhập họ tên" : "Enter full name"}
                    bind:value={customerName}
                  />
                </div>
                <div class="grid gap-2 sm:col-span-2">
                  <Label for="guestCount">{t.customerCount}</Label>
                  <Input
                    id="guestCount"
                    name="guestCountInput"
                    type="number"
                    min="1"
                    max="10"
                    bind:value={guestCount}
                    onchange={syncGuestCount}
                  />
                </div>
              </div>
            </fieldset>

            <fieldset class="group-block">
              <legend>{t.stepSchedule}</legend>
              <div class="grid gap-4">
                <div class="grid gap-2">
                  <Label for="bookingDate">{t.dateLabel} *</Label>
                  <Popover.Root bind:open={bookingDateOpen}>
                    <Popover.Trigger id="bookingDate">
                      {#snippet child({ props })}
                        <Button
                          {...props}
                          type="button"
                          variant="outline"
                          class="h-11 w-full justify-between rounded-lg border border-input bg-background px-3 text-sm font-normal"
                        >
                          {bookingDateDisplay}
                          <ChevronDownIcon class="h-4 w-4 opacity-70" />
                        </Button>
                      {/snippet}
                    </Popover.Trigger>
                    <Popover.Content class="w-auto overflow-hidden rounded-lg p-0" align="start">
                      <Calendar
                        type="single"
                        bind:value={bookingDateValue}
                        locale={locale === "vi" ? "vi-VN" : "en-US"}
                        captionLayout="dropdown"
                        minValue={today(getLocalTimeZone())}
                        onValueChange={() => {
                          bookingDateOpen = false;
                        }}
                      />
                    </Popover.Content>
                  </Popover.Root>
                </div>

                <div class="grid gap-2">
                  <Label>{t.timeLabel} *</Label>
                  <div class="time-grid">
                    {#each timeSlots as slot}
                      <Button
                        type="button"
                        variant="outline"
                        class={bookingTime === slot ? "time-btn is-active" : "time-btn"}
                        onclick={() => {
                          bookingTime = slot;
                        }}
                      >
                        {slot}
                      </Button>
                    {/each}
                  </div>
                </div>
              </div>
            </fieldset>

            <fieldset class="group-block">
              <legend>{t.stepService}</legend>

              {#if data.services.length === 0}
                <div
                  class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700"
                >
                  {t.noService}
                </div>
              {:else}
                <div class="guests-wrap">
                  {#each guests as guest, guestIndex}
                    <div class="guest-block">
                      <div class="guest-block__head">
                        <p class="guest-label">
                          <Users class="h-4 w-4" />
                          {t.guestLabel} #{guestIndex + 1}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onclick={() => addServiceRow(guestIndex)}
                        >
                          <Plus class="h-3.5 w-3.5" />
                          {t.addService}
                        </Button>
                      </div>

                      <div class="grid gap-2">
                        {#each guest.services as serviceLine, serviceIndex}
                          <div class="service-row">
                            <div class="grid gap-1.5">
                              <Label>{t.serviceRow} #{serviceIndex + 1}</Label>
                              <Select.Root type="single" bind:value={serviceLine.serviceId}>
                                <Select.Trigger
                                  class="soft-input h-11 w-full rounded-lg border bg-background px-3 text-sm"
                                >
                                  {getServiceDisplay(serviceLine.serviceId)}
                                </Select.Trigger>
                                <Select.Content>
                                  {#each data.services as service}
                                    <Select.Item
                                      value={service.id.toString()}
                                      label={`${service.name} • ${formatPrice(service.price)} • ${service.duration} ${t.mins}`}
                                    >
                                      {service.name} • {formatPrice(service.price)} • {service.duration}
                                      {t.mins}
                                    </Select.Item>
                                  {/each}
                                </Select.Content>
                              </Select.Root>
                            </div>

                            <div class="grid gap-1.5">
                              <Label>{t.staffLabel}</Label>
                              <Select.Root type="single" bind:value={serviceLine.memberId}>
                                <Select.Trigger
                                  class="soft-input h-11 w-full rounded-lg border bg-background px-3 text-sm"
                                >
                                  {getStaffDisplay(serviceLine.memberId)}
                                </Select.Trigger>
                                <Select.Content>
                                  <Select.Item value="" label={t.staffAuto}
                                    >{t.staffAuto}</Select.Item
                                  >
                                  {#each data.staffs as staff}
                                    <Select.Item value={staff.id} label={staff.name}
                                      >{staff.name}</Select.Item
                                    >
                                  {/each}
                                </Select.Content>
                              </Select.Root>
                            </div>

                            <Button
                              type="button"
                              variant="destructive"
                              onclick={() => removeServiceRow(guestIndex, serviceIndex)}
                              disabled={guest.services.length <= 1}
                            >
                              <Trash2 class="h-4 w-4" />
                              <span>{t.removeService}</span>
                            </Button>
                          </div>
                        {/each}
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}

              <p class="text-xs text-primary/80">
                {t.selectedSummary}: <span class="font-semibold">{selectedServiceCount}</span>
              </p>

              <div class="grid gap-2">
                <Label for="notes">{t.notesLabel}</Label>
                <textarea
                  id="notes"
                  name="notes"
                  rows="3"
                  class="soft-input rounded-lg border bg-background px-3 py-2 text-sm"
                  placeholder={t.notesPh}
                  bind:value={notes}
                ></textarea>
              </div>
            </fieldset>

            <input type="hidden" name="dateTime" value={dateTimeValue} />
            <input type="hidden" name="guestCount" value={guestCount} />
            <input type="hidden" name="guests" value={serializedGuests} />

            <div class="sticky-submit">
              <Button
                type="submit"
                class="btn-gradient h-11 w-full"
                disabled={data.services.length === 0}
              >
                {t.submit}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  </main>
</div>

<style>
  .booking-shell {
    position: relative;
    isolation: isolate;
    min-height: 100vh;
    overflow: hidden;
    background: linear-gradient(180deg, hsl(260 42% 97%), hsl(258 34% 94%));
  }

  .booking-shell::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(900px 280px at 12% 8%, hsl(var(--primary) / 0.25), transparent 42%),
      radial-gradient(820px 260px at 88% 15%, hsl(220 90% 72% / 0.2), transparent 45%),
      radial-gradient(860px 300px at 82% 88%, hsl(var(--primary) / 0.15), transparent 43%),
      radial-gradient(760px 250px at 18% 84%, hsl(190 70% 70% / 0.14), transparent 40%),
      linear-gradient(125deg, hsl(258 48% 93%), hsl(245 46% 95%));
    z-index: -2;
  }

  .booking-shell::after {
    content: "";
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='420' height='420' viewBox='0 0 420 420'%3E%3Cg fill='none' stroke='%23ffffff' stroke-opacity='0.34'%3E%3Cpath d='M40 320c40-80 120-120 210-102 48 10 86 38 122 86'/%3E%3Cpath d='M18 248c56-44 132-54 198-26 66 28 114 84 166 170'/%3E%3Cpath d='M116 78c26 30 38 70 30 106-6 30-24 60-52 84'/%3E%3Cpath d='M286 48c22 26 34 60 30 90-4 32-22 62-50 86'/%3E%3C/g%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Ccircle cx='58' cy='84' r='2.2'/%3E%3Ccircle cx='212' cy='42' r='2'/%3E%3Ccircle cx='364' cy='116' r='2.5'/%3E%3Ccircle cx='332' cy='356' r='2.2'/%3E%3Ccircle cx='126' cy='332' r='2'/%3E%3C/g%3E%3C/svg%3E");
    background-size: 420px 420px;
    background-repeat: repeat;
    opacity: 0.55;
    z-index: -1;
  }

  .scene-header {
    position: relative;
    z-index: 10;
    background: linear-gradient(120deg, hsl(266 86% 44%), hsl(256 72% 42%));
    border-bottom: 1px solid hsl(0 0% 100% / 0.2);
    backdrop-filter: blur(8px);
    box-shadow:
      0 12px 28px -18px hsl(var(--primary) / 0.55),
      inset 0 -1px 0 hsl(0 0% 100% / 0.14);
  }

  .scene-header::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(740px 160px at 18% -20%, hsl(0 0% 100% / 0.24), transparent 58%),
      radial-gradient(560px 130px at 84% -40%, hsl(0 0% 100% / 0.18), transparent 60%),
      linear-gradient(90deg, hsl(0 0% 100% / 0.06) 1px, transparent 1px);
    background-size:
      auto,
      auto,
      32px 100%;
    pointer-events: none;
  }

  .scene-header::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      hsl(0 0% 100% / 0),
      hsl(0 0% 100% / 0.55),
      hsl(0 0% 100% / 0)
    );
  }

  .header-kicker {
    margin-bottom: 0.08rem;
    font-size: 0.58rem;
    font-weight: 700;
    letter-spacing: 0.09em;
    color: hsl(0 0% 100% / 0.74);
  }

  .header-title {
    font-size: 1rem;
    line-height: 1.2;
    font-weight: 700;
    color: hsl(0 0% 100%);
  }

  .header-subtitle {
    margin-top: 0.06rem;
    font-size: 0.74rem;
    color: hsl(252 100% 93%);
  }

  .scene-main {
    display: flex;
    justify-content: center;
    padding: 1.2rem 1rem 1.4rem;
  }

  .booking-panel {
    width: min(100%, 700px);
    border-radius: 1.25rem;
    overflow: hidden;
    box-shadow:
      0 42px 90px -50px hsl(25 40% 14% / 0.5),
      0 18px 30px -26px hsl(var(--primary) / 0.35);
    background: hsl(0 0% 100% / 0.93);
    border: 1px solid hsl(var(--primary) / 0.14);
    backdrop-filter: blur(7px);
  }

  .panel-head {
    padding: 0.9rem 1rem 0.8rem;
    background:
      radial-gradient(420px 180px at 0% 0%, hsl(var(--primary) / 0.12), transparent 70%),
      linear-gradient(180deg, hsl(0 0% 100% / 0.98), hsl(0 0% 100% / 0.92));
    border-bottom: 1px solid hsl(var(--primary) / 0.14);
  }

  .lang-switch {
    display: inline-flex;
    gap: 0.45rem;
    border-radius: 0.8rem;
    border: 1px solid hsl(0 0% 100% / 0.28);
    background: hsl(252 35% 22% / 0.35);
    padding: 0.3rem;
    box-shadow: inset 0 1px 0 hsl(0 0% 100% / 0.14);
  }

  .lang-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    border-radius: 0.55rem;
    border: 1px solid hsl(0 0% 100% / 0.26);
    padding: 0.34rem 0.72rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: hsl(0 0% 100%);
    transition: all 0.16s ease;
    text-shadow: 0 1px 0 hsl(0 0% 0% / 0.12);
  }

  .lang-btn:hover {
    color: hsl(0 0% 100%);
    border-color: hsl(0 0% 100% / 0.55);
    background: hsl(0 0% 100% / 0.1);
  }

  .lang-btn.is-active {
    border-color: hsl(0 0% 100% / 0.62);
    background: hsl(0 0% 100% / 0.2);
    color: hsl(0 0% 100%);
    box-shadow: 0 10px 22px -14px hsl(0 0% 0% / 0.26);
  }

  :global(.booking-card) {
    border: none;
    border-radius: 0;
    background: hsl(0 0% 100% / 0.95);
    box-shadow: none;
  }

  .alert-success,
  .alert-error {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    border-radius: 0.75rem;
    padding: 0.65rem 0.8rem;
    font-size: 0.86rem;
    font-weight: 500;
  }

  .alert-success {
    border: 1px solid hsl(145 45% 76%);
    background: hsl(145 62% 95%);
    color: hsl(149 60% 24%);
  }

  .alert-error {
    border: 1px solid hsl(0 68% 82%);
    background: hsl(0 85% 97%);
    color: hsl(0 55% 42%);
  }

  .group-block {
    border-radius: 1rem;
    border: 1px solid hsl(257 22% 86%);
    background: hsl(0 0% 100% / 0.75);
    padding: 0.85rem;
    display: grid;
    gap: 0.75rem;
  }

  .group-block legend {
    padding: 0 0.4rem;
    font-size: 0.82rem;
    font-weight: 700;
    color: hsl(var(--primary));
  }

  :global(.time-btn) {
    border-radius: 0.7rem;
    border: 1px solid hsl(258 16% 84%);
    background: hsl(0 0% 100%);
    padding: 0.55rem 0.7rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: hsl(228 20% 30%);
    transition: all 0.14s ease;
  }

  :global(.time-btn:hover) {
    border-color: hsl(var(--primary) / 0.45);
  }

  :global(.time-btn.is-active) {
    border-color: hsl(var(--primary));
    background: linear-gradient(160deg, hsl(var(--primary) / 0.14), hsl(257 100% 98%));
    color: hsl(var(--primary));
    box-shadow: 0 0 0 2px hsl(var(--primary) / 0.2);
  }

  .time-grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 0.5rem;
  }

  .guests-wrap {
    display: grid;
    gap: 0.75rem;
    max-height: min(46vh, 420px);
    overflow: auto;
    padding-right: 0.15rem;
  }

  .guest-block {
    border: 1px solid hsl(var(--primary) / 0.16);
    border-radius: 1rem;
    background: hsl(0 0% 100% / 0.9);
    padding: 1rem;
    display: grid;
    gap: 0.75rem;
  }

  .guest-block__head {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: center;
  }

  .guest-label {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.82rem;
    font-weight: 700;
    color: hsl(var(--primary));
  }

  .service-row {
    display: grid;
    align-items: end;
    gap: 0.5rem;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
    border: 1px solid hsl(var(--primary) / 0.14);
    border-radius: 0.8rem;
    background: hsl(var(--primary) / 0.03);
    padding: 0.6rem;
  }

  .sticky-submit {
    position: sticky;
    bottom: 0;
    z-index: 8;
    margin-top: 0.2rem;
    border-top: 1px solid hsl(var(--primary) / 0.12);
    background: linear-gradient(180deg, hsl(0 0% 100% / 0.75), hsl(0 0% 100% / 0.98) 24%);
    padding-top: 0.65rem;
  }

  @media (max-width: 768px) {
    .scene-main {
      padding-inline: 0.8rem;
    }

    .booking-panel {
      width: 100%;
    }

    .time-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .guests-wrap {
      max-height: none;
      overflow: visible;
    }

    .service-row {
      grid-template-columns: 1fr;
    }
  }
</style>
