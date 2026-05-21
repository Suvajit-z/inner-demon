import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({ component: Splash });
function Splash(){ const nav=useNavigate(); useEffect(()=>{const t=setTimeout(()=>nav({to:"/login"}),2500); return ()=>clearTimeout(t);},[nav]); return <main className="min-h-screen bg-black text-[#C9A84C] flex items-center justify-center"><div className="text-center animate-pulse"><h1 className="text-4xl font-bold">INNER DEMON</h1><p className="mt-3 text-sm">FACE YOUR DEMON. BECOME THE LEGEND.</p></div></main>; }
