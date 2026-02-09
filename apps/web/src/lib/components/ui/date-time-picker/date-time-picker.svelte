<script lang="ts">
import { CalendarDate, DateFormatter, getLocalTimeZone } from "@internationalized/date";
import { untrack } from "svelte";
import Calendar from "$lib/components/ui/calendar/calendar.svelte";
import * as Popover from "$lib/components/ui/popover/index.js";
import { Button } from "$lib/components/ui/button/index.js";
import { Input } from "$lib/components/ui/input/index.js";
import { cn } from "$lib/utils";
import CalendarIcon from "@lucide/svelte/icons/calendar";
import ClockIcon from "@lucide/svelte/icons/clock";
import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";

let { value = $bindable(undefined), class: className } = $props<{
  value?: string;
  class?: string;
}>();

let date = $state<CalendarDate | undefined>(undefined);
let time = $state("09:00");
let isOpen = $state(false);

const df = new DateFormatter("vi-VN", {
  dateStyle: "medium",
});

// Sync value -> internal state (one way, when value changes from outside)
$effect(() => {
  const val = value;
  untrack(() => {
    if (val) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const D = d.getDate();

        // Only update if different to avoid loop/jitter
        if (date?.year !== y || date?.month !== m || date?.day !== D) {
          date = new CalendarDate(y, m, D);
        }

        const h = d.getHours().toString().padStart(2, "0");
        const min = d.getMinutes().toString().padStart(2, "0");
        const t = `${h}:${min}`;
        if (time !== t) {
          time = t;
        }
      }
    }
  });
});

// Sync internal -> value
$effect(() => {
  if (date && time) {
    const y = date.year;
    const m = date.month.toString().padStart(2, "0");
    const d = date.day.toString().padStart(2, "0");
    const newValue = `${y}-${m}-${d}T${time}`;

    untrack(() => {
      if (value !== newValue) {
        value = newValue;
      }
    });
  }
});

let displayDate = $derived(date ? df.format(date.toDate(getLocalTimeZone())) : "Chọn ngày");
</script>

<div class={cn("flex gap-2", className)}>
  <!-- Date Picker -->
  <Popover.Root bind:open={isOpen}>
    <Popover.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          variant="outline"
          class={cn("w-[160px] justify-between font-normal", !date && "text-muted-foreground")}
        >
          <span class="flex items-center gap-2">
            <CalendarIcon class="h-4 w-4" />
            {displayDate}
          </span>
          <ChevronDownIcon class="h-4 w-4 opacity-50" />
        </Button>
      {/snippet}
    </Popover.Trigger>
    <Popover.Content class="w-auto overflow-hidden p-0 rounded-lg" align="start">
      <Calendar
        type="single"
        bind:value={date}
        onValueChange={() => {
          isOpen = false;
        }}
        captionLayout="dropdown"
      />
    </Popover.Content>
  </Popover.Root>

  <!-- Time Input -->
  <div class="relative">
    <ClockIcon
      class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
    />
    <Input
      type="time"
      bind:value={time}
      class="w-[120px] pl-9 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
    />
  </div>
</div>
