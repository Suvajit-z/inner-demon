import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  ensureTodayTasks,
  formNames,
  getState,
  saveState,
  todayKey,
  handleTaskToggle,
  timerFor,
  playSound,
  triggerHaptic,
  generateFallbackTasks
} from "@/lib/app-state";
import { DemonAvatar } from "@/components/demon-avatars";
import { motion, AnimatePresence } from "@/lib/framer-motion-shim";
import {
  Flame,
  Play,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  TrendingUp,
  Clock,
  ChevronRight,
  BookOpen,
  Award,
  Heart,
  Hammer,
  HelpCircle
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: DashboardPage });

function EvolutionCanvas({ step }: { step: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      life: number;
      decay: number;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const spawnEmber = (x: number, y: number, burst = false) => {
      const colors = ["#FFD700", "#FF4444", "#9333EA", "#FFA500"];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const angle = Math.random() * Math.PI * 2;
      const speed = burst ? Math.random() * 12 + 4 : Math.random() * 2 + 0.5;
      
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed + (burst ? 0 : (Math.random() - 0.5) * 0.5),
        vy: burst ? Math.sin(angle) * speed : -speed - Math.random() * 1.5,
        size: Math.random() * (burst ? 4 : 3) + 1,
        color,
        alpha: 1,
        life: 1,
        decay: burst ? Math.random() * 0.02 + 0.01 : Math.random() * 0.015 + 0.005
      });
    };

    // Burst trigger
    if (step === 2) {
      for (let i = 0; i < 80; i++) {
        spawnEmber(canvas.width / 2, canvas.height / 2, true);
      }
    }

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Continuous upward embers in step 1 or 3
      if (step === 1 && Math.random() < 0.3) {
        spawnEmber(canvas.width / 2 + (Math.random() - 0.5) * 80, canvas.height / 2 + (Math.random() - 0.5) * 80);
      } else if (step >= 3 && Math.random() < 0.2) {
        spawnEmber(Math.random() * canvas.width, canvas.height + 10);
      }

      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        if (step === 2) {
          // Add friction to burst particles
          p.vx *= 0.95;
          p.vy *= 0.95;
        }
        p.life -= p.decay;
        p.alpha = Math.max(0, p.life);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = p.size * 2;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.life <= 0) {
          particles.splice(idx, 1);
        }
      });

      animationId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [step]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10 w-full h-full" />;
}

function DashboardPage() {
  const [renderCount, setRenderCount] = useState(0);
  const state = ensureTodayTasks(getState());
  const date = todayKey();
  const tasks = state.tasksByDate[date] || [];

  // Evolution animation states
  const [evolving, setEvolving] = useState(false);
  const [evolutionStep, setEvolutionStep] = useState(0); // 0: dark, 1: glow/shake, 2: explode, 3: reveal, 4: reset
  const [oldFormName, setOldFormName] = useState("");
  const [newFormName, setNewFormName] = useState("");

  // Timer states
  const [activeTimerTask, setActiveTimerTask] = useState<any | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [initialDuration, setInitialDuration] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if power reached 100 to trigger evolution on load or toggle
  useEffect(() => {
    if (state.power >= 100 && !evolving) {
      triggerEvolution();
    }
  }, [state.power]);

  const forceRegen = () => {
    triggerHaptic("medium", state);
    state.tasksByDate[date] = generateFallbackTasks(state.goals);
    saveState(state);
    setRenderCount(c => c + 1);
    toast.success("Missions reforged by AI.");
  };

  const handleToggle = (taskId: string) => {
    const updatedState = handleTaskToggle(taskId, state);
    saveState(updatedState);
    setRenderCount(c => c + 1);
  };

  // Evolution trigger sequence
  const triggerEvolution = () => {
    if (state.form >= 10) {
      toast.success("You have achieved the ultimate form. You are an Abyss Monarch Legend!");
      return;
    }
    const currentFormName = formNames[state.form - 1];
    const nextFormName = formNames[state.form];
    setOldFormName(currentFormName);
    setNewFormName(nextFormName);
    
    setEvolving(true);
    setEvolutionStep(0);
    playSound("evolution", state);
    triggerHaptic("heavy", state);

    // Timeline:
    // 0.5s screen goes dark
    setTimeout(() => {
      setEvolutionStep(1); // shaking + intense glow
      triggerHaptic("heavy", state);
    }, 1000);

    setTimeout(() => {
      setEvolutionStep(2); // particle explosion
      triggerHaptic("success", state);
    }, 2500);

    setTimeout(() => {
      setEvolutionStep(3); // reveal new form
      state.form = Math.min(10, state.form + 1);
      state.power = 1; // Power resets to 1
      saveState(state);
    }, 3800);

    setTimeout(() => {
      setEvolving(false);
      setEvolutionStep(0);
      setRenderCount(c => c + 1);
      toast.success(`Evolved to ${nextFormName}!`);
    }, 6000);
  };

  // Timer controls
  const startTimer = (task: any) => {
    playSound("click", state);
    triggerHaptic("light", state);
    setActiveTimerTask(task);
    const duration = timerFor(task.category);
    setTimeLeft(duration);
    setInitialDuration(duration);
    setTimerRunning(true);
  };

  useEffect(() => {
    if (timerRunning && activeTimerTask) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerRunning, activeTimerTask]);

  const handleTimerComplete = () => {
    setTimerRunning(false);
    playSound("complete", state);
    triggerHaptic("success", state);
    
    // Trigger local push notification reminder
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("⚔️ Mission Time Complete!", {
        body: `Time is up for: ${activeTimerTask.text}. Report your success!`,
        icon: "/favicon.ico"
      });
    }

    toast.success("Time complete! Mark this mission accomplished.");
    // Auto-toggle completion
    if (!activeTimerTask.completed) {
      handleToggle(activeTimerTask.id);
    }
    setActiveTimerTask(null);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "study":
        return <BookOpen className="w-5 h-5 text-yellow-400" />;
      case "health":
        return <Heart className="w-5 h-5 text-red-500" />;
      case "career":
        return <Award className="w-5 h-5 text-orange-400" />;
      case "skill":
        return <Hammer className="w-5 h-5 text-purple-400" />;
      default:
        return <HelpCircle className="w-5 h-5 text-zinc-400" />;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // SVG ring variables
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = initialDuration > 0 ? circumference - (timeLeft / initialDuration) * circumference : 0;

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-zinc-100 p-4 pb-24 max-w-md mx-auto space-y-5 relative overflow-hidden">
      {/* Floating Ember sparks in background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {[...Array(15)].map((_, i) => (
          <span
            key={i}
            className="float-ember absolute w-1 h-1 rounded-full bg-red-500"
            style={{
              left: `${5 + i * 6.5}%`,
              bottom: "0px",
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${8 + (i % 3) * 2}s`
            }}
          />
        ))}
      </div>

      {/* Main Header */}
      <header className="z-10 flex items-center justify-between">
        <h1 className="text-xl font-black font-heading tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500">
          INNER DEMON
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 glass px-3 py-1 rounded-full text-xs font-semibold text-yellow-400">
            <Flame className="w-3.5 h-3.5 fill-yellow-400 animate-pulse" />
            <span>{state.streak} DAY STREAK</span>
          </div>
        </div>
      </header>

      {/* 1. POWER LEVEL CARD */}
      <section className="glass-gold rounded-3xl p-5 relative overflow-hidden z-10">
        {/* Glow effect back */}
        <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-yellow-400/10 blur-3xl pointer-events-none" />
        
        <p className="text-[10px] font-heading font-bold text-yellow-400/70 tracking-widest uppercase mb-1">
          CURRENT SOUL ENERGY
        </p>
        
        <div className="flex items-baseline justify-between">
          <h2 className="text-7xl font-extrabold font-heading text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 tracking-tighter filter drop-shadow-[0_0_12px_rgba(255,215,0,0.25)]">
            {state.power}
            <span className="text-lg text-zinc-500 font-semibold tracking-normal font-sans ml-1">/100</span>
          </h2>
          <div className="text-right">
            <span className="text-[10px] font-heading text-zinc-400 tracking-wider block">EVOLUTION PROGRESS</span>
            <span className="text-xs font-heading font-bold text-yellow-400 block animate-pulse">
              +{100 - state.power} TO EVOLVE
            </span>
          </div>
        </div>

        {/* Custom Progress bar filled with particles */}
        <div className="mt-4 h-5 rounded-full bg-zinc-950/80 border border-zinc-800 p-0.5 overflow-hidden relative">
          <div
            className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 transition-all duration-500 ease-out shadow-[0_0_12px_rgba(255,68,68,0.4)] flex items-center justify-end pr-2 overflow-hidden relative"
            style={{ width: `${Math.max(4, state.power)}%` }}
          >
            {/* Inner spark particles */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15),transparent_80%)] animate-pulse" />
          </div>
        </div>
      </section>

      {/* 2. DEMON FORM CARD */}
      <section className="glass rounded-3xl p-4 flex items-center gap-4 relative z-10 border-zinc-800 hover:border-zinc-700">
        <div className="w-24 h-24 flex-shrink-0 bg-black/40 rounded-2xl border border-zinc-800/80 flex items-center justify-center p-1">
          <DemonAvatar form={state.form} className="w-full h-full text-red-500 filter drop-shadow-[0_0_10px_rgba(255,68,68,0.15)]" />
        </div>
        <div className="space-y-1">
          <span className="text-[9px] font-heading font-bold text-zinc-500 tracking-widest uppercase">
            TIER {state.form} LEVEL
          </span>
          <h3 className="text-lg font-black font-heading tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-red-500">
            {formNames[state.form - 1]}
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed font-medium">
            Your demon breathes slowly. Evolve to unlock next mystical forms.
          </p>
        </div>
      </section>

      {/* 3. TODAY'S MISSIONS */}
      <section className="space-y-3 z-10 relative">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-heading font-bold tracking-[0.2em] text-yellow-400 uppercase">
            DAILY MISSIONS
          </h4>
          <button 
            onClick={forceRegen}
            className="text-[10px] font-heading font-bold text-zinc-500 hover:text-yellow-400 transition-all border border-zinc-800 hover:border-yellow-400/30 px-3 py-1 rounded-lg haptic-bounce"
          >
            REFORGE MISSIONS
          </button>
        </div>

        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center border-dashed border-zinc-800">
              <Sparkles className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
                No active daily battles. Upload your syllabus or add custom plans in the 🎯 MISSIONS portal to generate AI daily tasks!
              </p>
            </div>
          ) : (
            tasks.map(t => (
              <article
                key={t.id}
                className={`glass rounded-2xl p-4 transition-all duration-300 relative overflow-hidden flex items-center justify-between border ${
                  t.completed
                    ? "border-yellow-400/30 bg-yellow-400/[0.02] shadow-[0_0_15px_rgba(255,215,0,0.03)]"
                    : "border-zinc-800 hover:-translate-y-1 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center gap-3.5 pr-4 flex-1">
                  {/* Custom 32px checkbox */}
                  <button
                    onClick={() => handleToggle(t.id)}
                    className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all duration-300 haptic-bounce ${
                      t.completed
                        ? "bg-yellow-400 border-yellow-400 text-black scale-100 shadow-[0_0_10px_rgba(255,215,0,0.4)]"
                        : "border-zinc-700 hover:border-yellow-400/60 bg-transparent scale-100"
                    }`}
                  >
                    {t.completed && <Check className="w-5 h-5 stroke-[3.5]" />}
                  </button>

                  <div className="space-y-1 flex-1">
                    <p className={`text-sm font-bold leading-snug transition-all ${t.completed ? "text-zinc-500 line-through" : "text-zinc-100"}`}>
                      {t.text}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="flex-shrink-0">{getCategoryIcon(t.category)}</span>
                      <span className="text-[10px] text-zinc-500 font-semibold tracking-wide uppercase flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-600" />
                        {t.duration} MINS
                      </span>
                    </div>
                  </div>
                </div>

                {!t.completed && (
                  <button
                    onClick={() => startTimer(t)}
                    className="h-10 px-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-yellow-400/40 text-yellow-400 text-xs font-heading font-bold tracking-wider hover:bg-zinc-950 transition-all flex items-center gap-1.5 haptic-bounce shadow-md"
                  >
                    <Play className="w-3.5 h-3.5 fill-yellow-400 stroke-none" />
                    TIMER
                  </button>
                )}
              </article>
            ))
          )}
        </div>
      </section>

      {/* 4. MISSION TIMER MODAL */}
      {activeTimerTask && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6 backdrop-blur-md transition-all">
          <div className="w-full max-w-sm glass rounded-3xl p-6 border-zinc-800 text-center space-y-6 slide-up-enter relative overflow-hidden">
            {/* Background Red glowing eye aura */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-red-600/5 blur-3xl pointer-events-none" />
            
            <div>
              <span className="text-[9px] font-heading font-bold text-yellow-400 tracking-widest uppercase">
                ACTIVE DAILY BATTLE
              </span>
              <h3 className="text-lg font-bold font-sans mt-2 max-w-xs mx-auto text-zinc-100">
                {activeTimerTask.text}
              </h3>
            </div>

            {/* Circular Progress Ring */}
            <div className="relative w-52 h-52 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background path */}
                <circle
                  cx="104"
                  cy="104"
                  r={radius}
                  className="stroke-zinc-900 fill-none"
                  strokeWidth="8"
                />
                {/* Glowing Active Ring */}
                <circle
                  cx="104"
                  cy="104"
                  r={radius}
                  className="stroke-yellow-400 fill-none transition-all duration-1000 ease-linear"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{
                    filter: "drop-shadow(0 0 6px rgba(255, 215, 0, 0.45))",
                  }}
                />
              </svg>

              {/* Large Timer Countdown Text */}
              <div className="absolute flex flex-col items-center">
                <span className="text-5xl font-black font-heading tracking-wider text-zinc-100">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-[10px] font-heading font-bold text-zinc-500 tracking-wider mt-1 uppercase">
                  REMAINING
                </span>
              </div>
            </div>

            {/* Controls Panel */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className={`h-12 rounded-xl text-xs font-heading font-bold tracking-wider transition-all haptic-bounce ${
                  timerRunning
                    ? "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-zinc-100"
                    : "bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black"
                }`}
              >
                {timerRunning ? "PAUSE" : "RESUME"}
              </button>

              <button
                onClick={handleTimerComplete}
                className="h-12 rounded-xl bg-green-500 text-black font-black text-xs font-heading tracking-wider hover:bg-green-400 transition-all haptic-bounce"
              >
                COMPLETE
              </button>

              <button
                onClick={() => {
                  playSound("click", state);
                  triggerHaptic("medium", state);
                  setActiveTimerTask(null);
                }}
                className="h-12 rounded-xl bg-zinc-950 border border-red-950 text-red-500 text-xs font-heading font-bold tracking-wider hover:bg-red-950/20 transition-all haptic-bounce"
              >
                ABANDON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CINEMATIC EVOLUTION TRIGGER MODAL */}
      <AnimatePresence>
        {evolving && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center p-6 text-center select-none overflow-hidden"
          >
            {/* Dynamic Canvas Particles */}
            <EvolutionCanvas step={evolutionStep} />

            {/* Glowing red or gold central light source */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: evolutionStep === 1 ? 1.25 : evolutionStep === 2 ? 2.5 : 1,
                opacity: evolutionStep >= 1 ? [0.4, 0.8, 0.4] : 0.2,
              }}
              transition={{
                scale: { duration: 1.5, ease: "easeOut" },
                opacity: { repeat: Infinity, duration: 2, ease: "easeInOut" }
              }}
              className={`absolute w-72 h-72 rounded-full filter blur-3xl pointer-events-none z-0 transition-colors duration-[1.5s] ${
                evolutionStep >= 2 ? "bg-yellow-400/20" : "bg-red-600/10"
              }`}
            />

            {/* Screen Shake & Content container */}
            <motion.div
              animate={evolutionStep === 1 ? {
                x: [0, -3, 3, -3, 3, 0],
                y: [0, 3, -3, 3, -3, 0]
              } : evolutionStep === 2 ? {
                x: [0, -6, 6, -6, 6, -3, 3, 0],
                y: [0, 6, -6, 6, -6, 3, -3, 0]
              } : {}}
              transition={{
                repeat: evolutionStep >= 1 ? Infinity : 0,
                duration: evolutionStep === 2 ? 0.15 : 0.25,
                ease: "linear"
              }}
              className="w-full max-w-sm space-y-8 z-20 relative"
            >
              {/* Header Text Progression */}
              <AnimatePresence mode="wait">
                {evolutionStep < 3 ? (
                  <motion.div
                    key="pre-reveal"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="space-y-4"
                  >
                    <span className="text-[10px] font-heading font-black text-yellow-400 tracking-[0.4em] uppercase animate-pulse block">
                      CRITICAL QUANTUM ALIGNMENT
                    </span>
                    <h2 className="text-3xl font-black font-heading tracking-widest text-zinc-300">
                      {evolutionStep === 1 ? "DEVOURING SOUL ENERGY" : "AWAKENING THE DEMON"}
                    </h2>
                  </motion.div>
                ) : (
                  <motion.div
                    key="post-reveal"
                    initial={{ opacity: 0, scale: 0.9, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 120 }}
                    className="space-y-2"
                  >
                    <span className="text-[10px] font-heading font-black text-green-400 tracking-[0.4em] uppercase block">
                      ASCENSION SUCCESSFUL
                    </span>
                    <h2 className="text-4xl font-black font-heading tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 filter drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]">
                      EVOLUTION COMPLETE
                    </h2>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Glowing Morphing Avatar */}
              <motion.div
                initial={{ scale: 0.2, rotate: -45, opacity: 0 }}
                animate={{
                  scale: evolutionStep === 1 ? 1.05 : evolutionStep === 2 ? 1.25 : 1,
                  rotate: evolutionStep === 1 ? [-2, 2, -2] : evolutionStep === 2 ? [-5, 5, -5] : 0,
                  opacity: 1
                }}
                transition={evolutionStep >= 3 ? {
                  type: "spring",
                  stiffness: 100,
                  damping: 10
                } : {
                  rotate: { repeat: Infinity, duration: 0.5, ease: "easeInOut" },
                  scale: { duration: 0.5 }
                }}
                className="relative w-64 h-64 mx-auto flex items-center justify-center animate-pulse"
              >
                {/* Aura rings */}
                <AnimatePresence>
                  {evolutionStep >= 1 && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.4, 0.1] }}
                      exit={{ opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className={`absolute inset-0 rounded-full filter blur-xl ${
                        evolutionStep >= 2 ? "bg-yellow-400/20" : "bg-red-600/20"
                      }`}
                    />
                  )}
                </AnimatePresence>

                <div className="w-full h-full relative z-10 flex items-center justify-center">
                  <DemonAvatar
                    form={evolutionStep >= 3 ? state.form + 1 : state.form}
                    className={`w-full h-full transition-all duration-700 ${
                      evolutionStep === 1 ? "drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]" :
                      evolutionStep === 2 ? "drop-shadow-[0_0_35px_rgba(234,179,8,0.85)] scale-110" :
                      "drop-shadow-[0_0_15px_rgba(147,51,234,0.3)]"
                    }`}
                  />
                </div>
              </motion.div>

              {/* Status and Action Panel */}
              <AnimatePresence mode="wait">
                {evolutionStep >= 3 ? (
                  <motion.div
                    key="revealed-stats"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="space-y-4"
                  >
                    <div>
                      <span className="text-[10px] font-heading font-black text-zinc-500 tracking-widest uppercase block">
                        NEW TIER UNLOCKED
                      </span>
                      <h3 className="text-2xl font-black font-heading tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-red-500 mt-1 uppercase">
                        {newFormName}
                      </h3>
                    </div>
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: [0.9, 1.03, 0.9] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                      className="p-3.5 glass rounded-xl border border-yellow-500/20 max-w-xs mx-auto text-xs font-semibold text-yellow-400 tracking-wider"
                    >
                      ⚡ SOUL ENERGY RESET TO 1 / 100
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="ascending-stats"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs font-heading font-bold text-zinc-500 tracking-widest uppercase block"
                  >
                    {oldFormName} DEVOURS ENERGY...
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}