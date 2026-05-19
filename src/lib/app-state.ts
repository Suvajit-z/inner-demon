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
  date: string;
}

interface AppState {
  name: string;
  demonIndex: number;
  power: number;
  goals: Goal[];
  tasksByDate: Record<string, DailyTask[]>;
  reviews: NightReport[];
  reviewedDates: string[];
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
const KEY = "inner-demon-v2";

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
};

export const getState = (): AppState => {
  const raw = localStorage.getItem(KEY);
  if (!raw) return defaultState;
  try {
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
};
export const saveState = (s: AppState) => localStorage.setItem(KEY, JSON.stringify(s));
export const getForm = (i: number) => FORMS[Math.min(i, FORMS.length - 1)];

export const generateTasks = (goals: Goal[]): DailyTask[] => {
  const pool = goals.flatMap((g) => [
    `Work on ${g.title}`,
    `Deep focus: ${g.type}`,
    `Revise ${g.title}`,
    `Ship one step for ${g.title}`,
  ]);
  const fallback = [
    "Plan your top mission",
    "Execute 45 minutes deep work",
    "Review progress notes",
    "Prepare tomorrow mission",
  ];
  const source = pool.length ? pool : fallback;
  return source.slice(0, 4).map((title) => ({ id: id(), title, completed: false }));
};

export const ensureTodayTasks = (state: AppState): AppState => {
  const d = today();
  if (!state.tasksByDate[d]) state.tasksByDate[d] = generateTasks(state.goals);
  return state;
};

export const applyEvolution = (state: AppState) => {
  if (state.power >= 100 && state.demonIndex < FORMS.length - 1) {
    state.demonIndex += 1;
    state.power = 1;
  }
};

export const todayKey = today;
