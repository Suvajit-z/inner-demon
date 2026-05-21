import { createFileRoute } from '@tanstack/react-router';
import { formNames, getState } from '@/lib/app-state';

export const Route = createFileRoute('/_authenticated/ranks')({ component: Evolution });

function Evolution(){
  const s = getState();
  return <main className='p-4 pb-24 max-w-md mx-auto'>
    <h1 className='text-xl font-black text-[#D4AF37] tracking-wider'>EVOLUTION</h1>
    <section className='glass rounded-3xl p-4 mt-3 red-aura'>
      <p className='text-xs text-zinc-400'>CURRENT FORM</p>
      <h2 className='text-2xl font-bold'>{formNames[s.form-1]}</h2>
      <p className='mt-2 text-sm'>POWER: {s.power} / 100</p>
      <div className='mt-4 h-32 rounded-2xl bg-black/40 grid place-items-center'>
        <div className='w-20 h-20 rounded-full bg-[#8B0000] eye-blink pulse-red grid place-items-center text-3xl'>👁</div>
      </div>
    </section>
    <p className='mt-3 text-xs text-zinc-400'>When you reach 100 power and hold it, cinematic evolution triggers: “YOUR DEMON HAS EVOLVED”.</p>
  </main>
}
