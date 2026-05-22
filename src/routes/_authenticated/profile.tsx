import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { getState, saveState, playSound, triggerHaptic, formNames, AppState, todayKey } from "@/lib/app-state";
import { db, UserProfile, NightReview, ExtractedGoal, UploadedPDF, Stats } from "@/lib/db";
import { 
  User, 
  Settings2, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Download, 
  Upload, 
  Trash2, 
  Clock, 
  Flame, 
  Zap, 
  CheckCircle2, 
  Skull, 
  ShieldAlert, 
  Check 
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({ component: Profile });

function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // App state & settings
  const [appState, setAppState] = useState<AppState | null>(null);
  const [profilePicUrl, setProfilePicUrl] = useState<string>("");
  const [creationDate, setCreationDate] = useState<string>("");

  // Settings form states
  const [sound, setSound] = useState(true);
  const [haptic, setHaptic] = useState(true);
  const [openAIKey, setOpenAIKey] = useState("");
  const [claudeKey, setClaudeKey] = useState("");
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [showClaude, setShowClaude] = useState(false);

  // System wipe & notification permissions
  const [notif, setNotif] = useState(false);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [wipeInput, setWipeInput] = useState("");

  // Load state and profiles on mount
  useEffect(() => {
    const s = getState();
    setAppState(s);
    setSound(s.soundEnabled);
    setHaptic(s.hapticEnabled);
    setOpenAIKey(s.apiKeyOpenAI || "");
    setClaudeKey(s.apiKeyClaude || "");

    // Fetch picture from DB
    db.getProfile().then((p) => {
      if (p) {
        if (p.created_at) {
          setCreationDate(new Date(p.created_at).toLocaleDateString());
        }
        if (p.profile_picture_blob) {
          const url = URL.createObjectURL(p.profile_picture_blob);
          setProfilePicUrl(url);
        }
      }
    }).catch(console.error);

    if (typeof Notification !== "undefined") {
      setNotif(Notification.permission === "granted");
    }
  }, []);

  const askNotif = async () => {
    if (typeof Notification === "undefined") {
      toast.error("Web Notifications are not supported on this browser.");
      return;
    }
    const p = await Notification.requestPermission();
    setNotif(p === "granted");
    if (p === "granted") {
      toast.success("Demon Notifications unlocked successfully!");
      if (appState) triggerHaptic("success", appState);
    }
  };

  const handleToggleSound = () => {
    if (!appState) return;
    const nextVal = !sound;
    setSound(nextVal);
    
    const updated = { ...appState, soundEnabled: nextVal };
    saveState(updated);
    setAppState(updated);

    if (nextVal) {
      playSound("click", updated);
    }
    toast.success(`Sound effects: ${nextVal ? "ENABLED" : "MUTED"}`, {
      style: { background: "#0A0A0A", border: "1px solid rgba(255,215,0,0.15)" }
    });
  };

  const handleToggleHaptic = () => {
    if (!appState) return;
    const nextVal = !haptic;
    setHaptic(nextVal);

    const updated = { ...appState, hapticEnabled: nextVal };
    saveState(updated);
    setAppState(updated);

    if (nextVal) {
      triggerHaptic("success", updated);
    }
    toast.success(`Haptic feedback: ${nextVal ? "ENABLED" : "DISABLED"}`, {
      style: { background: "#0A0A0A", border: "1px solid rgba(255,215,0,0.15)" }
    });
  };

  const handleSaveKeys = () => {
    if (!appState) return;
    
    const updated = {
      ...appState,
      apiKeyOpenAI: openAIKey.trim(),
      apiKeyClaude: claudeKey.trim()
    };
    saveState(updated);
    setAppState(updated);

    playSound("submit", updated);
    triggerHaptic("success", updated);
    
    toast.success("Secret API Credentials updated inside your sandbox.", {
      style: { background: "#0A0A0A", border: "1px solid #FFD700", color: "#FFD700" }
    });
  };

  // HELPER: Convert Blob to Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // HELPER: Convert Base64 back to Blob
  const base64ToBlob = (base64Data: string, contentType = "application/octet-stream"): Blob => {
    const splitParts = base64Data.split(",");
    const byteCharacters = atob(splitParts[1] || splitParts[0]);
    const byteArrays = [];
    const sliceSize = 512;

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  };

  const handleExportBackup = async () => {
    if (!appState) return;
    toast.info("Assembling and sealing secure backup vault...", {
      style: { background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.1)" }
    });

    try {
      const profile = await db.getProfile();
      const pdfs = await db.getPDFs();
      const goals = await db.getGoals();
      const stats = await db.getStats();
      const reviews = await db.getNightReviews();

      // Convert profile pic blob to Base64
      let profilePicBase64: string | null = null;
      if (profile?.profile_picture_blob) {
        profilePicBase64 = await blobToBase64(profile.profile_picture_blob);
      }

      // Convert PDF blobs to Base64
      const serializedPDFs = [];
      for (const pdf of pdfs) {
        const base64 = await blobToBase64(pdf.pdf_blob);
        serializedPDFs.push({
          id: pdf.id,
          pdf_name: pdf.pdf_name,
          pdf_base64: base64,
          upload_date: pdf.upload_date,
          category: pdf.category
        });
      }

      const backupData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        appState: appState,
        profile: profile ? {
          name: profile.name,
          email: profile.email,
          profile_picture_base64: profilePicBase64,
          created_at: profile.created_at
        } : null,
        pdfs: serializedPDFs,
        goals: goals,
        reviews: reviews,
        stats: stats
      };

      // Create download trigger
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `inner-demon-backup-${todayKey()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      playSound("submit", appState);
      triggerHaptic("success", appState);
      toast.success("Sacred backup file successfully compiled and saved.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate system backup.");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backup = JSON.parse(event.target?.result as string);
        if (!backup.appState || !backup.version) {
          throw new Error("Invalid backup format.");
        }

        // 1. Wipe current system first
        await db.clearAll();

        // 2. Restore Profile
        if (backup.profile) {
          let picBlob: Blob | null = null;
          if (backup.profile.profile_picture_base64) {
            picBlob = base64ToBlob(backup.profile.profile_picture_base64, "image/jpeg");
          }
          const restoredProfile: UserProfile = {
            name: backup.profile.name,
            email: backup.profile.email,
            profile_picture_blob: picBlob,
            created_at: backup.profile.created_at || new Date().toISOString()
          };
          await db.saveProfile(restoredProfile);
        }

        // 3. Restore PDFs
        if (backup.pdfs && Array.isArray(backup.pdfs)) {
          for (const pdf of backup.pdfs) {
            const restoredPDF: UploadedPDF = {
              id: pdf.id,
              pdf_name: pdf.pdf_name,
              pdf_blob: base64ToBlob(pdf.pdf_base64, "application/pdf"),
              upload_date: pdf.upload_date || new Date().toISOString(),
              category: pdf.category || "study"
            };
            await db.savePDF(restoredPDF);
          }
        }

        // 4. Restore Goals
        if (backup.goals && Array.isArray(backup.goals)) {
          await db.saveGoals(backup.goals);
        }

        // 5. Restore Reviews
        if (backup.reviews && Array.isArray(backup.reviews)) {
          for (const rev of backup.reviews) {
            await db.saveNightReview(rev);
          }
        }

        // 6. Restore Stats
        if (backup.stats) {
          await db.saveStats(backup.stats);
        }

        // 7. Restore LocalStorage state
        localStorage.setItem("inner-demon-state-v4", JSON.stringify(backup.appState));

        toast.success("Consciousness restored! Reloading domain...", {
          style: { background: "#0A0A0A", border: "1px solid #00FF88", color: "#00FF88" }
        });

        setTimeout(() => {
          window.location.reload();
        }, 1500);

      } catch (err) {
        console.error(err);
        toast.error("Failed to parse file. The backup file is corrupted or invalid.");
      }
    };
    reader.readAsText(file);
  };

  const handleWipeData = async () => {
    if (wipeInput.trim().toUpperCase() !== "ABYSS WIPE") {
      toast.error("Verification keyword mismatch. The Abyss rejects your request.", {
        style: { background: "#0A0A0A", border: "1px solid #FF4444", color: "#FF4444" }
      });
      return;
    }

    try {
      // Clean IndexedDB
      await db.clearAll();
      // Clean LocalStorage
      localStorage.clear();
      
      toast.success("Mind wiped. Restructuring matrix...", {
        style: { background: "#0A0A0A", border: "1px solid #FF4444", color: "#FF4444" }
      });

      // Quick negative sweep chime
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 1.2);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1.2);
      } catch {}

      setTimeout(() => {
        window.location.href = "/";
      }, 1500);

    } catch (err) {
      console.error(err);
      toast.error("Purge operations failed. Reset system manual override required.");
    }
  };

  const triggerNightReviewTest = () => {
    if (!appState) return;
    playSound("click", appState);
    triggerHaptic("medium", appState);
    toast.info("Simulating 9:30 PM... Opening portal...", {
      style: { background: "#0A0A0A", border: "1px solid #FFD700", color: "#FFD700" }
    });
    // Dispatch event
    window.dispatchEvent(new CustomEvent("trigger-night-review"));
  };

  const todayKey = () => new Date().toISOString().slice(0, 10);

  if (!appState) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-pulse text-zinc-600 font-heading text-xs tracking-widest uppercase">
          Assembling profile...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-zinc-100 p-4 pb-24 max-w-md mx-auto space-y-5 relative overflow-hidden">
      
      {/* Background decoration sparks */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {[...Array(6)].map((_, i) => (
          <span
            key={i}
            className="float-ember absolute w-1 h-1 rounded-full bg-yellow-400"
            style={{
              left: `${15 + i * 15}%`,
              bottom: "0px",
              animationDelay: `${i * 0.9}s`,
              animationDuration: `${12 + (i % 2) * 4}s`
            }}
          />
        ))}
      </div>

      <header className="z-10 relative">
        <h1 className="text-xl font-heading font-black text-yellow-400 tracking-wider">
          SOUL COVENANT
        </h1>
        <p className="text-zinc-500 text-xs mt-1 uppercase tracking-widest leading-relaxed">
          Identity Profile & System Core Adjustments
        </p>
      </header>

      {/* 1. IDENTITY DISPLAY CARD */}
      <section className="glass rounded-2xl p-5 border-zinc-800/80 z-10 relative flex flex-col items-center text-center space-y-4">
        
        {/* Profile Pic with Glowing rotating border */}
        <div className="relative w-24 h-24">
          <div 
            className="absolute inset-0 rounded-full border border-dashed border-yellow-400/40"
            style={{ animation: "rotateGlow 25s linear infinite" }}
          />
          <div className="absolute inset-1.5 rounded-full overflow-hidden bg-zinc-950 flex items-center justify-center border border-zinc-800">
            {profilePicUrl ? (
              <img src={profilePicUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-zinc-600" />
            )}
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-base font-black font-heading tracking-wide uppercase text-zinc-200">
            {appState.name}
          </h2>
          <p className="text-xs text-zinc-500 font-medium lowercase">
            {appState.email}
          </p>
          <span className="inline-block text-[8px] font-heading font-bold text-yellow-400/80 border border-yellow-400/20 px-2 py-0.5 rounded-full bg-yellow-400/5 mt-1">
            MIND INITIATED: {creationDate || todayKey()}
          </span>
        </div>

        {/* Mini stats dashboard grid */}
        <div className="grid grid-cols-3 gap-2 w-full pt-2 border-t border-zinc-900/60">
          <div className="p-2 bg-black/35 rounded-xl text-center space-y-0.5">
            <span className="text-[7px] font-heading font-black text-zinc-500 tracking-wider uppercase block">CURRENT FORM</span>
            <span className="text-xs font-black font-heading text-purple-400 block truncate uppercase">
              F-{appState.form}
            </span>
          </div>

          <div className="p-2 bg-black/35 rounded-xl text-center space-y-0.5">
            <span className="text-[7px] font-heading font-black text-zinc-500 tracking-wider uppercase block">FLAME STREAK</span>
            <span className="text-xs font-black font-heading text-red-500 block flex items-center justify-center gap-0.5">
              <Flame className="w-3.5 h-3.5 fill-red-500 stroke-none" />
              {appState.streak} D
            </span>
          </div>

          <div className="p-2 bg-black/35 rounded-xl text-center space-y-0.5">
            <span className="text-[7px] font-heading font-black text-zinc-500 tracking-wider uppercase block">POWER CHARGE</span>
            <span className="text-xs font-black font-heading text-yellow-400 block flex items-center justify-center gap-0.5">
              <Zap className="w-3.5 h-3.5 fill-yellow-400 stroke-none" />
              {appState.power}%
            </span>
          </div>
        </div>
      </section>

      {/* 2. AUDIO & HAPTIC CONTROLS */}
      <section className="glass rounded-2xl p-5 border-zinc-800/80 z-10 relative space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-900/60 pb-2">
          <Settings2 className="w-4 h-4 text-zinc-500" />
          <h3 className="text-xs font-heading font-black tracking-widest text-zinc-400 uppercase">
            Haptic & Sound Config
          </h3>
        </div>

        <div className="space-y-3.5">
          {/* Sounds */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl border ${sound ? "bg-yellow-400/5 border-yellow-400/20 text-yellow-400" : "bg-zinc-950 border-zinc-900 text-zinc-600"}`}>
                {sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-300">Auditory Resonator</h4>
                <p className="text-[9px] text-zinc-500">Play feedback alerts on triggers</p>
              </div>
            </div>
            <button
              onClick={handleToggleSound}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors focus:outline-none flex items-center ${
                sound ? "bg-yellow-400 justify-end" : "bg-zinc-850 justify-start"
              }`}
            >
              <span className={`w-5 h-5 rounded-full bg-zinc-950 shadow-md ${sound ? "border border-yellow-500/10" : ""}`} />
            </button>
          </div>

          {/* Haptics */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl border ${haptic ? "bg-red-400/5 border-red-400/20 text-red-500" : "bg-zinc-950 border-zinc-900 text-zinc-600"}`}>
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-300">Haptic Transceiver</h4>
                <p className="text-[9px] text-zinc-500">Trigger physical clicks on keyframes</p>
              </div>
            </div>
            <button
              onClick={handleToggleHaptic}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors focus:outline-none flex items-center ${
                haptic ? "bg-red-500 justify-end" : "bg-zinc-850 justify-start"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-zinc-950 shadow-md" />
            </button>
          </div>

          {/* Notification Alert button */}
          <div className="border-t border-zinc-900/50 pt-3">
            <button
              onClick={askNotif}
              className={`haptic-bounce w-full h-10 rounded-xl font-heading font-black text-[10px] tracking-widest border transition-all flex items-center justify-center gap-1.5 ${
                notif 
                  ? "bg-zinc-950 border-zinc-900 text-zinc-500 pointer-events-none"
                  : "bg-black border-yellow-400/20 text-yellow-400 hover:border-yellow-400/40"
              }`}
            >
              {notif ? "DEMON NOTIFICATIONS ACTUATED" : "REQUEST NOTIFICATION CHANNELS"}
            </button>
          </div>
        </div>
      </section>

      {/* 3. AI DUAL-MODE API PORTAL */}
      <section className="glass rounded-2xl p-5 border-zinc-800/80 z-10 relative space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-900/60 pb-2">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-zinc-500" />
            <h3 className="text-xs font-heading font-black tracking-widest text-zinc-400 uppercase">
              Secret AI Gateways
            </h3>
          </div>
          <span className="text-[7px] font-heading font-black text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-900 uppercase">
            LOCAL-FIRST
          </span>
        </div>

        <p className="text-[9px] text-zinc-500 leading-normal uppercase">
          Leave blank to deploy the offline intelligence engine. Connect API keys to leverage online deep goal generation.
        </p>

        <div className="space-y-3.5">
          {/* OpenAI */}
          <div className="space-y-1">
            <label className="text-[8px] font-heading font-black text-zinc-500 tracking-wider uppercase block">
              OpenAI Secret Key
            </label>
            <div className="relative">
              <input
                type={showOpenAI ? "text" : "password"}
                placeholder="sk-or-..."
                value={openAIKey}
                onChange={(e) => setOpenAIKey(e.target.value)}
                className="w-full h-10 px-3 pr-10 bg-zinc-950 border border-zinc-900 rounded-xl outline-none text-xs focus:border-yellow-400/30 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowOpenAI(!showOpenAI)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showOpenAI ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Claude */}
          <div className="space-y-1">
            <label className="text-[8px] font-heading font-black text-zinc-500 tracking-wider uppercase block">
              Claude Anthropic Key
            </label>
            <div className="relative">
              <input
                type={showClaude ? "text" : "password"}
                placeholder="sk-ant-..."
                value={claudeKey}
                onChange={(e) => setClaudeKey(e.target.value)}
                className="w-full h-10 px-3 pr-10 bg-zinc-950 border border-zinc-900 rounded-xl outline-none text-xs focus:border-purple-400/30 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowClaude(!showClaude)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showClaude ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Update Button */}
          <button
            onClick={handleSaveKeys}
            className="haptic-bounce w-full h-10 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 border border-yellow-400/30 hover:border-yellow-400/60 text-yellow-400 font-heading font-black text-[10px] tracking-widest rounded-xl transition flex items-center justify-center gap-1.5"
          >
            UPDATE SECRET CODES
          </button>
        </div>
      </section>

      {/* 4. DATA ARCHIVE (EXPORT / IMPORT) */}
      <section className="glass rounded-2xl p-5 border-zinc-800/80 z-10 relative space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-900/60 pb-2">
          <Download className="w-4 h-4 text-zinc-500" />
          <h3 className="text-xs font-heading font-black tracking-widest text-zinc-400 uppercase">
            Account Archives
          </h3>
        </div>

        <p className="text-[9px] text-zinc-500 leading-normal uppercase">
          Back up your IndexedDB logs, stats, evolutionary ranks, and system files. Move data freely across sandbox devices.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {/* Export */}
          <button
            onClick={handleExportBackup}
            className="haptic-bounce h-12 bg-black border border-zinc-800 rounded-xl text-zinc-300 font-heading font-black text-[9px] tracking-widest flex flex-col items-center justify-center gap-1 hover:border-yellow-400/30 hover:text-yellow-400 transition"
          >
            <Download className="w-4 h-4" />
            EXPORT BACKUP
          </button>

          {/* Import */}
          <button
            onClick={handleImportClick}
            className="haptic-bounce h-12 bg-black border border-zinc-800 rounded-xl text-zinc-300 font-heading font-black text-[9px] tracking-widest flex flex-col items-center justify-center gap-1 hover:border-green-400/30 hover:text-green-400 transition"
          >
            <Upload className="w-4 h-4" />
            IMPORT BACKUP
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportBackup}
            className="hidden"
          />
        </div>
      </section>

      {/* 5. DANGER ZONE (SYSTEM PURGE & MANUAL TESTING) */}
      <section className="glass border-red-950/40 rounded-2xl p-5 z-10 relative space-y-4 shadow-[0_0_20px_rgba(255,0,0,0.02)]">
        <div className="flex items-center gap-2 border-b border-zinc-900/60 pb-2">
          <Skull className="w-4 h-4 text-red-500 animate-pulse" />
          <h3 className="text-xs font-heading font-black tracking-widest text-red-500 uppercase">
            Void Control Panels
          </h3>
        </div>

        <div className="space-y-3">
          {/* Manual test Night review */}
          <button
            onClick={triggerNightReviewTest}
            className="haptic-bounce w-full h-11 bg-zinc-950 border border-zinc-800 hover:border-yellow-500/25 text-zinc-300 font-heading font-black text-[10px] tracking-widest rounded-xl transition flex items-center justify-center gap-1.5"
          >
            🌑 RUN NIGHT ACCOUNTABILITY REPORT
          </button>

          {/* Wipe Confirmation trigger */}
          {!showWipeConfirm ? (
            <button
              onClick={() => {
                if (appState) playSound("click", appState);
                setShowWipeConfirm(true);
              }}
              className="haptic-bounce w-full h-11 bg-red-950/20 border border-red-500/20 hover:bg-red-950/40 text-red-400 font-heading font-black text-[10px] tracking-widest rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              PURGE MIND COVENANT (WIPE ALL)
            </button>
          ) : (
            <div className="space-y-3 p-3 bg-red-950/15 border border-red-500/30 rounded-xl animate-slide-up">
              <div className="flex items-start gap-2.5 text-[10px] text-red-400 leading-normal uppercase">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 animate-bounce" />
                <div>
                  <span className="font-black">CRITICAL WARNING:</span> Purging will permanently decimate your goals, streak history, uploaded study/diet files, and daily battle records. This action cannot be reversed!
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-heading font-black text-red-500/80 tracking-wider uppercase block">
                  Verify purge: type <span className="text-red-400 font-bold">ABYSS WIPE</span> below
                </label>
                <input
                  type="text"
                  placeholder="ABYSS WIPE"
                  value={wipeInput}
                  onChange={(e) => setWipeInput(e.target.value)}
                  className="w-full h-10 px-3 bg-zinc-950 border border-red-500/20 rounded-xl outline-none text-xs text-red-400 font-heading font-bold placeholder-red-900/40 tracking-wider"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowWipeConfirm(false);
                    setWipeInput("");
                  }}
                  className="flex-1 h-9 bg-zinc-900 border border-zinc-800 text-zinc-400 font-heading font-black text-[9px] tracking-widest rounded-lg transition"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleWipeData}
                  className="flex-[2] h-9 bg-red-600 text-zinc-100 font-heading font-black text-[9px] tracking-widest rounded-lg transition shadow-[0_0_15px_rgba(220,38,38,0.25)] hover:bg-red-500"
                >
                  CONFIRM PERMANENT WIPEOUT
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
