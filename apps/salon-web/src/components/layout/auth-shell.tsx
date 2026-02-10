import { CalendarRange, CircleCheckBig, Scissors, Sparkles } from "lucide-react";

const highlights = [
  {
    icon: CircleCheckBig,
    title: "Đặt lịch chính xác",
    text: "Theo dõi lịch hẹn theo thời gian thực và giảm tỷ lệ bỏ lịch.",
  },
  {
    icon: CalendarRange,
    title: "Vận hành mượt mà",
    text: "Tập trung lịch, dịch vụ và nhân sự trong một bảng điều khiển.",
  },
  {
    icon: Sparkles,
    title: "Trải nghiệm cao cấp",
    text: "Thiết kế dành cho salon hiện đại, rõ ràng trên cả mobile và desktop.",
  },
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(170deg,#fefaf3,#f5fbf9_52%,#eef5fb)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(245,166,35,.20),transparent_35%),radial-gradient(circle_at_90%_20%,rgba(14,116,144,.15),transparent_32%),radial-gradient(circle_at_35%_85%,rgba(8,145,178,.12),transparent_30%)]" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl lg:grid-cols-[1.1fr_0.9fr]">
        <aside className="hidden border-r border-black/5 px-8 py-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
              <Scissors className="h-3.5 w-3.5 text-cyan-700" />
              SupaSalon Platform
            </div>
            <h1 className="max-w-lg text-4xl leading-tight font-semibold text-slate-900">
              Quản lý salon hiệu quả với giao diện rõ ràng và dữ liệu tập trung.
            </h1>
            <p className="mt-4 max-w-lg text-base text-slate-700">
              Đăng nhập để theo dõi hoạt động kinh doanh hằng ngày và giữ trải nghiệm khách hàng
              luôn ổn định.
            </p>
          </div>

          <div className="space-y-3">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-black/5 bg-white/70 p-4 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.7)] backdrop-blur"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-lg bg-cyan-50 p-2 text-cyan-700">
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  </div>
                  <p className="text-sm text-slate-700">{item.text}</p>
                </div>
              );
            })}
          </div>
        </aside>

        <main className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
