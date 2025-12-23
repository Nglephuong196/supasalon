"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-black">
      {/* Desktop Sidebar */}
      {/* Desktop Sidebar */}
      <Sidebar 
        collapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        className="hidden md:flex" 
      />

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-full border-r-0 [&>button]:hidden">
             {/* Accessibility helper: Required Title/Desc for Shadcn/Radix-UI Dialog */}
             <VisuallyHidden>
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>Main navigation menu</SheetDescription>
            </VisuallyHidden>
            <div className="h-full flex flex-col" onClick={() => setIsMobileMenuOpen(false)}> {/* Close on click */}
                <Sidebar className="w-full border-none" />
            </div>
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden transition-all duration-300">
        <Header 
            onMobileMenuOpen={() => setIsMobileMenuOpen(true)} 
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
