import { Link, useLocation } from "@tanstack/react-router";
import { Home, Swords, LineChart, Flame, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard", label: "HOME", Icon: Home },
  { to: "/goals", label: "MISSIONS", Icon: Swords },
  { to: "/ranks", label: "EVOLUTION", Icon: Flame },
  { to: "/progress", label: "PROGRESS", Icon: LineChart },
  { to: "/profile", label: "PROFILE", Icon: User },
] as const;

export function BottomNav() {
  const loc = useLocation();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#050505]/80 border-t border-[#D4AF37]/25 backdrop-blur-xl">
      <ul className="mx-auto max-w-md grid grid-cols-5">
        {items.map(({ to, label, Icon }) => {
          const active = loc.pathname.startsWith(to);
          return (
            <li key={to}>
              <Link to={to} className={cn("h-16 flex flex-col items-center justify-center text-[10px] tracking-wider transition active:scale-95", active ? "text-[#D4AF37]" : "text-zinc-400")}>
                <Icon className={cn("h-5 w-5 mb-1", active && "drop-shadow-[0_0_8px_rgba(212,175,55,.8)]")} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
