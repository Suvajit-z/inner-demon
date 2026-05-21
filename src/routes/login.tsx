import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getState, saveState } from "@/lib/app-state";

export const Route = createFileRoute("/login")({ component: LoginPage });
const adminEmail = "suvajitmurmu2020@gmail.com";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(""); const [otp, setOtp] = useState(["", "", "", "", "", ""]); const [step, setStep] = useState<"email"|"otp">("email");
  const state = getState();
  const locked = state.lockUntil && state.lockUntil > Date.now();
  const time = useMemo(() => Math.max(0, Math.floor(((state.otpExpiresAt || 0) - Date.now()) / 1000)), [step, state.otpExpiresAt]);
  const send = () => {
    if (locked) return;
    const s = getState();
    s.email = email; s.otpCode = `${Math.floor(100000 + Math.random()*900000)}`; s.otpExpiresAt = Date.now()+10*60*1000; s.otpResendAt = Date.now()+60*1000; s.wrongOtpTries = 0; saveState(s);
    alert(`Demo OTP: ${s.otpCode}`); setStep("otp");
  };
  const verify = () => {
    const code = otp.join(""); const s = getState();
    if (Date.now() > (s.otpExpiresAt || 0)) return;
    if (code !== s.otpCode) { s.wrongOtpTries += 1; if (s.wrongOtpTries >= 3) s.lockUntil = Date.now()+15*60*1000; saveState(s); return; }
    s.isAdmin = s.email === adminEmail; if (s.isAdmin) s.isPaid = true; saveState(s); navigate({to: s.isPaid ? "/dashboard" : "/signup"});
  };
  return <main className="min-h-screen bg-[#0A0A0A] text-zinc-100 px-5 py-10"><div className="max-w-md mx-auto">
    <div className="text-center mb-6"><Flame className="mx-auto text-[#C9A84C]"/><h1 className="text-3xl font-bold">INNER DEMON</h1><Link className="text-sm text-[#C9A84C]" to="/privacy">Privacy Policy</Link></div>
    {step === "email" ? <div className="space-y-3"><Input className="h-12" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/><Button className="w-full h-12" onClick={send}>Send OTP</Button></div> : <div className="space-y-4"><div className="grid grid-cols-6 gap-2">{otp.map((d,i)=><Input key={i} maxLength={1} className="h-12 text-center text-xl" value={d} onChange={e=>{const n=[...otp]; n[i]=e.target.value.replace(/\D/g,""); setOtp(n);}}/>)}</div><p>Expires in {Math.floor(time/60)}:{`${time%60}`.padStart(2,"0")}</p><Button className="w-full h-12" onClick={verify}>Verify OTP</Button></div>}
  </div></main>;
}
