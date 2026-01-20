import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Utility types for shadcn-svelte components
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
export type WithoutChildrenOrChild<T> = T extends { children?: any; child?: any }
    ? Omit<T, "children" | "child">
    : T;
export type WithElementRef<T, E extends HTMLElement = HTMLElement> = T & {
    ref?: E | null;
};
