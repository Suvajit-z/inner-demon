import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect } from "react";
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
  useEffect(()=>{
    if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
  },[]);

  return <QueryClientProvider client={queryClient}>
    <Outlet />
    <Toaster richColors theme="dark" position="top-center" />
  </QueryClientProvider>;
}
