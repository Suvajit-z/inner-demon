import { createFileRoute } from '@tanstack/react-router';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis } from 'recharts';

const data = [
  { d: 'Mon', score: 42 }, { d: 'Tue', score: 54 }, { d: 'Wed', score: 61 }, { d: 'Thu', score: 58 }, { d: 'Fri', score: 68 }, { d: 'Sat', score: 76 }, { d: 'Sun', score: 71 }
];

export const Route = createFileRoute('/_authenticated/progress')({ component: Progress });

function Progress(){
  return <main className='p-4 pb-24 max-w-md mx-auto space-y-4'>
    <h1 className='text-xl font-black text-[#D4AF37] tracking-wider'>PROGRESS</h1>
    <section className='glass rounded-2xl p-4'>
      <h2 className='font-semibold'>Discipline Score</h2>
      <p className='text-3xl font-black mt-2'>71</p>
      <p className='text-sm text-zinc-400'>Focus level stable. Sleep habits need improvement.</p>
    </section>
    <section className='glass rounded-2xl p-3 h-56'>
      <ResponsiveContainer width='100%' height='100%'><LineChart data={data}><CartesianGrid stroke='#222'/><XAxis dataKey='d' stroke='#777'/><Line type='monotone' dataKey='score' stroke='#D4AF37' strokeWidth={3}/></LineChart></ResponsiveContainer>
    </section>
  </main>
}
