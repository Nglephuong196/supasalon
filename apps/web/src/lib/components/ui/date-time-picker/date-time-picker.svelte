<script lang="ts">
    import { CalendarDate, DateFormatter } from "@internationalized/date";
    import { untrack } from "svelte";
    import { Calendar } from "$lib/components/ui/calendar";
    import {
        Popover,
        PopoverContent,
        PopoverTrigger,
    } from "$lib/components/ui/popover";
    import { Button } from "$lib/components/ui/button";
    import { cn } from "$lib/utils";
    import { Calendar as CalendarIcon, Clock } from "@lucide/svelte";

    let { value = $bindable(undefined) } = $props();

    let date = $state<CalendarDate | undefined>(undefined);
    let time = $state("09:00");
    let isOpen = $state(false);

    const df = new DateFormatter("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
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
                    if (
                        date?.year !== y ||
                        date?.month !== m ||
                        date?.day !== D
                    ) {
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

    let displayDate = $derived(
        value ? df.format(new Date(value)) : "Chọn thời gian",
    );
</script>

<Popover bind:open={isOpen}>
    <PopoverTrigger>
        {#snippet child({ props })}
            <Button
                variant="outline"
                class={cn(
                    "w-full justify-start text-left font-normal pl-3",
                    !value && "text-muted-foreground",
                )}
                {...props}
            >
                <CalendarIcon class="mr-2 h-4 w-4" />
                {displayDate}
            </Button>
        {/snippet}
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0" align="start">
        <Calendar bind:value={date} type="single" class="rounded-md border-0" />
        <div class="p-3 border-t border-border space-y-3">
            <div class="flex items-center gap-2">
                <Clock class="h-4 w-4 text-muted-foreground" />
                <input
                    type="time"
                    bind:value={time}
                    class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
            </div>
            <Button class="w-full" onclick={() => (isOpen = false)}>Xong</Button
            >
        </div>
    </PopoverContent>
</Popover>
