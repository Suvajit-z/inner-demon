import { db, UserProfile, ExtractedGoal, DailyTaskItem, Stats, NightReview } from "./db";

export interface Goal {
  id: string;
  title: string;
  deadline: string;
  priority: "high" | "medium" | "low";
  category: "study" | "career" | "health" | "skill" | "other";
  subtaskCount?: number;
  completedSubtasks?: number;
}

export interface AppState {
  email: string;
  name: string;
  power: number;
  form: number;
  streak: number;
  totalCompletedTasks: number;
  successRate: number;
  onboardingCompleted: boolean;
  avatarUrl: string;
  goals: Goal[];
  soundEnabled: boolean;
  hapticEnabled: boolean;
  apiKeyOpenAI: string;
  apiKeyClaude: string;
  tasksByDate: Record<string, DailyTaskItem[]>;
  last_active_date: string;
  otpCode?: string;
  otpExpiresAt?: number;
  pinHash?: string;
  failedPinAttempts: number;
  isAdmin: boolean;
  isPaid: boolean;
  activeSubscriber: boolean;
  trialEndsAt?: number;
}

const KEY = "inner-demon-state-v4";
export const formNames = [
  "AWAKENING SHADE",
  "RISING WRAITH",
  "BURNING PHANTOM",
  "IRON SPECTER",
  "VOID HOWLER",
  "EMBER TYRANT",
  "BLOOD SERAPH",
  "NIGHT BERSERKER",
  "OBSIDIAN TITAN",
  "ABYSS MONARCH"
];

export const todayKey = () => new Date().toISOString().slice(0, 10);
const id = () => crypto.randomUUID();

export const createDefaultState = (): AppState => ({
  email: "",
  name: "Warrior",
  power: 1,
  form: 1,
  streak: 0,
  totalCompletedTasks: 0,
  successRate: 100,
  onboardingCompleted: false,
  avatarUrl: "",
  goals: [],
  soundEnabled: true,
  hapticEnabled: true,
  apiKeyOpenAI: "",
  apiKeyClaude: "",
  tasksByDate: {},
  last_active_date: "",
  failedPinAttempts: 0,
  isAdmin: false,
  isPaid: false,
  activeSubscriber: false,
});

export const getState = (): AppState => {
  const defaultState = createDefaultState();
  if (typeof window === "undefined") return defaultState;
  const raw = localStorage.getItem(KEY);
  if (!raw) return defaultState;
  try {
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
};

export const saveState = (s: AppState) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));

  // Sync basic stats to IndexedDB asynchronously
  const stats: Stats = {
    total_power: s.power,
    current_form: s.form,
    streak_days: s.streak,
    last_active_date: todayKey(),
    evolution_history: s.goals.map(g => ({
      form: s.form,
      name: formNames[s.form - 1],
      date: todayKey()
    }))
  };
  db.saveStats(stats).catch(console.error);

  // Sync profile metadata
  const profile: UserProfile = {
    name: s.name,
    email: s.email,
    profile_picture_blob: null, // Separately handled via file picker to avoid blocking size limits
    created_at: new Date().toISOString()
  };
  db.saveProfile(profile).catch(console.error);
};

export const playSound = (type: "complete" | "evolution" | "submit" | "click", state: AppState) => {
  if (!state.soundEnabled || typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "complete") {
      // Soft chime: two rapid upward tones
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.45);
    } else if (type === "click") {
      // Light snap/pop sound
      osc.type = "triangle";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === "submit") {
      // Harmonic success sweep
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === "evolution") {
      // Epic sci-fi rising growl
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 1.2);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.5);
    }
  } catch (e) {
    console.error("Audio generation failed: ", e);
  }
};

export const triggerHaptic = (type: "light" | "medium" | "heavy" | "success", state: AppState) => {
  if (!state.soundEnabled || typeof window === "undefined" || !navigator.vibrate) return;
  try {
    if (type === "light") {
      navigator.vibrate(10);
    } else if (type === "medium") {
      navigator.vibrate(30);
    } else if (type === "heavy") {
      navigator.vibrate(100);
    } else if (type === "success") {
      navigator.vibrate([40, 30, 60]);
    }
  } catch (e) {
    console.error("Haptic feedback failed: ", e);
  }
};

export const generateFallbackTasks = (goals: Goal[]): DailyTaskItem[] => {
  const pool: Omit<DailyTaskItem, "id" | "completed">[] = goals.flatMap((g) => [
    {
      text: `Focus sprint: concrete milestone for ${g.title}`,
      category: g.category,
      duration: g.category === "study" ? 90 : g.category === "health" ? 60 : 45,
      priority: g.priority === "high" ? 1 : g.priority === "medium" ? 2 : 3
    }
  ]);

  const defaultPool: DailyTaskItem[] = [
    {
      id: id(),
      text: "Study core curriculum / read next chapter",
      category: "study",
      duration: 90,
      priority: 1,
      completed: false
    },
    {
      id: id(),
      text: "Apply to career opportunities / draft MLT plans",
      category: "career",
      duration: 60,
      priority: 2,
      completed: false
    },
    {
      id: id(),
      text: "Intense physical training session",
      category: "health",
      duration: 60,
      priority: 3,
      completed: false
    },
    {
      id: id(),
      text: "Code development / study Ethical Hacking & AI tools",
      category: "skill",
      duration: 45,
      priority: 4,
      completed: false
    },
    {
      id: id(),
      text: "Prepare healthy meals for tomorrow structure",
      category: "health",
      duration: 30,
      priority: 5,
      completed: false
    }
  ];

  if (pool.length > 0) {
    return pool.slice(0, 5).map((t, idx) => ({
      id: id(),
      completed: false,
      text: t.text,
      category: t.category,
      duration: t.duration,
      priority: idx + 1
    }));
  }

  return defaultPool;
};

export const ensureTodayTasks = (s: AppState): AppState => {
  const date = todayKey();
  if (!s.tasksByDate[date]) {
    s.tasksByDate[date] = generateFallbackTasks(s.goals);
  }
  return s;
};

export const timerFor = (category: string) => {
  if (category === "study") return 90 * 60;
  if (category === "career" || category === "health") return 60 * 60;
  return 45 * 60;
};

export const handleTaskToggle = (taskId: string, s: AppState): AppState => {
  const date = todayKey();
  const tasks = s.tasksByDate[date] || [];
  const task = tasks.find(t => t.id === taskId);
  if (!task) return s;

  task.completed = !task.completed;
  task.completed_at = task.completed ? new Date().toISOString() : null;

  // Recalculate stats
  const completedToday = tasks.filter(t => t.completed).length;
  if (task.completed) {
    s.totalCompletedTasks += 1;
    s.power = Math.min(100, s.power + 5);
    playSound("complete", s);
    triggerHaptic("success", s);
  } else {
    s.totalCompletedTasks = Math.max(0, s.totalCompletedTasks - 1);
    s.power = Math.max(1, s.power - 5);
    triggerHaptic("light", s);
  }

  // Recalculate global success rate
  const totalCreatedTasks = Object.values(s.tasksByDate).reduce((acc, list) => acc + list.length, 0);
  s.successRate = totalCreatedTasks > 0 ? Math.round((s.totalCompletedTasks / totalCreatedTasks) * 100) : 100;

  // Check if evolution is triggered at 100 power
  // (We handle the trigger sequence in the front-end itself)

  saveState(s);
  return s;
};

// Simulated AI Analyzer
export const simulatePDFAnalysis = (
  fileName: string,
  category: "study" | "eating" | "goals"
): ExtractedGoal[] => {
  const nameLower = fileName.toLowerCase();
  
  if (category === "study") {
    const isPsychology = nameLower.includes("psychology") || nameLower.includes("upsc");
    return [
      {
        id: id(),
        goal_text: isPsychology ? "UPSC Psychology Syllabus Completion" : "Complete Study Syllabus",
        deadline: "2026-12-31",
        priority: "high",
        category: "study"
      },
      {
        id: id(),
        goal_text: isPsychology ? "Master UPSC Chapter 5-8 Cognitive Theories" : "Complete Major Chapters",
        deadline: "2026-08-15",
        priority: "medium",
        category: "study"
      },
      {
        id: id(),
        goal_text: "Weekly Syllabus Mock Test Series",
        deadline: "2026-06-30",
        priority: "low",
        category: "study"
      }
    ];
  } else if (category === "eating") {
    return [
      {
        id: id(),
        goal_text: "High-Protein Muscle Transformation Diet",
        deadline: "2026-09-01",
        priority: "high",
        category: "health"
      },
      {
        id: id(),
        goal_text: "Daily 3-Meal Calorie Structured Plan",
        deadline: "2026-07-10",
        priority: "medium",
        category: "health"
      }
    ];
  } else {
    // Life Goals
    const isMlt = nameLower.includes("mlt") || nameLower.includes("job");
    const isHacking = nameLower.includes("hack") || nameLower.includes("cyber");
    return [
      {
        id: id(),
        goal_text: isMlt ? "Secure MLT Professional Placement" : "Career Path Launch",
        deadline: "2026-06-30",
        priority: "high",
        category: "career"
      },
      {
        id: id(),
        goal_text: isHacking ? "Master Ethical Hacking & Cyber Defensive Tools" : "AI & Technical Skill Development",
        deadline: "2026-10-15",
        priority: "high",
        category: "skill"
      },
      {
        id: id(),
        goal_text: "Maintain a 12+ day accountable routine streak",
        deadline: "2026-12-25",
        priority: "medium",
        category: "other"
      }
    ];
  }
};
