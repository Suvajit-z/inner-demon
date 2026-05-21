import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { getState, saveState } from "@/lib/app-state";
export const Route = createFileRoute("/signup")({ component: Signup });
function Signup(){
  const nav = useNavigate();
  const pay = (plan:"india"|"international") => { const s=getState(); s.isPaid=true; s.activeSubscriber=true; saveState(s); alert("⚔️ WAR CONTINUES. YOUR DEMON LIVES."); nav({to:"/dashboard"}); };
  return <main className="min-h-screen bg-[#0A0A0A] text-zinc-100 p-6 flex items-center"><div className="max-w-md mx-auto w-full rounded-2xl border border-[#C9A84C]/40 p-5 space-y-4">
    <h1 className="text-2xl text-[#C9A84C] font-bold">YOUR TRIAL HAS ENDED</h1><p>Continue your war. Stay in the fight.</p>
    <div className="rounded-xl bg-zinc-900 p-4"><p>🇮🇳 India</p><p className="text-xl">₹49 / month</p><Button className="mt-2 w-full h-12" onClick={()=>pay("india")}>PAY ₹49 — CONTINUE</Button></div>
    <div className="rounded-xl bg-zinc-900 p-4"><p>🌍 International</p><p className="text-xl">$1 / month</p><Button className="mt-2 w-full h-12" onClick={()=>pay("international")}>PAY $1 — CONTINUE</Button></div>
    <p className="text-xs text-zinc-400">Cancel anytime. No hidden fees.</p>
  </div></main>
}
