import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/_authenticated/profile')({component: Profile});

function Profile(){
  const [notif,setNotif]=useState(Notification.permission==='granted');
  useEffect(()=>{ if(localStorage.getItem('inner-install-seen')) return; alert('Install Inner Demon\nAdd to Home Screen for full app experience.'); localStorage.setItem('inner-install-seen','1'); },[]);

  const askNotif=async()=>{
    const p = await Notification.requestPermission();
    setNotif(p==='granted');
  }

  return <main className='p-4 pb-24 max-w-md mx-auto space-y-3'>
    <h1 className='text-xl font-black text-[#D4AF37] tracking-wider'>PROFILE</h1>
    <button className='h-12 w-full rounded-xl glass' onClick={askNotif}>Notifications: {notif?'ON':'OFF'}</button>
    <button className='h-12 w-full rounded-xl bg-[#8B0000]' onClick={()=>localStorage.clear()}>Reset Data</button>
    <button className='h-12 w-full rounded-xl border border-[#D4AF37]' onClick={()=>window.location.reload()}>Theme Toggle (Dark Aura)</button>
  </main>
}
