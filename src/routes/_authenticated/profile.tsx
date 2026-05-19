import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useReminders } from "@/hooks/use-reminders";
import { supabase } from "@/integrations/supabase/client";
import { Bell, BellOff, LogOut, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out.");
    navigate({ to: "/" });
  }

  return (
    <main className="mx-auto max-w-md px-4 pt-6">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <UserIcon className="h-6 w-6 text-primary" />
          Profile
        </h1>
      </header>

      <Card className="mb-4 p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Account</p>
        <p className="mt-1 font-medium">{user?.user_metadata?.full_name ?? "—"}</p>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </Card>

      <Card className="mb-4 p-5">
        <div className="flex items-start gap-3">
          <Calendar className="mt-1 h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="font-semibold">Google Calendar</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Get 6 AM mission and 9:30 PM night-review reminders on your calendar.
            </p>
            <Button size="sm" variant="secondary" className="mt-3" disabled>
              Coming soon
            </Button>
          </div>
        </div>
      </Card>

      <Button variant="outline" className="w-full" onClick={signOut}>
        <LogOut className="mr-2 h-4 w-4" />
        Sign out
      </Button>
    </main>
  );
}
