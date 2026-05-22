import { cn } from "@/lib/utils";

export function DemonAvatar({ form, className }: { form: number; className?: string }) {
  const eye = form >= 7 ? "#FFD700" : "#FF4444";
  return (
    <svg viewBox="0 0 120 120" className={cn("w-full h-full", className)} fill="none" aria-label={`Demon form ${form}`}>
      <path d="M20 92c8-24 26-40 40-40s32 16 40 40H20Z" fill="currentColor" opacity="0.35"/>
      <path d="M36 56 24 30l18 10M84 56l12-26-18 10" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
      <ellipse cx="60" cy="66" rx="24" ry="22" fill="currentColor" opacity="0.85"/>
      <circle cx="50" cy="66" r="4" fill={eye}/>
      <circle cx="70" cy="66" r="4" fill={eye}/>
      <path d="M50 78c6 6 14 6 20 0" stroke="#fff" strokeOpacity="0.4" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}
