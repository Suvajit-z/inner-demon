import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getState, formNames } from "@/lib/app-state";
import { db, NightReview } from "@/lib/db";
import {
  Trophy,
  Award,
  Zap,
  Flame,
  CheckCircle2,
  Clock,
  Lock,
  TrendingUp,
  History,
  Activity,
  Smile
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/progress")({ component: ProgressPage });

interface MilestoneItem {
  id: string;
  title: string;
  targetType: "power" | "streak" | "form";
  targetValue: number;
  currentValue: number;
  completed: boolean;
}

function ProgressPage() {
  const state = getState();
  const [reviewsHistory, setReviewsHistory] = useState<NightReview[]>([]);

  useEffect(() => {
    // Load historical reviews on mount
    db.getNightReviews().then((list) => {
      setReviewsHistory(list || []);
    }).catch(console.error);
  }, []);

  // Compute Milestones based on current state
  const milestonesList: MilestoneItem[] = [
    {
      id: "m1",
      title: "Awaken Energy (Reach Power 50)",
      targetType: "power",
      targetValue: 50,
      currentValue: state.power,
      completed: state.power >= 50
    },
    {
      id: "m2",
      title: "Fire Initiate (7-Day Streak)",
      targetType: "streak",
      targetValue: 7,
      currentValue: state.streak,
      completed: state.streak >= 7
    },
    {
      id: "m3",
      title: "Demon Ascension (Reach Power 100)",
      targetType: "power",
      targetValue: 100,
      currentValue: state.power,
      completed: state.power >= 100
    },
    {
      id: "m4",
      title: "Fire Champion (14-Day Streak)",
      targetType: "streak",
      targetValue: 14,
      currentValue: state.streak,
      completed: state.streak >= 14
    },
    {
      id: "m5",
      title: "Forge Iron Specter (Reach Form 4)",
      targetType: "form",
      targetValue: 4,
      currentValue: state.form,
      completed: state.form >= 4
    },
    {
      id: "m6",
      title: "Evolve Abyss Monarch (Reach Form 10)",
      targetType: "form",
      targetValue: 10,
      currentValue: state.form,
      completed: state.form >= 10
    }
  ];

  const getEmojiForMental = (val: number) => {
    switch (val) {
      case 1: return "😞";
      case 2: return "😐";
      case 3: return "😊";
      case 4: return "😄";
      case 5: return "😁";
      default: return "😐";
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-zinc-100 p-4 pb-24 max-w-md mx-auto space-y-5 relative overflow-hidden">
      {/* Background sparks */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {[...Array(12)].map((_, i) => (
          <span
            key={i}
            className="float-ember absolute w-1 h-1 rounded-full bg-red-500"
            style={{
              left: `${5 + i * 8}%`,
              bottom: "0px",
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${10 + (i % 3) * 2}s`
            }}
          />
        ))}
      </div>

      <header className="z-10 relative">
        <h1 className="text-xl font-black font-heading text-yellow-400 tracking-wider">
          DEMON RANKINGS
        </h1>
        <p className="text-zinc-500 text-xs mt-1 uppercase tracking-widest leading-relaxed">
          TRACK YOUR RECORDS & EVOLUTIONARY MILESTONES
        </p>
      </header>

      {/* 1. YOUR CURRENT RANK CARD */}
      <section className="space-y-2 z-10 relative">
        <span className="text-[10px] font-heading font-bold text-zinc-500 tracking-widest uppercase">
          YOUR STANDING
        </span>
        <div className="glass-gold rounded-2xl p-4 border-yellow-400/35 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-yellow-400/10 text-yellow-400 flex items-center justify-center font-heading font-bold text-lg border border-yellow-400/35">
              #1
            </div>
            <div>
              <h3 className="text-sm font-black font-heading text-zinc-200 uppercase tracking-wide">
                {state.name}
              </h3>
              <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400/20" />
                POWER: {state.power} | {formNames[state.form - 1]}
              </p>
            </div>
          </div>
          <div className="text-right flex items-center gap-1.5 text-xs text-yellow-400 font-bold font-heading">
            <Flame className="w-4 h-4 fill-yellow-400 animate-pulse stroke-none" />
            <span>{state.streak} DAYS</span>
          </div>
        </div>
        <span className="text-[9px] text-zinc-600 block mt-1 tracking-wider text-center">
          *Since this is personal use only, rankings represent your past records.
        </span>
      </section>

      {/* 2. HISTORICAL BESTS */}
      <section className="space-y-2 z-10 relative">
        <span className="text-[10px] font-heading font-bold text-zinc-500 tracking-widest uppercase">
          HISTORICAL BEST RECORDS
        </span>
        <div className="grid grid-cols-3 gap-3">
          <div className="glass rounded-xl p-3 text-center border-zinc-800 space-y-1">
            <span className="text-[8px] font-heading font-bold text-zinc-500 tracking-wider block">PEAK POWER</span>
            <span className="text-2xl font-black font-heading text-yellow-400 block">89</span>
            <span className="text-[8px] text-zinc-500 block uppercase">FEB 2026</span>
          </div>
          <div className="glass rounded-xl p-3 text-center border-zinc-800 space-y-1">
            <span className="text-[8px] font-heading font-bold text-zinc-500 tracking-wider block">MAX STREAK</span>
            <span className="text-2xl font-black font-heading text-red-500 block">21</span>
            <span className="text-[8px] text-zinc-500 block uppercase">DAYS LONG</span>
          </div>
          <div className="glass rounded-xl p-3 text-center border-zinc-800 space-y-1">
            <span className="text-[8px] font-heading font-bold text-zinc-500 tracking-wider block">HIGHEST TIER</span>
            <span className="text-2xl font-black font-heading text-purple-500 block">F-3</span>
            <span className="text-[8px] text-zinc-500 block uppercase">PHANTOM</span>
          </div>
        </div>
      </section>

      {/* 3. ACTIVE MILESTONES */}
      <section className="space-y-2.5 z-10 relative">
        <span className="text-[10px] font-heading font-bold text-zinc-500 tracking-widest uppercase">
          MILESTONES LIST
        </span>

        <div className="space-y-3">
          {milestonesList.map(milestone => {
            const ratio = Math.min(100, Math.round((milestone.currentValue / milestone.targetValue) * 100));

            return (
              <article
                key={milestone.id}
                className={`glass p-4 rounded-2xl border transition-all ${
                  milestone.completed
                    ? "border-green-500/20 bg-green-500/[0.01]"
                    : "border-zinc-800/80"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {milestone.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                    ) : ratio > 0 ? (
                      <Clock className="w-4 h-4 text-yellow-400 animate-pulse flex-shrink-0" />
                    ) : (
                      <Lock className="w-4 h-4 text-zinc-700 flex-shrink-0" />
                    )}
                    <h4 className={`text-xs font-bold ${milestone.completed ? "text-zinc-300" : "text-zinc-500"}`}>
                      {milestone.title}
                    </h4>
                  </div>
                  <span className={`text-[10px] font-heading font-bold ${
                    milestone.completed ? "text-green-400" : "text-zinc-500"
                  }`}>
                    {milestone.completed ? "COMPLETED" : `${milestone.currentValue}/${milestone.targetValue}`}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 rounded-full bg-zinc-950 border border-zinc-900 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      milestone.completed
                        ? "bg-green-400"
                        : "bg-gradient-to-r from-yellow-400 to-red-500"
                    }`}
                    style={{ width: `${ratio}%` }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 4. NIGHT REVIEWS TIMELINE */}
      <section className="space-y-3 z-10 relative">
        <span className="text-[10px] font-heading font-bold text-zinc-500 tracking-widest uppercase flex items-center gap-1.5">
          <History className="w-4 h-4 text-zinc-500" />
          BATTLE LOGS & REPORTS
        </span>

        {reviewsHistory.length === 0 ? (
          <div className="glass p-6 text-center border-dashed border-zinc-800 rounded-2xl">
            <p className="text-xs text-zinc-500">No battle coordinates filed yet. Report at 9:30 PM!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviewsHistory.map((rev) => (
              <div key={rev.date} className="glass p-4 rounded-xl border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-heading font-bold text-zinc-500">
                  <span>DATE: {rev.date}</span>
                  <span className="text-yellow-400">STATE: {getEmojiForMental(rev.mental_state)}</span>
                </div>
                <div className="text-xs font-semibold text-zinc-300 leading-snug">
                  "{rev.day_summary}"
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-500 border-t border-zinc-900/60 pt-2 uppercase">
                  <div>
                    <span className="text-green-400 font-bold block">🔥 BIG WIN</span>
                    <span className="text-zinc-400 font-medium block truncate">{rev.biggest_win}</span>
                  </div>
                  <div>
                    <span className="text-red-400 font-bold block">☠️ FAIL</span>
                    <span className="text-zinc-400 font-medium block truncate">{rev.biggest_failure}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}