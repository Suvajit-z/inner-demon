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
  const { enabled, permission, enable, disable } = useReminders();

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out.");
    navigate({ to: "/" });
  }

  async function handleEnable() {
    const res = await enable();
    if (res.ok) toast.success("Daily reminders enabled at 6:00 AM and 9:30 PM.");
    else toast.error(res.reason);
  }

  function handleDisable() {
    disable();
    toast.success("Reminders disabled.");
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
          {enabled ? <Bell className="mt-1 h-5 w-5 text-primary" /> : <BellOff className="mt-1 h-5 w-5 text-muted-foreground" />}
          <div className="flex-1">
            <p className="font-semibold">Daily reminders</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Browser notifications at 6:00 AM (morning mission) and 9:30 PM (night review). Keep this app open in a tab.
            </p>
            {permission === "denied" && (
              <p className="mt-2 text-xs text-destructive">
                Notifications blocked. Enable them in your browser site settings, then try again.
              </p>
            )}
            {enabled ? (
              <Button size="sm" variant="outline" className="mt-3" onClick={handleDisable}>
                Disable reminders
              </Button>
            ) : (
              <Button size="sm" className="mt-3" onClick={handleEnable} disabled={permission === "denied"}>
                Enable reminders
              </Button>
            )}
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
