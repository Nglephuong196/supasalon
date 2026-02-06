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

export const parseSetCookie = (header: string) => {
  const parts = header.split(";");
  const [name, ...valueParts] = parts[0].split("=");
  const value = valueParts.join("=");
  const options: any = { path: "/" };

  parts.slice(1).forEach((part) => {
    const [key, val] = part.trim().split("=");
    const lowerKey = key.toLowerCase();
    if (lowerKey === "path") options.path = val;
    else if (lowerKey === "domain") options.domain = val;
    else if (lowerKey === "httponly") options.httpOnly = true;
    else if (lowerKey === "secure") options.secure = true;
    else if (lowerKey === "samesite") options.sameSite = val.toLowerCase();
    else if (lowerKey === "max-age") options.maxAge = parseInt(val);
    else if (lowerKey === "expires") options.expires = new Date(val);
    else if (lowerKey === "priority") options.priority = val.toLowerCase();
    else if (lowerKey === "partitioned") options.partitioned = true;
  });
  return { name, value, options };
};
