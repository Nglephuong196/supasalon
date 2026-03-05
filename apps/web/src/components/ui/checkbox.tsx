import { cn } from "@/lib/utils";
import * as React from "react";

export const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "border-gray-300 text-primary focus-visible:border-ring focus-visible:ring-ring/50 size-4 shrink-0 rounded border bg-white shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});

Checkbox.displayName = "Checkbox";
