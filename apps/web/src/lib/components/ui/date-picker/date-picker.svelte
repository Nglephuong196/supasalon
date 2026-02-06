<script lang="ts">
  import {
    CalendarDate,
    DateFormatter,
    getLocalTimeZone,
    parseDate,
  } from "@internationalized/date";
  import { untrack } from "svelte";
  import Calendar from "$lib/components/ui/calendar/calendar.svelte";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { cn } from "$lib/utils";
  import CalendarIcon from "@lucide/svelte/icons/calendar";

  let {
    value = $bindable(""),
    placeholder = "Chọn ngày",
    class: className,
    disabled = false,
  } = $props<{
    value?: string;
    placeholder?: string;
    class?: string;
    disabled?: boolean;
  }>();

  let date = $state<CalendarDate | undefined>(undefined);
  let isOpen = $state(false);

  const df = new DateFormatter("vi-VN", {
    dateStyle: "short",
  });

  // Sync value -> internal state
  $effect(() => {
    const val = value;
    untrack(() => {
      if (val) {
        try {
          // Parse YYYY-MM-DD format
          const parsed = parseDate(val);
          if (
            date?.year !== parsed.year ||
            date?.month !== parsed.month ||
            date?.day !== parsed.day
          ) {
            date = parsed;
          }
        } catch {
          date = undefined;
        }
      } else {
        date = undefined;
      }
    });
  });

  // Sync internal -> value
  $effect(() => {
    if (date) {
      const y = date.year;
      const m = date.month.toString().padStart(2, "0");
      const d = date.day.toString().padStart(2, "0");
      const newValue = `${y}-${m}-${d}`;

      untrack(() => {
        if (value !== newValue) {
          value = newValue;
        }
      });
    }
  });

  let displayDate = $derived(date ? df.format(date.toDate(getLocalTimeZone())) : placeholder);
</script>

<Popover.Root bind:open={isOpen}>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button
        {...props}
        {disabled}
        variant="outline"
        class={cn(
          "w-[140px] justify-start font-normal h-9 border-gray-200",
          !date && "text-muted-foreground",
          className,
        )}
      >
        <CalendarIcon class="mr-2 h-4 w-4" />
        {displayDate}
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
