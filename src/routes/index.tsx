import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-md flex-col items-center justify-center px-6 pt-24 pb-12 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/30">
          <Flame className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-primary">INNER DEMON</h1>
        <p className="mt-3 text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Awaken the discipline within
        </p>
        <p className="mt-8 text-base leading-relaxed text-muted-foreground">
          Upload your goals. Every morning, AI generates your 4 missions for the day.
          No more thinking — just execute.
        </p>
        <div className="mt-10 flex w-full flex-col gap-3">
          <Button asChild size="lg" className="h-12 text-base font-semibold">
            <Link to="/signup">Begin Your Awakening</Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="h-12">
            <Link to="/login">I already have an account</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
