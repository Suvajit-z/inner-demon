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
  category: "Study" | "Workout" | "Other";
  completed: boolean;
}

export interface NightReport {
  id: string;
  tasksCompleted: number;
  wentWell: string;
  wentWrong: string;
  tomorrowFocus: string;
  powerGained: number;
  date: string;
}

interface AppState {
  name: string;
  power: number;
  goals: Goal[];
  tasksByDate: Record<string, DailyTask[]>;
  reviews: NightReport[];
  reviewedDates: string[];
}

const KEY = "inner-demon-v2";

const today = () => new Date().toISOString().slice(0, 10);
const id = () => crypto.randomUUID();

const defaultState: AppState = {
  name: "Warrior",
  power: 1,
  goals: [],
  tasksByDate: {},
  reviews: [],
  reviewedDates: [],
};

export const getState = (): AppState => {
  if (typeof window === "undefined") return defaultState;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return defaultState;
  try {
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
};
export const saveState = (s: AppState) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(s));
};

export const generateTasks = (goals: Goal[]): DailyTask[] => {
  const pool = goals.flatMap((g) => {
    const category: DailyTask["category"] =
      g.type === "Study" ? "Study" : g.type === "Workout" ? "Workout" : "Other";
    return [
      { title: `Spend 45 minutes on ${g.title}`, category },
      { title: `Complete one measurable step for ${g.title}`, category },
      { title: `Review and write notes for ${g.title}`, category },
    ];
  });
  const fallback = [
    { title: "Plan your top 3 priorities for today", category: "Other" as const },
    { title: "Do a 90-minute focused study sprint", category: "Study" as const },
    { title: "Complete a 60-minute workout session", category: "Workout" as const },
    { title: "Clear one pending life/admin task", category: "Other" as const },
    { title: "Write tomorrow's main focus in one sentence", category: "Other" as const },
  ];
  const source = pool.length ? pool : fallback;
  return source.slice(0, 5).map((task) => ({ id: id(), ...task, completed: false }));
};

export const ensureTodayTasks = (state: AppState): AppState => {
  const d = today();
  if (!state.tasksByDate[d]) state.tasksByDate[d] = generateTasks(state.goals);
  return state;
};

export const getStreakDays = (state: AppState) => {
  const dates = new Set(state.reviews.map((r) => r.date));
  let streak = 0;
  const cursor = new Date();
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!dates.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

export const todayKey = today;
