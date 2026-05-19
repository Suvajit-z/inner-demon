import { Link, useLocation } from "@tanstack/react-router";
import { Home, Target, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard", label: "Home", Icon: Home },
  { to: "/goals", label: "Goals", Icon: Target },
  { to: "/profile", label: "Profile", Icon: User },
] as const;

export function BottomNav() {
  const loc = useLocation();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/70">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map(({ to, label, Icon }) => {
          const active = loc.pathname.startsWith(to);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 text-xs font-medium tracking-wide transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {label.toUpperCase()}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
