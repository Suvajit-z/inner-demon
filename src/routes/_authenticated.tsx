import { Outlet, createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/bottom-nav";
import { useEffect, useState } from "react";
import { getState, saveState, todayKey } from "@/lib/app-state";

export const Route = createFileRoute("/_authenticated")({ component: Shell });
function Shell() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState('');
  const [win, setWin] = useState('');
  const [failure, setFailure] = useState('');
  const [mood, setMood] = useState('');
  const [target, setTarget] = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    if (h >= 21) setOpen(true);
  }, []);

  const file = () => {
    const s = getState();
    s.reviews.unshift({ id: crypto.randomUUID(), date: todayKey(), completionRate: 80, win, failure, mental: 7, mission: target || done });
    saveState(s); setOpen(false);
  };

  return <div className="min-h-screen bg-[#050505] text-zinc-100 pb-24 max-w-md mx-auto">
    <Outlet /> <BottomNav />
    {open && <div className='fixed inset-0 bg-black/90 z-50 p-5'>
      <div className='max-w-md mx-auto space-y-2 glass p-4 rounded-2xl border-[#8B0000] red-aura'>
        <h2 className='text-xl font-bold text-[#D4AF37]'>🌑 NIGHT REVIEW</h2>
        <input className='w-full bg-black/40 h-11 rounded p-2' placeholder='What did you complete today?' value={done} onChange={e=>setDone(e.target.value)}/>
        <input className='w-full bg-black/40 h-11 rounded p-2' placeholder='Biggest win?' value={win} onChange={e=>setWin(e.target.value)}/>
        <input className='w-full bg-black/40 h-11 rounded p-2' placeholder='Biggest failure?' value={failure} onChange={e=>setFailure(e.target.value)}/>
        <input className='w-full bg-black/40 h-11 rounded p-2' placeholder='Mood today?' value={mood} onChange={e=>setMood(e.target.value)}/>
        <input className='w-full bg-black/40 h-11 rounded p-2' placeholder="Tomorrow's target?" value={target} onChange={e=>setTarget(e.target.value)}/>
        <button className='w-full h-11 rounded bg-[#8B0000]' onClick={file}>FILE REPORT</button>
        <button className='w-full h-11 rounded border border-zinc-700' onClick={()=>setOpen(false)}>SKIP</button>
      </div>
    </div>}
  </div>;
}
