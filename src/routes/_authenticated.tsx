import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { BottomNav } from "@/components/bottom-nav";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    // getUser awaits session restore from storage (vs getSession which can race)
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    if (typeof sessionStorage !== "undefined") sessionStorage.removeItem("__chunk_reloaded");
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { loading, user } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!user) return null;
  return (
    <div className="min-h-screen bg-background pb-24">
      <Outlet />
      <BottomNav />
    </div>
  );
}
