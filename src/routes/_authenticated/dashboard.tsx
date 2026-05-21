import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ensureTodayTasks, formNames, getState, saveState, timerFor, todayKey } from "@/lib/app-state";
import { Plus } from "lucide-react";
export const Route = createFileRoute("/_authenticated/dashboard")({ component: Page });
function Page(){ const [,r]=useState(0); const s=ensureTodayTasks(getState()); const tasks=s.tasksByDate[todayKey()]; const completed=tasks.filter(t=>t.completed).length;
  const toggle=(id:string)=>{const t=tasks.find(x=>x.id===id); if(!t) return; t.completed=!t.completed; saveState(s); navigator.vibrate?.(20); r(x=>x+1);};
  return <main className='p-4 pb-28 overflow-x-hidden max-w-md mx-auto'><section className='rounded-2xl p-4 bg-zinc-900 shadow-lg shadow-black/40 border border-[#C9A84C]/20'>
    <p className='text-sm'>POWER LEVEL</p><h1 className='text-3xl font-bold text-[#C9A84C]'>FORM {s.form} | POWER: {s.power} / 100</h1><div className='h-3 rounded bg-zinc-800 mt-3 overflow-hidden'><div className='h-3 bg-[#C9A84C] transition-all duration-500' style={{width:`${s.power}%`}}/></div><p className='text-sm mt-2'>+{Math.max(0,4-completed)} power available today</p>
    {s.power===100&&<p className='mt-2 text-[#C9A84C]'>⚔️ POWER MAXED — HOLD THE LINE 2 DAYS | Day 1 {s.maintenanceDay>=1?'✅ HELD':'⏳ PENDING'} Day 2 {s.maintenanceDay>=2?'✅ HELD':'⏳ PENDING'}</p>}
    </section>
  <div className='mt-4 space-y-3'>{tasks.map(t=><div key={t.id} className='rounded-2xl bg-zinc-900 border border-zinc-800 p-4'><div className='flex justify-between gap-2'><p>{t.title} {t.source==='notion'&&'🅽'}</p><button className='h-12 px-3 rounded bg-[#8B0000] active:scale-95' onClick={()=>alert(`Timer ${timerFor(t.category)}s`)}>START TIMER</button></div><button className='mt-2 h-12 w-full px-3 rounded bg-[#C9A84C] text-black active:scale-95' onClick={()=>toggle(t.id)}>{t.completed?'Completed':'Mark complete'}</button></div>)}</div>
  <button className='fixed bottom-20 right-6 h-14 w-14 rounded-full bg-[#C9A84C] text-black grid place-items-center shadow-lg'><Plus/></button></main>; }
