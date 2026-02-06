<script lang="ts">
  import { browser } from "$app/environment";
  import { ScheduleXCalendar } from "@schedule-x/svelte";
  import {
    type CalendarEventExternal,
    createCalendar,
    createViewDay,
    createViewMonthAgenda,
    createViewMonthGrid,
    createViewWeek,
  } from "@schedule-x/calendar";
  import "@schedule-x/theme-default/dist/index.css";
  import "temporal-polyfill/global";

  type Booking = {
    id: number;
    date: string | number;
    status?: string;
    notes?: string | null;
    customer?: {
      name?: string | null;
      phone?: string | null;
    } | null;
    guests?: {
      services?: { serviceId?: number }[];
    }[];
  };

  type Service = {
    id: number;
    duration?: number | null;
    name?: string | null;
  };

  let {
    bookings = [],
    services = [],
  }: {
    bookings?: Booking[];
    services?: Service[];
  } = $props();
  const statusLabels: Record<string, string> = {
    confirmed: "Confirmed",
    pending: "Pending",
    completed: "Completed",
    cancelled: "Cancelled",
    checkin: "Checked in",
  };

  function estimateDurationMinutes(booking: Booking) {
    if (!services.length || !booking.guests?.length) return 60;
    let total = 0;
    for (const guest of booking.guests) {
      for (const svc of guest.services || []) {
        if (!svc?.serviceId) continue;
        const match = services.find((s) => s.id === svc.serviceId);
        if (match?.duration) total += match.duration;
      }
    }
    return total > 0 ? total : 60;
  }

  function toZonedDateTime(input: string | number) {
    const jsDate = new Date(input);
    if (Number.isNaN(jsDate.getTime())) return null;
    const timeZone = Temporal.Now.timeZoneId();
    return Temporal.Instant.from(jsDate.toISOString()).toZonedDateTimeISO(timeZone);
  }

  function toScheduleXDateTimeString(zoned: Temporal.ZonedDateTime) {
    const plain = zoned.toPlainDateTime();
    const iso = plain.toString({ smallestUnit: "minute" });
    return iso.replace("T", " ");
  }

  function isCalendarEventExternal(
    event: CalendarEventExternal | null,
  ): event is CalendarEventExternal {
    return event !== null;
  }

  function buildEvents(source: Booking[]): CalendarEventExternal[] {
    return source
      .map((booking): CalendarEventExternal | null => {
        const start = toZonedDateTime(booking.date);
        if (!start) return null;

        const minutes = estimateDurationMinutes(booking);
        const end = start.add({ minutes });
        const customerName = booking.customer?.name || "Booking";
        const statusLabel = booking.status
          ? statusLabels[booking.status] || booking.status
          : "Scheduled";
        const title = `${customerName} • ${statusLabel}`;

        return {
          id: booking.id.toString(),
          title,
          start: toScheduleXDateTimeString(start),
          end: toScheduleXDateTimeString(end),
        };
      })
      .filter(isCalendarEventExternal);
  }

  let calendarApp = $state<any>(null);

  $effect(() => {
    if (!browser) return;
    const events = buildEvents(bookings);
    calendarApp = createCalendar({
      views: [createViewWeek(), createViewDay(), createViewMonthGrid(), createViewMonthAgenda()],
      isResponsive: false,
      events,
    });
  });
</script>

{#if calendarApp}
  <div class="sx-svelte-calendar-wrapper">
    <ScheduleXCalendar {calendarApp} />
  </div>
{:else}
  <div class="rounded-lg border border-dashed border-gray-200 p-8 text-sm text-muted-foreground">
    Loading calendar...
  </div>
{/if}

<style>
  .sx-svelte-calendar-wrapper {
    width: 100%;
    height: 720px;
    max-height: 85vh;
  }

  :global(.sx__time-grid-event) {
    padding: 4px 6px;
  }

  :global(.sx__time-grid-event-inner) {
    display: flex;
    flex-direction: column;
    gap: 2px;
    height: 100%;
  }

  :global(.sx__time-grid-event-title) {
    line-height: 1.1;
  }

  :global(.sx__time-grid-event-time) {
    line-height: 1.1;
    font-size: 0.75rem;
  }
</style>
