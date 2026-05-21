import { Link, useLocation } from "@tanstack/react-router";
import { Home, Target, ChartNoAxesColumn, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard", label: "Home", Icon: Home },
  { to: "/goals", label: "Goals", Icon: Target },
  { to: "/progress", label: "Progress", Icon: ChartNoAxesColumn },
  { to: "/ranks", label: "Ranks", Icon: Trophy },
  { to: "/profile", label: "Profile", Icon: User },
] as const;

export function BottomNav() {
  const loc = useLocation();
  return <nav className="fixed bottom-0 inset-x-0 z-30 bg-[#0A0A0A]/95 border-t border-[#C9A84C]/30 backdrop-blur">
    <ul className="mx-auto max-w-md grid grid-cols-5">{items.map(({to,label,Icon}) => {
      const active = loc.pathname.startsWith(to);
      return <li key={to}><Link to={to} className={cn("h-16 flex flex-col items-center justify-center text-xs transition active:scale-95", active ? "text-[#C9A84C]" : "text-zinc-400")}><Icon className="h-5 w-5"/>{label}</Link></li>;
    })}</ul>
  </nav>;
}
