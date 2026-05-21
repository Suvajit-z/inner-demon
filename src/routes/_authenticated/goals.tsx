import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { ensureTodayTasks, getState, saveState, timerFor, todayKey } from '@/lib/app-state';

export const Route = createFileRoute('/_authenticated/goals')({ component: Missions });

function Missions() {
  const [_, rerender] = useState(0);
  const s = ensureTodayTasks(getState());
  const tasks = s.tasksByDate[todayKey()];

  const toggle = (id: string) => {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    t.completed = !t.completed;
    s.power = Math.min(100, s.power + (t.completed ? 2 : -2));
    saveState(s);
    rerender((x) => x + 1);
  };

  return <main className='p-4 pb-24 max-w-md mx-auto space-y-3'>
    <h1 className='text-xl font-black tracking-wider text-[#D4AF37]'>MISSIONS</h1>
    {tasks.map((t) => <section key={t.id} className='glass rounded-2xl p-4 pulse-red'>
      <div className='flex items-center justify-between'><p>{t.title}</p><span className='text-xs text-zinc-400'>{Math.round(timerFor(t.category)/60)} min</span></div>
      <div className='mt-2 h-2 rounded-full bg-zinc-800'><div className='h-2 bg-gradient-to-r from-[#8B0000] to-[#6A0DAD]' style={{width:t.completed?'100%':'35%'}}/></div>
      <div className='mt-3 grid grid-cols-2 gap-2'><button className='h-10 rounded-xl bg-[#8B0000]'>START</button><button className='h-10 rounded-xl bg-[#D4AF37] text-black' onClick={()=>toggle(t.id)}>{t.completed?'COMPLETED':'COMPLETE'}</button></div>
    </section>)}
  </main>;
}
