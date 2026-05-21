export type GoalType = "Study" | "Workout" | "Skill" | "Personal";
export type Priority = "Low" | "Medium" | "High";

export interface Goal {
  id: string;
  title: string;
  description: string;
  type: GoalType;
  deadline: string;
  priority: Priority;
  createdAt: string;
  source?: "manual" | "notion";
  status?: "todo" | "done";
}

export interface DailyTask {
  id: string;
  title: string;
  category: "Study" | "Workout" | "Other";
  completed: boolean;
  source?: "local" | "notion";
  deadline?: string;
}

export interface NightReport { id: string; date: string; completionRate: number; win: string; failure: string; mental: number; mission: string; }

export interface AppState {
  email: string;
  name: string;
  power: number;
  isPaid: boolean;
  trialEndsAt?: number;
  pinHash?: string;
  form: number;
  maintenanceDay: 0 | 1 | 2;
  evolutionHistory: { form: number; name: string; date: string }[];
  failedPinAttempts: number;
  activeSubscriber?: boolean;
  isAdmin: boolean;
  goals: Goal[];
  tasksByDate: Record<string, DailyTask[]>;
  reviews: NightReport[];
  missedNights: number;
  lockUntil?: number;
  wrongOtpTries: number;
  otpExpiresAt?: number;
  otpResendAt?: number;
  otpCode?: string;
  notionConnected?: boolean;
  gcalConnected?: boolean;
}

const KEY = "inner-demon-v3";
const today = () => new Date().toISOString().slice(0, 10);
const id = () => crypto.randomUUID();

const defaultState: AppState = { email: "", name: "Warrior", power: 1, isPaid: false, isAdmin: false, form: 1, maintenanceDay: 0, evolutionHistory: [], failedPinAttempts: 0, goals: [], tasksByDate: {}, reviews: [], missedNights: 0, wrongOtpTries: 0 };

export const getState = (): AppState => {
  if (typeof window === "undefined") return defaultState;
  const raw = localStorage.getItem(KEY);
  if (!raw) return defaultState;
  try { return { ...defaultState, ...JSON.parse(raw) }; } catch { return defaultState; }
};
export const saveState = (s: AppState) => localStorage.setItem(KEY, JSON.stringify(s));

export const generateTasks = (goals: Goal[]): DailyTask[] => {
  const pool = goals.map((g) => ({ title: `Complete one concrete step for ${g.title}`, category: g.type === "Study" ? "Study" : g.type === "Workout" ? "Workout" : "Other" as const, source: g.source === "notion" ? "notion" : "local" as const, deadline: g.deadline }));
  const fallback = [
    { title: "Deep work sprint", category: "Study" as const, source: "local" as const },
    { title: "Training session", category: "Workout" as const, source: "local" as const },
    { title: "Mission planning", category: "Other" as const, source: "local" as const },
    { title: "Execute hardest task", category: "Other" as const, source: "local" as const },
  ];
  return (pool.length ? pool : fallback).slice(0, 4).map((t) => ({ id: id(), completed: false, ...t }));
};
export const todayKey = today;
export const ensureTodayTasks = (s: AppState) => { const d = today(); if (!s.tasksByDate[d]) s.tasksByDate[d] = generateTasks(s.goals); return s; };
export const timerFor = (c: DailyTask["category"]) => c === "Study" ? 90*60 : c === "Workout" ? 60*60 : 45*60;
export const formNames = ["AWAKENING SHADE","RISING WRAITH","IRON FIEND","VOID HOWLER","EMBER TYRANT","BLOOD SERAPH","NIGHT BERSERKER","OBSIDIAN TITAN","ABYSS MONARCH","INNER LEGEND"];

export const computeDailyPowerDelta = (taskDone: number, filedNight: boolean, streakBonus: boolean) => {
  const taskGain = taskDone >= 4 ? 4 : taskDone === 3 ? 2 : taskDone === 2 ? 1 : 0;
  return Math.min(6, taskGain + (filedNight ? 1 : 0) + (streakBonus ? 1 : 0));
};
