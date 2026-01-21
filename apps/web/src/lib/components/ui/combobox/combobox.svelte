<script lang="ts">
    import CheckIcon from "@lucide/svelte/icons/check";
    import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
    import { tick } from "svelte";
    import * as Command from "$lib/components/ui/command/index.js";
    import * as Popover from "$lib/components/ui/popover/index.js";
    import { cn } from "$lib/utils.js";

    let {
        items = [],
        value = $bindable(""),
        placeholder = "Select an option...",
        searchPlaceholder = "Search...",
        emptyText = "No results found.",
        disabled = false,
        onchange,
        class: className,
    }: {
        items: { value: string; label: string }[];
        value?: string;
        placeholder?: string;
        searchPlaceholder?: string;
        emptyText?: string;
        disabled?: boolean;
        onchange?: () => void;
        class?: string;
    } = $props();

    let open = $state(false);
    let triggerRef = $state<HTMLButtonElement>(null!);

    const selectedLabel = $derived(
        items.find((item) => item.value === value)?.label,
    );

    // We want to refocus the trigger button when the user selects
    // an item from the list so users can continue navigating the
    // rest of the form with the keyboard.
    function closeAndFocusTrigger() {
        open = false;
        tick().then(() => {
            triggerRef.focus();
        });
    }
</script>

<Popover.Root
    bind:open
    onOpenChange={(isOpen) => {
        if (!disabled) open = isOpen;
    }}
>
    <Popover.Trigger bind:ref={triggerRef}>
        {#snippet child({ props })}
            <button
                {...props}
                class={cn(
                    "border-input data-[placeholder]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted aria-expanded:border-primary aria-expanded:ring-ring/50 h-9",
                    disabled && "opacity-50 cursor-not-allowed bg-muted",
                    className,
                )}
                role="combobox"
                aria-expanded={open}
                {disabled}
            >
                <span class="truncate">{selectedLabel || placeholder}</span>
                <ChevronsUpDownIcon class="size-4 opacity-50 shrink-0" />
            </button>
        {/snippet}
    </Popover.Trigger>
    <Popover.Content class="!w-[var(--bits-popover-anchor-width)] p-0">
        <Command.Root>
            <Command.Input placeholder={searchPlaceholder} />
            <Command.List>
                <Command.Empty>{emptyText}</Command.Empty>
                <Command.Group>
                    {#each items as item (item.value)}
                        <Command.Item
                            value={item.label}
                            onSelect={() => {
                                value = item.value;
                                closeAndFocusTrigger();
                                onchange?.();
                            }}
                        >
                            <CheckIcon
                                class={cn(
                                    value !== item.value && "text-transparent",
                                )}
                            />
                            {item.label}
                        </Command.Item>
                    {/each}
                </Command.Group>
            </Command.List>
        </Command.Root>
    </Popover.Content>
</Popover.Root>
