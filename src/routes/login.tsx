import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Flame, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getState, saveState } from "@/lib/app-state";

export const Route = createFileRoute("/login")({ component: LoginPage });
const adminEmail = "suvajitmurmu2020@gmail.com";

const hashPin = async (pin: string) => btoa(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin)).then(b=>String.fromCharCode(...new Uint8Array(b))));

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(""); const [otp, setOtp] = useState(Array(6).fill("")); const [pin, setPin] = useState(Array(6).fill(""));
  const [showPin,setShowPin]=useState(false); const [step, setStep] = useState<"email"|"otp"|"pin_create"|"pin_login">("email");
  const state = getState();
  const time = useMemo(() => Math.max(0, Math.floor(((state.otpExpiresAt || 0) - Date.now()) / 1000)), [step, state.otpExpiresAt]);
  const send = () => { const s = getState(); s.email = email; s.otpCode = `${Math.floor(100000 + Math.random()*900000)}`; s.otpExpiresAt = Date.now()+10*60*1000; saveState(s); alert(`Demo OTP: ${s.otpCode}`); setStep("otp");};
  const verifyOtp = () => { const s = getState(); if (otp.join("") !== s.otpCode || Date.now() > (s.otpExpiresAt || 0)) return; setStep(s.pinHash ? "pin_login" : "pin_create"); };
  const createPin = async () => { const p=pin.join(""); if(!/^\d{6}$/.test(p)) return; const s = getState(); s.pinHash = await hashPin(p); s.isAdmin = s.email === adminEmail; s.isPaid = s.isAdmin; s.trialEndsAt = s.isAdmin ? undefined : Date.now() + 30*24*60*60*1000; s.activeSubscriber = s.isAdmin; saveState(s); navigate({to: s.isPaid?"/dashboard":"/signup"}); };
  const loginPin = async () => { const s=getState(); const p=pin.join(""); if(await hashPin(p)===s.pinHash){s.failedPinAttempts=0; saveState(s); navigate({to:s.isPaid?"/dashboard":"/signup"}); return;} s.failedPinAttempts+=1; if(s.failedPinAttempts>=5){send(); s.failedPinAttempts=0;} saveState(s); };
  return <main className="min-h-screen bg-[#0A0A0A] text-zinc-100 px-5 py-10"><div className="max-w-md mx-auto">
    <div className="text-center mb-6"><Flame className="mx-auto text-[#C9A84C]"/><h1 className="text-3xl font-bold">INNER DEMON</h1><Link className="text-sm text-[#C9A84C]" to="/privacy">Privacy Policy</Link></div>
    {step === "email" && <div className="space-y-3"><Input className="h-12" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/><Button className="w-full h-12" onClick={send}>Send OTP</Button></div>}
    {step === "otp" && <div className="space-y-4"><div className="grid grid-cols-6 gap-2">{otp.map((d,i)=><Input key={i} maxLength={1} className="h-12 text-center text-xl" value={d} onChange={e=>{const n=[...otp]; n[i]=e.target.value.replace(/\D/g,""); setOtp(n);}}/>)}</div><p>Expires in {Math.floor(time/60)}:{`${time%60}`.padStart(2,"0")}</p><Button className="w-full h-12" onClick={verifyOtp}>Verify OTP</Button></div>}
    {(step === "pin_create" || step==="pin_login") && <div className="space-y-4"><div className="grid grid-cols-6 gap-2">{pin.map((d,i)=><Input key={i} type={showPin?"text":"password"} maxLength={1} className="h-12 text-center text-xl" value={d} onChange={e=>{const n=[...pin]; n[i]=e.target.value.replace(/\D/g,""); setPin(n);}}/>)}</div><button className="text-sm text-zinc-400" onClick={()=>setShowPin(!showPin)}>{showPin?<EyeOff className="inline h-4"/>:<Eye className="inline h-4"/>} Show/Hide PIN</button><button className="text-sm text-[#C9A84C] block" onClick={send}>Forgot PIN?</button><Button className="w-full h-12" onClick={step==="pin_create"?createPin:loginPin}>{step==="pin_create"?"Set PIN":"Enter App"}</Button></div>}
  </div></main>;
}
