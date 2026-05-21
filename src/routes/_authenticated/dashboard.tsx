import { createFileRoute } from "@tanstack/react-router";
import { ensureTodayTasks, formNames, getState, todayKey } from "@/lib/app-state";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Page });

function Page() {
  const s = ensureTodayTasks(getState());
  const tasks = s.tasksByDate[todayKey()];
  const completed = tasks.filter((t) => t.completed).length;

  return <main className="p-4 pb-24 max-w-md mx-auto space-y-4 relative overflow-hidden">
    {[...Array(10)].map((_,i)=><span key={i} className="float-ember absolute w-1 h-1 rounded-full bg-red-500" style={{left:`${10+i*9}%`, animationDelay:`${i*.6}s`}} />)}
    <section className="glass neon-gold rounded-3xl p-4 red-aura">
      <p className="text-xs text-zinc-300">⚔️ INNER DEMON</p>
      <h1 className="text-2xl font-black tracking-wide">POWER: {s.power} / 100</h1>
      <p className="text-[#D4AF37] text-sm">{formNames[s.form - 1]} • Streak Mode Active</p>
      <div className="h-3 rounded-full bg-zinc-800 mt-3 overflow-hidden"><div className="h-3 bg-gradient-to-r from-[#8B0000] to-[#D4AF37]" style={{ width: `${s.power}%` }} /></div>
    </section>
    <section className="glass rounded-2xl p-4">
      <h2 className="font-bold">AI Growth Report</h2>
      <p className="text-sm text-zinc-300 mt-2">Your focus drops after 8 PM. Move hard tasks earlier and reserve nights for lighter review.</p>
    </section>
    <section className="space-y-3">
      <h3 className="text-sm tracking-[0.2em] text-[#D4AF37]">DAILY MISSIONS</h3>
      {tasks.slice(0,3).map((t) => <article key={t.id} className="glass rounded-2xl p-3"><div className="flex justify-between"><p>{t.title}</p><p className="text-[#D4AF37]">+25 XP</p></div><div className="h-2 rounded bg-zinc-800 mt-2"><div className="h-2 rounded bg-[#8B0000]" style={{width:t.completed?'100%':'30%'}}/></div></article>)}
      <p className="text-xs text-zinc-400">Completed today: {completed} / {tasks.length}</p>
    </section>
  </main>;
}
