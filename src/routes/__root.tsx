import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Inner Demon" },
      { name: "theme-color", content: "#C9A84C" },
      { name:"apple-mobile-web-app-capable", content:"yes" },
      { name:"apple-mobile-web-app-status-bar-style", content:"black" },
      { name:"apple-mobile-web-app-title", content:"Inner Demon" },
    ],
    links: [{ rel: "stylesheet", href: appCss }, { rel:"manifest", href:"/manifest.json" }],
  }),
  shellComponent: ({ children }) => (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
        <script dangerouslySetInnerHTML={{__html:`if('serviceWorker'in navigator){navigator.serviceWorker.register('/sw.js')} setTimeout(()=>{if(!localStorage.getItem('install-hide')) alert('📱 Install Inner Demon on your phone.')},30000);`}}/>
      </body>
    </html>
  ),
  component: RootComponent,
  notFoundComponent: () => (
    <div className="p-6 text-center">
      <p>Not found</p>
      <Link to="/dashboard" className="text-primary">
        Go Home
      </Link>
    </div>
  ),
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster richColors theme="dark" position="top-center" />
    </QueryClientProvider>
  );
}
