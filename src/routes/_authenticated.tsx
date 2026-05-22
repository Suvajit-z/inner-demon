import { Outlet, createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/bottom-nav";
import { useEffect, useState } from "react";
import { getState, saveState, todayKey, playSound, triggerHaptic, formNames } from "@/lib/app-state";
import { db, NightReview } from "@/lib/db";
import { ScrollText, Flame, Zap, Check, ArrowRight, ShieldAlert, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated")({ component: Shell });

function Shell() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Stats & Emoji, 2: Written Report, 3: Cinematic Success
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [mentalState, setMentalState] = useState<number | null>(null);
  const [daySummary, setDaySummary] = useState("");
  const [biggestWin, setBiggestWin] = useState("");
  const [biggestFailure, setBiggestFailure] = useState("");
  const [tomorrowFocus, setTomorrowFocus] = useState("");
  
  const [streakMaintained, setStreakMaintained] = useState(false);
  const [totalTasksToday, setTotalTasksToday] = useState(5);
  const [activeFormName, setActiveFormName] = useState("");

  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Connection reestablished. Soul link sync complete.", {
        style: { background: "#0A0A0A", border: "1px solid #00FF88", color: "#00FF88" }
      });
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Link dropped. Consciousness secured offline in browser sandbox.", {
        style: { background: "#0A0A0A", border: "1px solid #FFA500", color: "#FFA500" }
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const checkReviewAndHour = async () => {
    try {
      const state = getState();
      const reviews = await db.getNightReviews();
      const today = todayKey();
      const alreadySubmitted = reviews.some((r) => r.date === today);

      if (alreadySubmitted) {
        setOpen(false);
        return;
      }

      // Check if current time is 9:30 PM (21:30) or later
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      if (hours > 21 || (hours === 21 && minutes >= 30)) {
        initReviewData();
        setOpen(true);
      }
    } catch (err) {
      console.error("Failed to check night review status:", err);
    }
  };

  const initReviewData = () => {
    const state = getState();
    const today = todayKey();
    const todayTasks = state.tasksByDate[today] || [];
    
    setTotalTasksToday(todayTasks.length > 0 ? todayTasks.length : 5);
    // Count how many tasks are completed in state
    const completedCount = todayTasks.filter((t) => t.completed).length;
    setTasksCompleted(completedCount);
    setActiveFormName(formNames[state.form - 1]);
    
    // Reset form fields
    setStep(1);
    setMentalState(null);
    setDaySummary("");
    setBiggestWin("");
    setBiggestFailure("");
    setTomorrowFocus("");
  };

  useEffect(() => {
    // Initial check
    checkReviewAndHour();

    // Check periodically every minute
    const interval = setInterval(checkReviewAndHour, 60000);

    // Custom event listener for manual testing
    const handleManualTrigger = () => {
      initReviewData();
      setOpen(true);
    };

    window.addEventListener("trigger-night-review", handleManualTrigger);

    return () => {
      clearInterval(interval);
      window.removeEventListener("trigger-night-review", handleManualTrigger);
    };
  }, []);

  // Prevent background scroll and intercept ESC key when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          toast.warning("The Night Review portal is active. You must complete or skip the report to proceed.", {
            style: { background: "#0A0A0A", border: "1px solid #FF4444", color: "#FF4444" }
          });
        }
      };
      
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "unset";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [open]);

  const handleNextStep = () => {
    if (mentalState === null) {
      toast.error("You must register your State of Mind before proceeding.", {
        style: { background: "#0A0A0A", border: "1px solid #FF4444", color: "#FF4444" }
      });
      return;
    }
    const state = getState();
    playSound("click", state);
    triggerHaptic("light", state);
    setStep(2);
  };

  const handleSkip = () => {
    const state = getState();
    playSound("click", state);
    triggerHaptic("medium", state);
    setOpen(false);
    toast.info("Night Review skipped. Return to battle.", {
      style: { background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.15)", color: "#FFFFFF" }
    });
  };

  const handleSubmitReview = async () => {
    if (!daySummary.trim() || !biggestWin.trim() || !biggestFailure.trim() || !tomorrowFocus.trim()) {
      toast.error("Please fill all written battle coordinates before filing.", {
        style: { background: "#0A0A0A", border: "1px solid #FF4444", color: "#FF4444" }
      });
      return;
    }

    try {
      const state = getState();
      const today = todayKey();

      const newReview: NightReview = {
        date: today,
        tasks_completed: tasksCompleted,
        day_summary: daySummary,
        biggest_win: biggestWin,
        biggest_failure: biggestFailure,
        mental_state: mentalState || 3,
        tomorrow_focus: tomorrowFocus,
        created_at: new Date().toISOString()
      };

      // Save to IndexedDB
      await db.saveNightReview(newReview);

      // Perform maintenance updates
      // +3 Power for filing review
      const previousPower = state.power;
      state.power = Math.min(100, state.power + 3);

      // Check streak mechanics:
      // If completed tasks represent >= 50% of today's tasks (or at least 2 tasks if no tasks set), we extend/preserve the streak
      const threshold = Math.max(1, Math.ceil(totalTasksToday * 0.5));
      const passedWorkload = tasksCompleted >= threshold;

      let streakUpdated = false;
      if (state.last_active_date !== today) {
        if (passedWorkload) {
          state.streak += 1;
          setStreakMaintained(true);
          streakUpdated = true;
        } else {
          // If they didn't do enough tasks, we preserve it if they still filed review, or keep the streak.
          // Let's say we preserve their current streak, but they don't increment it.
          setStreakMaintained(false);
        }
      } else {
        // Already active today, streak is maintained
        setStreakMaintained(state.streak > 0);
      }

      state.last_active_date = today;
      saveState(state);

      // Sounds & Haptics
      playSound("submit", state);
      triggerHaptic("success", state);

      // Transition to cinematic success
      setStep(3);
    } catch (err) {
      console.error("Failed to save night review:", err);
      toast.error("Database connection failure. Could not file report.");
    }
  };

  const getEmojiConfig = (val: number) => {
    switch (val) {
      case 1: return { char: "😞", label: "Gloom" };
      case 2: return { char: "😐", label: "Neutral" };
      case 3: return { char: "😊", label: "Gains" };
      case 4: return { char: "😄", label: "Slayer" };
      case 5: return { char: "😁", label: "Monarch" };
      default: return { char: "😐", label: "Neutral" };
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 pb-24 max-w-md mx-auto relative">
      {/* Offline Sandbox Banner */}
      {!isOnline && (
        <div className="bg-gradient-to-r from-zinc-950 via-orange-950/20 to-zinc-950 border-b border-orange-500/20 px-4 py-2 text-center text-[10px] font-heading font-black tracking-widest text-orange-400 flex items-center justify-center gap-2 animate-pulse relative z-50">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_#FFA500]" />
          OFFLINE SANDBOX MODE — ROUTINE METRICS SECURED LOCALLY
        </div>
      )}
      <Outlet />
      
      {/* Hide bottom navigation strictly when the Night Review overlay is blocking the screen */}
      {!open && <BottomNav />}

      {open && (
        <div className="fixed inset-0 bg-[#020202]/95 backdrop-blur-lg z-50 overflow-y-auto flex items-center justify-center p-4">
          {/* Animated Background Sparks */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {[...Array(8)].map((_, i) => (
              <span
                key={i}
                className="float-ember absolute w-1 h-1 rounded-full bg-red-500"
                style={{
                  left: `${10 + i * 12}%`,
                  bottom: "0px",
                  animationDelay: `${i * 0.7}s`,
                  animationDuration: `${8 + (i % 3) * 3}s`
                }}
              />
            ))}
          </div>

          <div className="w-full max-w-sm glass border-[#8B0000]/40 rounded-3xl p-6 relative z-10 shadow-[0_0_60px_rgba(139,0,0,0.15)] space-y-5 animate-slide-up">
            
            {/* STAGE HEADER */}
            <div className="text-center space-y-1">
              <div className="inline-flex p-2 rounded-full bg-red-950/40 border border-red-500/20 text-red-500 animate-pulse">
                <ScrollText className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black font-heading text-yellow-400 tracking-widest uppercase">
                🌑 Night Review
              </h2>
              <p className="text-[10px] text-zinc-500 tracking-widest uppercase">
                File Battle Report • Hour of Accountability
              </p>
            </div>

            {/* STEP 1: CONQUERED TASKS & STATE OF MIND */}
            {step === 1 && (
              <div className="space-y-5">
                {/* Tasks Completed Slider */}
                <div className="space-y-2.5 glass p-4 rounded-2xl border-zinc-800/80">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-heading font-black text-zinc-400 tracking-wider uppercase">
                      Missions Conquered
                    </span>
                    <span className="text-xs font-heading font-bold text-yellow-400">
                      {tasksCompleted} / {totalTasksToday}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max={totalTasksToday}
                    value={tasksCompleted}
                    onChange={(e) => {
                      setTasksCompleted(parseInt(e.target.value));
                      const s = getState();
                      triggerHaptic("light", s);
                    }}
                    className="w-full accent-yellow-400 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] font-bold text-zinc-600">
                    <span>0 SECURED</span>
                    <span>ALL CONQUERED</span>
                  </div>
                </div>

                {/* Grayscale to Gold Emoji Selector */}
                <div className="space-y-3 glass p-4 rounded-2xl border-zinc-800/80">
                  <span className="text-[10px] font-heading font-black text-zinc-400 tracking-wider uppercase block">
                    State of Mind (Battle Status)
                  </span>

                  <div className="grid grid-cols-5 gap-2 pt-1">
                    {[1, 2, 3, 4, 5].map((val) => {
                      const active = mentalState === val;
                      const config = getEmojiConfig(val);
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            setMentalState(val);
                            const s = getState();
                            playSound("click", s);
                            triggerHaptic("light", s);
                          }}
                          className={`flex flex-col items-center p-2 rounded-xl transition-all duration-300 active:scale-95 ${
                            active
                              ? "bg-yellow-400/10 border border-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.25)]"
                              : "bg-black/30 border border-transparent grayscale opacity-50 hover:opacity-80 hover:grayscale-[50%]"
                          }`}
                        >
                          <span className="text-2xl mb-1">{config.char}</span>
                          <span className="text-[7px] font-heading font-bold text-zinc-500 uppercase tracking-widest leading-none">
                            {config.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Progress Button */}
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="haptic-bounce w-full h-11 bg-gradient-to-r from-yellow-400 to-amber-500 text-zinc-950 font-heading font-black text-xs tracking-widest rounded-xl flex items-center justify-center gap-1.5 shadow-[0_4px_20px_rgba(255,215,0,0.2)]"
                >
                  PROCEED TO WRITTEN LOG
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: WRITTEN REPORTS */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                  
                  {/* Summary */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-heading font-black text-zinc-500 tracking-wider uppercase block">
                      Day Summary (Core learnings)
                    </label>
                    <textarea
                      placeholder="What did you learn today in your mental battles?"
                      value={daySummary}
                      onChange={(e) => setDaySummary(e.target.value)}
                      rows={2}
                      className="w-full bg-black/40 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/40 transition"
                    />
                  </div>

                  {/* Win */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-heading font-black text-zinc-500 tracking-wider uppercase block">
                      Biggest Win (Main Victory)
                    </label>
                    <textarea
                      placeholder="Identify your single greatest victory today..."
                      value={biggestWin}
                      onChange={(e) => setBiggestWin(e.target.value)}
                      rows={2}
                      className="w-full bg-black/40 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-yellow-400/40 focus:ring-1 focus:ring-yellow-400/40 transition"
                    />
                  </div>

                  {/* Failure */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-heading font-black text-zinc-500 tracking-wider uppercase block">
                      Biggest Failure / Blocker
                    </label>
                    <textarea
                      placeholder="What held you back or breached your discipline?"
                      value={biggestFailure}
                      onChange={(e) => setBiggestFailure(e.target.value)}
                      rows={2}
                      className="w-full bg-black/40 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/40 transition"
                    />
                  </div>

                  {/* Tomorrow Focus */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-heading font-black text-zinc-500 tracking-wider uppercase block">
                      Tomorrow's Target
                    </label>
                    <textarea
                      placeholder="What is your absolute primary target for tomorrow?"
                      value={tomorrowFocus}
                      onChange={(e) => setTomorrowFocus(e.target.value)}
                      rows={2}
                      className="w-full bg-black/40 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/40 transition"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const s = getState();
                      playSound("click", s);
                      setStep(1);
                    }}
                    className="haptic-bounce flex-1 h-11 border border-zinc-800 text-zinc-400 font-heading font-black text-xs tracking-widest rounded-xl hover:bg-zinc-950 transition"
                  >
                    BACK
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitReview}
                    className="haptic-bounce flex-[2] h-11 bg-gradient-to-r from-red-600 to-amber-600 text-zinc-100 font-heading font-black text-xs tracking-widest rounded-xl flex items-center justify-center gap-1.5 shadow-[0_4px_25px_rgba(139,0,0,0.3)] hover:from-red-500 hover:to-amber-500 transition"
                  >
                    SEAL NIGHT REVIEW
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: CINEMATIC SUCCESS RITUAL */}
            {step === 3 && (
              <div className="space-y-5 text-center animate-fade-in py-2">
                <div className="inline-flex p-3 rounded-full bg-yellow-400/10 border border-yellow-400/40 text-yellow-400 shadow-[0_0_20px_rgba(255,215,0,0.3)] mb-1">
                  <Sparkles className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
                </div>

                <div className="space-y-1">
                  <h3 className="text-md font-black font-heading text-yellow-400 tracking-widest uppercase">
                    Review Concluded
                  </h3>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                    Your coordinates are sealed in the Abyss.
                  </p>
                </div>

                {/* Gains summary */}
                <div className="glass p-4 rounded-2xl border-zinc-800/80 space-y-3.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500 font-medium">BATTLE ALLOWANCE:</span>
                    <span className="text-yellow-400 font-heading font-black flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 fill-yellow-400 stroke-none" />
                      +3 POWER
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500 font-medium">ACCOUNTABILITY FIRE:</span>
                    <span className={`font-heading font-black flex items-center gap-1 ${
                      streakMaintained ? "text-red-500" : "text-zinc-500"
                    }`}>
                      <Flame className={`w-3.5 h-3.5 stroke-none ${
                        streakMaintained ? "fill-red-500 animate-pulse" : "fill-zinc-600"
                      }`} />
                      {streakMaintained ? "STREAK EXTENDED!" : "STREAK UNCHANGED"}
                    </span>
                  </div>

                  <div className="border-t border-zinc-900/60 pt-3 flex justify-between items-center text-xs">
                    <span className="text-zinc-500 font-medium">CURRENT STANCE:</span>
                    <span className="text-zinc-300 font-heading font-bold uppercase">
                      {activeFormName}
                    </span>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => {
                    const s = getState();
                    playSound("click", s);
                    triggerHaptic("light", s);
                    setOpen(false);
                    // Force routing refresh if needed or just let it close
                  }}
                  className="haptic-bounce w-full h-11 bg-zinc-900 border border-zinc-800 text-zinc-300 font-heading font-black text-xs tracking-widest rounded-xl hover:bg-zinc-800 transition"
                >
                  RETURN TO DOMAIN
                </button>
              </div>
            )}

            {/* SKIP FOR TODAY BUTTON (Muted footer, locked behind step 1 & 2 for strict discipline) */}
            {step !== 3 && (
              <div className="text-center pt-1 border-t border-zinc-900/50">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-[9px] font-heading font-bold text-zinc-600 hover:text-zinc-400 tracking-widest uppercase transition"
                >
                  [ BYPASS BATTLE SYSTEM FOR TODAY ]
                </button>
                <div className="text-[7px] text-zinc-700 mt-1 uppercase tracking-wider">
                  Warning: Bypassing will freeze daily accountability progression metrics.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}