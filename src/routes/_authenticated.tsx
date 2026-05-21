import { Outlet, createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/bottom-nav";
import { useEffect, useState } from "react";
import { getState, saveState, todayKey } from "@/lib/app-state";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({ component: Shell });
function Shell(){
  const [open,setOpen]=useState(false); const [completion,setCompletion]=useState(0); const [win,setWin]=useState(''); const [failure,setFailure]=useState(''); const [mental,setMental]=useState(5); const [mission,setMission]=useState('');
  useEffect(()=>{ const h=new Date().getHours(); const m=new Date().getMinutes(); if(h===21&&m>=30) setOpen(true);},[]);
  const file=()=>{const s=getState(); s.reviews.unshift({id:crypto.randomUUID(),date:todayKey(),completionRate:completion,win,failure,mental,mission}); s.missedNights=0; saveState(s); setOpen(false);};
  const skip=()=>{const s=getState(); s.power=Math.max(0,s.power-2); s.missedNights+=1; if(s.missedNights>=2) s.power=0; saveState(s); setOpen(false);};
  return <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 pb-24 max-w-md mx-auto">
    <Outlet /> <BottomNav />
    {open && <div className='fixed inset-0 bg-black/90 z-50 p-5'><div className='max-w-md mx-auto space-y-3'><h2 className='text-xl font-bold text-[#C9A84C]'>🌑 DEMON REVIEW</h2><input type='range' min={0} max={100} value={completion} onChange={e=>setCompletion(Number(e.target.value))} className='w-full'/><input className='w-full bg-zinc-900 h-12 rounded p-2' placeholder='Biggest win' value={win} onChange={e=>setWin(e.target.value)}/><input className='w-full bg-zinc-900 h-12 rounded p-2' placeholder='Biggest failure' value={failure} onChange={e=>setFailure(e.target.value)}/><input type='number' min={1} max={10} className='w-full bg-zinc-900 h-12 rounded p-2' value={mental} onChange={e=>setMental(Number(e.target.value))}/><input className='w-full bg-zinc-900 h-12 rounded p-2' placeholder='Main mission tomorrow' value={mission} onChange={e=>setMission(e.target.value)}/><Button className='w-full h-12 bg-[#8B0000]' onClick={file}>FILE REPORT</Button><button className='w-full text-xs underline' onClick={skip}>Skip Tonight (-2.0% power)</button></div></div>}
  </div>
}
