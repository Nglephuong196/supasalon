export function PublicBookingShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="glass-topbar border-b border-border/70 px-4 py-3">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              SupaSalon
            </span>
            <p className="text-sm font-semibold text-foreground">Online Booking</p>
          </div>
          <span className="rounded-full border border-primary/20 bg-secondary px-3 py-1 text-xs text-secondary-foreground">
            Public Page
          </span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">{children}</main>
    </div>
  );
}
