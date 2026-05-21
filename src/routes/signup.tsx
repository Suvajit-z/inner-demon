import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { getState, saveState } from "@/lib/app-state";

export const Route = createFileRoute("/signup")({ component: Signup });

function Signup(){
  const nav = useNavigate();
  const pay = () => { const s=getState(); s.isPaid=true; saveState(s); nav({to:"/dashboard"}); };
  return <main className="min-h-screen bg-[#0A0A0A] text-zinc-100 p-6 flex items-center"><div className="max-w-md mx-auto w-full rounded-2xl border border-[#C9A84C]/40 p-5">
    <h1 className="text-2xl text-[#C9A84C] font-bold">JOIN THE BATTLEFIELD</h1>
    <p className="mt-2">One-time entry fee: ₹10. Top demon after 100 days wins ₹100.</p>
    <Button className="mt-6 w-full h-12 bg-[#C9A84C] text-black" onClick={pay}>PAY ₹10 AND ENTER</Button>
  </div></main>
}
