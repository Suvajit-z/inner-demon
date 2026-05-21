import { createFileRoute } from '@tanstack/react-router';
import { getState } from '@/lib/app-state';
export const Route = createFileRoute('/_authenticated/ranks')({component:()=>{const s=getState(); return <main className='p-4 pb-24'><h1 className='text-2xl text-[#C9A84C] font-bold'>Ranks</h1><div className='mt-4 rounded-xl border p-4'>Power Level: {s.power.toFixed(3)}%</div></main>}})
