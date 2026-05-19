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
}

export interface DailyTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface NightReport {
  id: string;
  achieved: string;
  mistake: string;
  mentalState: number;
  tomorrowMission: string;
  socialHours: number;
  date: string;
  filed: boolean;
}

interface AppState {
  name: string;
  demonIndex: number;
  power: number;
  goals: Goal[];
  tasksByDate: Record<string, DailyTask[]>;
  reviews: NightReport[];
  reviewedDates: string[];
  evolutionHistory: { from: string; to: string; date: string }[];
  notionConnected: boolean;
  calendarConnected: boolean;
}

const FORMS = [
  "AWAKENING SHADE",
  "RISING WRAITH",
  "BURNING PHANTOM",
  "IRON SPECTER",
  "STEEL REVENANT",
  "CRIMSON WARLORD",
  "OBSIDIAN TITAN",
  "VOID EMPEROR",
  "COSMIC DESTROYER",
  "ETERNAL LEGEND",
];
const KEY = "inner-demon-v3";
const today = () => new Date().toISOString().slice(0, 10);
const id = () => crypto.randomUUID();

const defaultState: AppState = {
  name: "Warrior",
  demonIndex: 0,
  power: 1,
  goals: [],
  tasksByDate: {},
  reviews: [],
  reviewedDates: [],
  evolutionHistory: [],
  notionConnected: false,
  calendarConnected: false,
};

export const getState = (): AppState => {
  const raw = localStorage.getItem(KEY);
  if (!raw) return structuredClone(defaultState);
  try {
    return { ...structuredClone(defaultState), ...JSON.parse(raw) };
  } catch {
    return structuredClone(defaultState);
  }
};
export const saveState = (s: AppState) => localStorage.setItem(KEY, JSON.stringify(s));
export const getForm = (i: number) => FORMS[Math.min(i, FORMS.length - 1)];
export const todayKey = today;

export const generateTasks = (goals: Goal[]): DailyTask[] => {
  const pool = goals.flatMap((g) => [
    `Read and execute: ${g.title}`,
    `Focused session for ${g.type}`,
    `Revise: ${g.title}`,
    `Finish one concrete step for ${g.title}`,
  ]);
  const source = pool.length
    ? pool
    : ["Plan top mission", "Deep work sprint", "Revise notes", "Prepare tomorrow plan"];
  return source.slice(0, 4).map((title) => ({ id: id(), title, completed: false }));
};

export const ensureTodayTasks = (state: AppState): AppState => {
  const d = today();
  if (!state.tasksByDate[d]) state.tasksByDate[d] = generateTasks(state.goals);
  return state;
};

const isQualifiedDay = (state: AppState, date: string) => {
  const tasks = state.tasksByDate[date] || [];
  const allTasksDone = tasks.length === 4 && tasks.every((t) => t.completed);
  const report = state.reviews.find((r) => r.date === date);
  return allTasksDone && !!report?.filed;
};

export const applyEvolution = (state: AppState) => {
  if (state.power < 100 || state.demonIndex >= FORMS.length - 1) return;
  const d = new Date(today());
  const d1 = d.toISOString().slice(0, 10);
  d.setDate(d.getDate() - 1);
  const d0 = d.toISOString().slice(0, 10);
  if (isQualifiedDay(state, d1) && isQualifiedDay(state, d0)) {
    const from = getForm(state.demonIndex);
    state.demonIndex += 1;
    const to = getForm(state.demonIndex);
    state.power = 1;
    state.evolutionHistory.unshift({ from, to, date: d1 });
  }
};
