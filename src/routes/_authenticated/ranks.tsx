import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { getState, formNames } from "@/lib/app-state";
import { DemonAvatar } from "@/components/demon-avatars";
import { Flame, Lock, CheckCircle2, TrendingUp, Info } from "lucide-react";

export const Route = createFileRoute("/_authenticated/ranks")({ component: EvolutionPage });

interface FormDetail {
  form: number;
  name: string;
  description: string;
  quote: string;
}

const formDetailsList: FormDetail[] = [
  {
    form: 1,
    name: "AWAKENING SHADE",
    description: "A faint, formless wisp of dark matter. It represents the quiet spark of decision when a warrior chooses to change.",
    quote: "Out of the darkness, a single shadow rises."
  },
  {
    form: 2,
    name: "RISING WRAITH",
    description: "A hooded phantom cloaked in cold focus. It gains claws as you establish initial habits and file your plans.",
    quote: "A shadowy vapor taking form in the fire of action."
  },
  {
    form: 3,
    name: "BURNING PHANTOM",
    description: "A blazing demonic specter with curving horns. It thrives on intense daily discipline and 7+ day habit streaks.",
    quote: "Burn away the excuses. The phantom turns into fire."
  },
  {
    form: 4,
    name: "IRON SPECTER",
    description: "An armored mechanical skull dreadnought. Steel plates defend your routine against external distractions.",
    quote: "Unshakeable iron will. The mind is a fortress."
  },
  {
    form: 5,
    name: "VOID HOWLER",
    description: "An eldritch cosmic titan with cosmic geometries. It commands the starfield of master skills.",
    quote: "The quiet echo of focus that devours the vacuum of space."
  },
  {
    form: 6,
    name: "EMBER TYRANT",
    description: "A monstrous volcano giant built of volcanic lava. It radiates extreme heat, conquering heavy workloads.",
    quote: "The world melts under the weight of your empire."
  },
  {
    form: 7,
    name: "BLOOD SERAPH",
    description: "A dark high-angel geometry hovering with six wings. It fuses focus and physical strength into legendary states.",
    quote: "Ascend beyond ordinary limits. Pure geometric perfection."
  },
  {
    form: 8,
    name: "NIGHT BERSERKER",
    description: "A heavily horned beast knight dual-wielding glowing crimson blades. It destroys procrastination instantly.",
    quote: "Cut down the shadows of doubt. Move hard. Show no mercy."
  },
  {
    form: 9,
    name: "OBSIDIAN TITAN",
    description: "A crystal armor behemoth crackling with raw purple static lightning. Your power is recognized by all records.",
    quote: "Stand tall. The earth shakes. You are unbreakable obsidian."
  },
  {
    form: 10,
    name: "ABYSS MONARCH",
    description: "The ultimate devil emperor with huge dragon wings and solar golden aureole. Complete mastery of your soul.",
    quote: "Awaken your power. You have conquered the abyss. You are Legend. 🔥"
  }
];

function EvolutionPage() {
  const state = getState();
  const currentForm = state.form;

  // Track expanded descriptions
  const [selectedFormIdx, setSelectedFormIdx] = useState<number | null>(currentForm - 1);

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-zinc-100 p-4 pb-24 max-w-md mx-auto space-y-5 relative overflow-hidden">
      {/* Ember background particles */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {[...Array(12)].map((_, i) => (
          <span
            key={i}
            className="float-ember absolute w-1 h-1 rounded-full bg-purple-500"
            style={{
              left: `${8 + i * 7.5}%`,
              bottom: "0px",
              animationDelay: `${i * 0.45}s`,
              animationDuration: `${10 + (i % 3) * 2}s`
            }}
          />
        ))}
      </div>

      <header className="z-10 relative">
        <h1 className="text-xl font-black font-heading text-yellow-400 tracking-wider">
          DEMON EVOLUTION
        </h1>
        <p className="text-zinc-500 text-xs mt-1 uppercase tracking-widest leading-relaxed">
          ASCEND THROUGH the 10 MYTHOLOGICAL FORMS
        </p>
      </header>

      {/* Evolution tree */}
      <section className="space-y-4 relative z-10">
        {formDetailsList.map((item, idx) => {
          const formNum = item.form;
          const isCompleted = formNum < currentForm;
          const isActive = formNum === currentForm;
          const isLocked = formNum > currentForm;
          const isExpanded = selectedFormIdx === idx;

          return (
            <div key={item.form} className="relative flex flex-col items-center">
              {/* Animated Connecting Line to next card */}
              {idx > 0 && (
                <div className="absolute -top-6 w-1 h-6 bg-zinc-950/80 flex items-center justify-center pointer-events-none z-0">
                  <svg className="w-1 h-full">
                    <line
                      x1="2"
                      y1="0"
                      x2="2"
                      y2="24"
                      className={isCompleted ? "stroke-yellow-400" : isActive ? "stroke-purple-500" : "stroke-zinc-800"}
                      strokeWidth="2.5"
                      strokeDasharray={isActive ? "4 4" : "none"}
                    />
                  </svg>
                  {/* Flowing golden dash particles */}
                  {isCompleted && (
                    <span 
                      className="absolute w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping"
                      style={{
                        animationDuration: "1.5s"
                      }}
                    />
                  )}
                </div>
              )}

              {/* Form Card */}
              <article
                onClick={() => setSelectedFormIdx(isExpanded ? null : idx)}
                className={`w-full glass p-4 rounded-2xl cursor-pointer transition-all duration-300 flex flex-col justify-between border relative ${
                  isActive
                    ? "border-yellow-400 shadow-[0_0_20px_rgba(255,215,0,0.15)] ring-1 ring-yellow-400/40 bg-yellow-400/[0.01]"
                    : isCompleted
                    ? "border-zinc-800 hover:border-yellow-400/35 bg-zinc-950/40"
                    : "border-zinc-900 opacity-40 bg-zinc-950/20"
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar thumbnail */}
                  <div className={`w-16 h-16 bg-black/50 rounded-xl border flex items-center justify-center p-1.5 flex-shrink-0 ${
                    isActive ? "border-yellow-400" : isCompleted ? "border-zinc-800" : "border-zinc-900"
                  }`}>
                    {isLocked ? (
                      <div className="w-full h-full rounded-lg bg-zinc-950/80 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-zinc-700" />
                      </div>
                    ) : (
                      <DemonAvatar form={formNum} className="w-full h-full text-red-500 filter drop-shadow-[0_0_5px_rgba(255,68,68,0.1)]" />
                    )}
                  </div>

                  {/* Text details */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-heading font-bold text-zinc-500 tracking-wider">
                        FORM {formNum}
                      </span>
                      {isCompleted && (
                        <span className="flex items-center gap-1 text-[9px] font-heading font-bold text-yellow-400 tracking-wider uppercase">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          COMPLETE
                        </span>
                      )}
                      {isActive && (
                        <span className="flex items-center gap-1 text-[9px] font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 tracking-wider uppercase animate-pulse">
                          <Flame className="w-3.5 h-3.5 fill-yellow-400 animate-pulse stroke-none" />
                          ACTIVE COMBATANT
                        </span>
                      )}
                      {isLocked && (
                        <span className="text-[9px] font-heading font-bold text-zinc-600 tracking-wider uppercase flex items-center gap-1">
                          🔒 LOCKED
                        </span>
                      )}
                    </div>

                    <h3 className={`text-sm font-extrabold font-heading tracking-wide ${
                      isActive ? "text-yellow-400 filter drop-shadow-[0_0_5px_rgba(255,215,0,0.25)]" : isCompleted ? "text-zinc-300" : "text-zinc-600"
                    }`}>
                      {item.name}
                    </h3>

                    {isActive && (
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 font-semibold uppercase pt-1">
                        <span>SOUL ENERGY: {state.power}/100</span>
                        <span>{100 - state.power} MORE TO EVOLVE</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Collapsible Info Panel */}
                {isExpanded && !isLocked && (
                  <div className="mt-4 pt-3 border-t border-zinc-800/80 slide-up-enter space-y-2">
                    <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                      {item.description}
                    </p>
                    <p className="text-[10px] text-yellow-400/80 italic font-medium font-heading">
                      "{item.quote}"
                    </p>
                  </div>
                )}
              </article>
            </div>
          );
        })}
      </section>
    </main>
  );
}
