import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getOrGenerateDailyTasks,
  toggleTaskComplete,
} from "@/lib/goals.functions";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Flame, Sparkles, Clock } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const router = useRouter();
  const generate = useServerFn(getOrGenerateDailyTasks);
  const toggle = useServerFn(toggleTaskComplete);
  const [generating, setGenerating] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["daily-tasks", "today"],
    queryFn: () => generate({ data: {} }),
  });

  const tasks = data?.tasks ?? [];
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  async function onRegenerate() {
    setGenerating(true);
    try {
      // Clear today server-side by passing date; reuse same fn after manual delete
      // For v1: just re-run; server fn returns existing if 4 exist
      await refetch();
      toast.success("Missions refreshed.");
    } finally {
      setGenerating(false);
    }
  }

  async function onToggle(id: string, completed: boolean) {
    try {
      await toggle({ data: { id, completed } });
      router.invalidate();
      refetch();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to update");
    }
  }

  const doneCount = tasks.filter((t: any) => t.completed).length;

  return (
    <main className="mx-auto max-w-md px-4 pt-6">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{today}</p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Flame className="h-6 w-6 text-primary" />
          Your demon awakens
        </h1>
      </header>

      <Card className="mb-5 border-primary/30 bg-gradient-to-br from-card to-card/40 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Form</p>
            <p className="mt-1 text-lg font-bold text-primary">AWAKENING SHADE</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Today</p>
            <p className="mt-1 text-lg font-bold">
              {doneCount}<span className="text-muted-foreground">/{tasks.length || 4}</span>
            </p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary-glow transition-all"
            style={{ width: `${tasks.length ? (doneCount / tasks.length) * 100 : 0}%` }}
          />
        </div>
      </Card>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Today's Missions
        </h2>
        <Button variant="ghost" size="sm" onClick={onRegenerate} disabled={generating || isLoading}>
          <Sparkles className="mr-1 h-3.5 w-3.5" />
          {generating ? "..." : "Refresh"}
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="h-20 animate-pulse bg-muted/50" />
          ))}
        </div>
      )}

      {!isLoading && tasks.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {data?.message ?? "No missions yet."}
          </p>
          <Button asChild className="mt-4" size="sm">
            <a href="/goals">Add your goals</a>
          </Button>
        </Card>
      )}

      <ul className="space-y-3">
        {tasks.map((t: any) => (
          <li key={t.id}>
            <Card
              className={cn(
                "flex items-start gap-3 p-4 transition-colors",
                t.completed && "opacity-60",
              )}
            >
              <Checkbox
                checked={t.completed}
                onCheckedChange={(c) => onToggle(t.id, !!c)}
                className="mt-1 h-5 w-5 border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              />
              <div className="flex-1">
                <p className={cn("font-medium", t.completed && "line-through")}>{t.title}</p>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="uppercase tracking-wider">{t.task_type}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {t.estimated_minutes} min
                  </span>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </main>
  );
}
