import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "⚔️ INNER DEMON" },
      { name: "theme-color", content: "#050505" }
    ],
    links: [{ rel: "stylesheet", href: appCss }, { rel: "manifest", href: "/manifest.json" }],
  }),
  shellComponent: ({ children }) => <html lang="en"><head><HeadContent /></head><body>{children}<Scripts /></body></html>,
  component: RootComponent,
  notFoundComponent: () => <div className="p-6 text-center"><p>Not found</p><Link to="/dashboard" className="text-primary">Go Home</Link></div>,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [splash, setSplash] = useState(true);
  useEffect(()=>{
    if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
    const t = setTimeout(()=>setSplash(false), 2500);
    return ()=>clearTimeout(t);
  },[]);

  return <QueryClientProvider client={queryClient}>
    {splash ? <div className="fixed inset-0 z-[100] bg-[#050505] grid place-items-center">
      <div className="text-center"><div className="w-20 h-20 mx-auto mb-5 rounded-full bg-[#8B0000] eye-blink pulse-red grid place-items-center text-3xl">👁</div><h1 className="text-3xl font-black text-[#D4AF37]">INNER DEMON</h1><p className="text-zinc-400">Forge Your Strongest Self</p></div>
    </div> : <Outlet />}
    <Toaster richColors theme="dark" position="top-center" />
  </QueryClientProvider>;
}
