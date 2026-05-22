export interface UserProfile {
  name: string;
  email: string;
  profile_picture_blob: Blob | null;
  created_at: string;
}

export interface UploadedPDF {
  id: string;
  pdf_name: string;
  pdf_blob: Blob;
  upload_date: string;
  category: string;
}

export interface ExtractedGoal {
  id?: string;
  goal_text: string;
  deadline: string;
  priority: "high" | "medium" | "low";
  category: "study" | "career" | "health" | "skill" | "other";
}

export interface DailyTaskItem {
  id: string;
  text: string;
  category: "study" | "career" | "health" | "skill" | "other";
  duration: number;
  priority: number;
  completed: boolean;
}

export interface NightReview {
  id?: string;
  date: string;
  tasks_completed: number;
  day_summary: string;
  biggest_win: string;
  biggest_failure: string;
  mental_state: string;
  tomorrow_focus: string;
}

export interface Stats {
  total_power: number;
  current_form: number;
  streak_days: number;
  last_active_date: string;
  evolution_history: Array<{ form: number; name: string; date: string }>;
}

type StoreName = "user_profile" | "uploaded_pdfs" | "extracted_goals" | "night_reviews" | "stats";

const DB_NAME = "inner-demon-db";
const VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("user_profile")) db.createObjectStore("user_profile", { keyPath: "email" });
      if (!db.objectStoreNames.contains("uploaded_pdfs")) db.createObjectStore("uploaded_pdfs", { keyPath: "id" });
      if (!db.objectStoreNames.contains("extracted_goals")) db.createObjectStore("extracted_goals", { keyPath: "id" });
      if (!db.objectStoreNames.contains("night_reviews")) db.createObjectStore("night_reviews", { keyPath: "id" });
      if (!db.objectStoreNames.contains("stats")) db.createObjectStore("stats", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function put<T>(store: StoreName, value: T): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value as any);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getAll<T>(store: StoreName): Promise<T[]> {
  const db = await openDB();
  return await new Promise<T[]>((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

export const db = {
  async saveProfile(profile: UserProfile) { await put("user_profile", profile); },
  async getProfile(): Promise<UserProfile | null> { const all = await getAll<UserProfile>("user_profile"); return all[0] ?? null; },

  async savePDF(pdf: UploadedPDF) { await put("uploaded_pdfs", pdf); },
  async getPDFs(): Promise<UploadedPDF[]> { return await getAll<UploadedPDF>("uploaded_pdfs"); },

  async saveGoals(goals: ExtractedGoal[]) {
    for (const g of goals) {
      await put("extracted_goals", { ...g, id: g.id ?? crypto.randomUUID() });
    }
  },
  async getGoals(): Promise<ExtractedGoal[]> { return await getAll<ExtractedGoal>("extracted_goals"); },

  async saveNightReview(review: NightReview) {
    await put("night_reviews", { ...review, id: review.id ?? crypto.randomUUID() });
  },
  async getNightReviews(): Promise<NightReview[]> { return await getAll<NightReview>("night_reviews"); },

  async saveStats(stats: Stats) { await put("stats", { ...stats, id: "singleton" }); },
  async getStats(): Promise<Stats | null> {
    const all = await getAll<(Stats & { id: string })>("stats");
    if (!all[0]) return null;
    const { id, ...rest } = all[0] as any;
    return rest as Stats;
  },

  async clearAll() {
    const dbi = await openDB();
    for (const store of ["user_profile", "uploaded_pdfs", "extracted_goals", "night_reviews", "stats"] as StoreName[]) {
      await new Promise<void>((resolve, reject) => {
        const tx = dbi.transaction(store, "readwrite");
        tx.objectStore(store).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
  }
};
