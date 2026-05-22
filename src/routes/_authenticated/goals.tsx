import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { getState, saveState, simulatePDFAnalysis, todayKey, generateFallbackTasks } from "@/lib/app-state";
type PdfJsModule = typeof import("pdfjs-dist");
let _pdfjs: PdfJsModule | null = null;
async function getPdfjs(): Promise<PdfJsModule> {
  if (_pdfjs) return _pdfjs;
  const mod = await import("pdfjs-dist");
  mod.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.7.284/pdf.worker.min.js";
  _pdfjs = mod;
  return mod;
}
import { db } from "@/lib/db";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Brain,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Award,
  BookOpen,
  Apple,
  Zap,
  Trash2
} from "lucide-react";
import { toast } from "sonner";

async function extractTextFromPDF(blob: Blob): Promise<string> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";
    }
    return fullText;
  } catch (err) {
    console.error("PDF Extraction error: ", err);
    throw new Error("Failed to read PDF document text layers.");
  }
}

async function parseWithOpenAI(apiKey: string, text: string): Promise<any> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a professional planner. You extract personal goals, routines, and daily action lists from text and return them in a strict JSON schema. Always prioritize nearest deadlines, include realistic durations, and categorize items accurately."
        },
        {
          role: "user",
          content: `You are analyzing a personal routine/goal document.
 
PDF Content:
${text.slice(0, 15000)}
 
Extract and structure the following details:
 
1. GOALS:
   - List all goals mentioned
   - Extract deadlines (use YYYY-MM-DD format if found, or reasonable target date)
   - Identify priorities (high/medium/low)
   - Categorize (study/career/health/skill/other)
 
2. ROUTINES:
   - Daily schedule if mentioned
   - Study topics and chapters
   - Eating plans
   - Workout plans
 
3. ACTIONABLE Daily Tasks:
   - Break down goals into small daily actions
   - Limit suggested daily tasks to 5 specific, achievable daily tasks.
 
Respond ONLY in strict JSON format matching this exact schema:
{
  "goals": [
    {
      "text": "goal text",
      "deadline": "date",
      "priority": "high/medium/low",
      "category": "study/career/health/skill/other"
    }
  ],
  "routines": {
    "study": "description",
    "eating": "description",
    "other": "description"
  },
  "suggested_daily_tasks": [
    {
      "task": "specific task",
      "duration": "minutes",
      "category": "study/career/health/skill/other",
      "priority": "number"
    }
  ]
}`
        }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "OpenAI API request failed.");
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function parseWithClaude(apiKey: string, text: string): Promise<any> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      system: "You are a professional planner. Respond ONLY in strict JSON format. Never include any greeting, explanation, or text before or after the JSON.",
      messages: [
        {
          role: "user",
          content: `You are analyzing a personal routine/goal document.
 
PDF Content:
${text.slice(0, 15000)}
 
Extract and structure the following details:
 
1. GOALS:
   - List all goals mentioned
   - Extract deadlines (use YYYY-MM-DD format if found, or reasonable target date)
   - Identify priorities (high/medium/low)
   - Categorize (study/career/health/skill/other)
 
2. ROUTINES:
   - Daily schedule if mentioned
   - Study topics and chapters
   - Eating plans
   - Workout plans
 
3. ACTIONABLE Daily Tasks:
   - Break down goals into small daily actions
   - Limit suggested daily tasks to 5 specific, achievable daily tasks.
 
Respond ONLY in strict JSON format matching this exact schema:
{
  "goals": [
    {
      "text": "goal text",
      "deadline": "date",
      "priority": "high/medium/low",
      "category": "study/career/health/skill/other"
    }
  ],
  "routines": {
    "study": "description",
    "eating": "description",
    "other": "description"
  },
  "suggested_daily_tasks": [
    {
      "task": "specific task",
      "duration": "minutes",
      "category": "study/career/health/skill/other",
      "priority": "number"
    }
  ]
}`
        }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Claude API request failed.");
  }

  const data = await response.json();
  const rawText = data.content[0].text;
  return JSON.parse(rawText);
}

export const Route = createFileRoute("/_authenticated/goals")({ component: GoalsPage });

interface PDFUploadState {
  name: string;
  size: string;
  blob: Blob | null;
  uploaded: boolean;
}

function GoalsPage() {
  const navigate = useNavigate();
  const state = getState();

  // 3 PDF states
  const [syllabus, setSyllabus] = useState<PDFUploadState>({ name: "", size: "", blob: null, uploaded: false });
  const [eating, setEating] = useState<PDFUploadState>({ name: "", size: "", blob: null, uploaded: false });
  const [lifeGoals, setLifeGoals] = useState<PDFUploadState>({ name: "", size: "", blob: null, uploaded: false });

  // UI Phases: "upload" | "analyzing" | "complete"
  const [phase, setPhase] = useState<"upload" | "analyzing" | "complete">("upload");
  const [progress, setProgress] = useState(0);
  const [analyzingStep, setAnalyzingStep] = useState(0); // 0, 1, 2
  
  // Extracted goals
  const [extractedGoals, setExtractedGoals] = useState<any[]>([]);

  // Refs for file triggers
  const syllabusRef = useRef<HTMLInputElement>(null);
  const eatingRef = useRef<HTMLInputElement>(null);
  const lifeRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "syllabus" | "eating" | "life"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Invalid file format. Please drop a valid PDF.");
      return;
    }

    const fileData = {
      name: file.name,
      size: formatSize(file.size),
      blob: file,
      uploaded: true
    };

    if (type === "syllabus") setSyllabus(fileData);
    else if (type === "eating") setEating(fileData);
    else setLifeGoals(fileData);

    toast.success(`${file.name} uploaded successfully.`);
  };

  const triggerUpload = (type: "syllabus" | "eating" | "life") => {
    if (type === "syllabus") syllabusRef.current?.click();
    else if (type === "eating") eatingRef.current?.click();
    else lifeRef.current?.click();
  };

  const clearFile = (type: "syllabus" | "eating" | "life", e: React.MouseEvent) => {
    e.stopPropagation();
    const clearData = { name: "", size: "", blob: null, uploaded: false };
    if (type === "syllabus") setSyllabus(clearData);
    else if (type === "eating") setEating(clearData);
    else setLifeGoals(clearData);
  };

  const runAnalysis = async () => {
    if (!syllabus.uploaded && !eating.uploaded && !lifeGoals.uploaded) {
      toast.error("Upload at least one routine coordinate file.");
      return;
    }

    // Enter analyzing phase
    setPhase("analyzing");
    setProgress(0);
    setAnalyzingStep(0);

    const hasClaude = !!state.apiKeyClaude;
    const hasOpenAI = !!state.apiKeyOpenAI;

    if (hasClaude || hasOpenAI) {
      try {
        setAnalyzingStep(1);
        setProgress(15);

        // 1. Read files and extract text
        let extractedTexts: string[] = [];

        if (syllabus.uploaded && syllabus.blob) {
          toast.info("Extracting syllabus coordinates...");
          const text = await extractTextFromPDF(syllabus.blob);
          extractedTexts.push(`[STUDY SYLLABUS DOCUMENT - ${syllabus.name}]\n${text}`);
        }

        setAnalyzingStep(2);
        setProgress(35);

        if (eating.uploaded && eating.blob) {
          toast.info("Extracting eating coordinates...");
          const text = await extractTextFromPDF(eating.blob);
          extractedTexts.push(`[EATING PLAN ROUTINE DOCUMENT - ${eating.name}]\n${text}`);
        }

        if (lifeGoals.uploaded && lifeGoals.blob) {
          toast.info("Extracting life path plans...");
          const text = await extractTextFromPDF(lifeGoals.blob);
          extractedTexts.push(`[LIFE GOALS ROADMAP - ${lifeGoals.name}]\n${text}`);
        }

        setAnalyzingStep(3);
        setProgress(55);
        toast.info("Connecting to AI Devourer...");

        const combinedText = extractedTexts.join("\n\n---\n\n");
        let parsedResult: any = null;

        if (hasClaude) {
          parsedResult = await parseWithClaude(state.apiKeyClaude, combinedText);
        } else {
          parsedResult = await parseWithOpenAI(state.apiKeyOpenAI, combinedText);
        }

        setProgress(85);

        if (parsedResult && (parsedResult.goals || parsedResult.suggested_daily_tasks)) {
          // Map to app state and save
          const formattedExtractedGoals = (parsedResult.goals || []).map((g: any, idx: number) => ({
            id: crypto.randomUUID(),
            goal_text: g.text || g.goal_text || "Cognitive Routine Objective",
            deadline: g.deadline || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            priority: g.priority || "medium",
            category: g.category || "study"
          }));

          // Save PDFs inside IndexedDB
          if (syllabus.uploaded) {
            await db.savePDF({
              id: crypto.randomUUID(),
              pdf_name: syllabus.name,
              pdf_blob: syllabus.blob!,
              upload_date: new Date().toISOString(),
              category: "study"
            });
          }
          if (eating.uploaded) {
            await db.savePDF({
              id: crypto.randomUUID(),
              pdf_name: eating.name,
              pdf_blob: eating.blob!,
              upload_date: new Date().toISOString(),
              category: "eating"
            });
          }
          if (lifeGoals.uploaded) {
            await db.savePDF({
              id: crypto.randomUUID(),
              pdf_name: lifeGoals.name,
              pdf_blob: lifeGoals.blob!,
              upload_date: new Date().toISOString(),
              category: "goals"
            });
          }

          setProgress(100);
          setExtractedGoals(formattedExtractedGoals);
          setPhase("complete");
          toast.success("AI Routine Synthesis complete! Consciousness updated.");
        } else {
          throw new Error("Invalid response format from AI agent.");
        }

      } catch (err: any) {
        console.error("AI analysis failed: ", err);
        toast.warning("AI Link breached. Deploying local-first offline simulator fallback...", {
          style: { background: "#0A0A0A", border: "1px solid #FF4444", color: "#FF4444" }
        });
        runSimulatedAnalysis();
      }
    } else {
      runSimulatedAnalysis();
    }
  };

  const runSimulatedAnalysis = () => {
    setProgress(0);
    setAnalyzingStep(1);

    setTimeout(() => {
      setProgress(35);
      setAnalyzingStep(1);
    }, 1500);

    setTimeout(() => {
      setProgress(67);
      setAnalyzingStep(2);
    }, 3500);

    setTimeout(() => {
      setProgress(100);
      setAnalyzingStep(3);
    }, 6000);

    setTimeout(async () => {
      let goalsPool: any[] = [];
      if (syllabus.uploaded) {
        goalsPool = [...goalsPool, ...simulatePDFAnalysis(syllabus.name, "study")];
        db.savePDF({
          id: crypto.randomUUID(),
          pdf_name: syllabus.name,
          pdf_blob: syllabus.blob!,
          upload_date: new Date().toISOString(),
          category: "study"
        }).catch(console.error);
      }
      if (eating.uploaded) {
        goalsPool = [...goalsPool, ...simulatePDFAnalysis(eating.name, "eating")];
        db.savePDF({
          id: crypto.randomUUID(),
          pdf_name: eating.name,
          pdf_blob: eating.blob!,
          upload_date: new Date().toISOString(),
          category: "eating"
        }).catch(console.error);
      }
      if (lifeGoals.uploaded) {
        goalsPool = [...goalsPool, ...simulatePDFAnalysis(lifeGoals.name, "goals")];
        db.savePDF({
          id: crypto.randomUUID(),
          pdf_name: lifeGoals.name,
          pdf_blob: lifeGoals.blob!,
          upload_date: new Date().toISOString(),
          category: "goals"
        }).catch(console.error);
      }

      if (goalsPool.length === 0) {
        goalsPool = simulatePDFAnalysis("Study Psychology UPSC.pdf", "study");
      }

      setExtractedGoals(goalsPool);
      setPhase("complete");
      toast.success("AI Analysis devouring complete.");
    }, 7500);
  };

  const handleGenerateTasks = () => {
    // Save extracted goals to AppState and seed tasks
    const s = getState();
    
    // Map extracted goals to AppState Goal shape
    const formattedGoals = extractedGoals.map(eg => ({
      id: eg.id,
      title: eg.goal_text,
      deadline: eg.deadline,
      priority: eg.priority,
      category: eg.category
    }));

    s.goals = [...s.goals, ...formattedGoals];
    
    // Seed new daily tasks
    const dateKey = todayKey();
    s.tasksByDate[dateKey] = generateFallbackTasks(s.goals);

    // Save extracted goals details to IndexedDB
    db.saveGoals(extractedGoals.map(eg => ({
      id: eg.id,
      goal_text: eg.goal_text,
      deadline: eg.deadline,
      priority: eg.priority,
      category: eg.category
    }))).catch(console.error);

    saveState(s);
    toast.success("New daily missions generated.");
    navigate({ to: "/dashboard" });
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-zinc-100 p-4 pb-24 max-w-md mx-auto space-y-5 relative overflow-hidden">
      {/* Background embers */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {[...Array(12)].map((_, i) => (
          <span
            key={i}
            className="float-ember absolute w-1 h-1 rounded-full bg-yellow-500"
            style={{
              left: `${10 + i * 8}%`,
              bottom: "0px",
              animationDelay: `${i * 0.6}s`,
              animationDuration: `${9 + (i % 3) * 1.5}s`
            }}
          />
        ))}
      </div>

      {phase === "upload" && (
        <div className="space-y-5 slide-up-enter z-10 relative">
          <header>
            <h1 className="text-xl font-black font-heading text-yellow-400 tracking-wider">
              UPLOAD ROUTINES
            </h1>
            <p className="text-zinc-500 text-xs mt-1 uppercase tracking-widest leading-relaxed">
              FEED YOUR SYLLABUS, DIET & LIFE PLANS TO THE DEMON
            </p>
          </header>

          {/* Upload Boxes List */}
          <div className="space-y-4">
            {/* Box 1: Study Syllabus */}
            <div
              onClick={() => triggerUpload("syllabus")}
              className={`glass p-5 rounded-2xl cursor-pointer transition-all duration-300 relative flex flex-col justify-center ${
                syllabus.uploaded
                  ? "border-yellow-400/30 bg-yellow-400/[0.01]"
                  : "border-dashed border-zinc-800 hover:border-yellow-400/40 hover:scale-[1.02]"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  syllabus.uploaded ? "bg-yellow-400/10 text-yellow-400" : "bg-zinc-900 text-zinc-500"
                }`}>
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-sm font-bold font-heading tracking-wide">1. STUDY SYLLABUS</h3>
                  {syllabus.uploaded ? (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-zinc-400 max-w-[180px] truncate">{syllabus.name}</p>
                      <button onClick={(e) => clearFile("syllabus", e)} className="text-zinc-500 hover:text-red-500 transition-all p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500">Tap to upload syllabus PDF (UPSC, college, courses)</p>
                  )}
                </div>
                {syllabus.uploaded && <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0" />}
              </div>
              <input ref={syllabusRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileChange(e, "syllabus")} />
            </div>

            {/* Box 2: Eating Routine */}
            <div
              onClick={() => triggerUpload("eating")}
              className={`glass p-5 rounded-2xl cursor-pointer transition-all duration-300 relative flex flex-col justify-center ${
                eating.uploaded
                  ? "border-yellow-400/30 bg-yellow-400/[0.01]"
                  : "border-dashed border-zinc-800 hover:border-yellow-400/40 hover:scale-[1.02]"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  eating.uploaded ? "bg-yellow-400/10 text-yellow-400" : "bg-zinc-900 text-zinc-500"
                }`}>
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-sm font-bold font-heading tracking-wide">2. EATING ROUTINE</h3>
                  {eating.uploaded ? (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-zinc-400 max-w-[180px] truncate">{eating.name}</p>
                      <button onClick={(e) => clearFile("eating", e)} className="text-zinc-500 hover:text-red-500 transition-all p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500">Tap to upload diet coordinates (proteins, schedules)</p>
                  )}
                </div>
                {eating.uploaded && <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0" />}
              </div>
              <input ref={eatingRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileChange(e, "eating")} />
            </div>

            {/* Box 3: Life Goals */}
            <div
              onClick={() => triggerUpload("life")}
              className={`glass p-5 rounded-2xl cursor-pointer transition-all duration-300 relative flex flex-col justify-center ${
                lifeGoals.uploaded
                  ? "border-yellow-400/30 bg-yellow-400/[0.01]"
                  : "border-dashed border-zinc-800 hover:border-yellow-400/40 hover:scale-[1.02]"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  lifeGoals.uploaded ? "bg-yellow-400/10 text-yellow-400" : "bg-zinc-900 text-zinc-500"
                }`}>
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-sm font-bold font-heading tracking-wide">3. LIFE GOALS & PLANS</h3>
                  {lifeGoals.uploaded ? (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-zinc-400 max-w-[180px] truncate">{lifeGoals.name}</p>
                      <button onClick={(e) => clearFile("life", e)} className="text-zinc-500 hover:text-red-500 transition-all p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500">Tap to upload career milestones (hacking, MLT, gym)</p>
                  )}
                </div>
                {lifeGoals.uploaded && <CheckCircle2 className="w-5 h-5 text-yellow-400 flex-shrink-0" />}
              </div>
              <input ref={lifeRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileChange(e, "life")} />
            </div>
          </div>

          <button
            onClick={runAnalysis}
            disabled={!syllabus.uploaded && !eating.uploaded && !lifeGoals.uploaded}
            className="w-full h-14 bg-gradient-to-r from-yellow-400 to-orange-500 disabled:opacity-40 text-black font-black font-heading tracking-wide rounded-xl shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2 haptic-bounce"
          >
            ANALYZE ALL ROUTINES 🧠
          </button>
        </div>
      )}

      {phase === "analyzing" && (
        <div className="min-h-[70vh] flex flex-col justify-center text-center px-6 relative slide-up-enter z-10">
          {/* Animated Brain Synapse Firing Layer */}
          <div className="relative w-40 h-40 mx-auto mb-10 flex items-center justify-center">
            {/* Synapse points */}
            <span className="synapse w-5 h-5 top-0 left-4" style={{ "--gold": "#9333EA" } as React.CSSProperties} />
            <span className="synapse w-4 h-4 bottom-2 right-4" style={{ "--gold": "#FF4444" } as React.CSSProperties} />
            <span className="synapse w-6 h-6 top-1/2 left-2/3" style={{ "--gold": "#FFD700" } as React.CSSProperties} />
            <div className="absolute inset-0 rounded-full border border-purple-500/20 animate-ping" />
            <Brain className="w-24 h-24 text-yellow-400 glow-gold animate-pulse relative z-10" />
          </div>

          <h2 className="text-2xl font-bold font-heading tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500">
            DEMON AI DEVOURING...
          </h2>
          <p className="text-zinc-500 text-xs mt-2 uppercase tracking-widest font-heading">
            Extracting goals and routines from coordinates
          </p>

          {/* Timeline checklists */}
          <div className="mt-8 max-w-xs mx-auto text-left space-y-3 p-4 bg-zinc-950/40 rounded-2xl border border-zinc-900">
            <div className="flex items-center gap-3 text-xs">
              <span className={`w-2 h-2 rounded-full ${analyzingStep >= 1 ? "bg-green-400" : "bg-yellow-400 animate-pulse"}`} />
              <span className={analyzingStep >= 1 ? "text-zinc-400" : "text-zinc-100"}>Extracting syllabus objectives...</span>
              {analyzingStep >= 1 && <span className="text-green-400 font-bold ml-auto">✓</span>}
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className={`w-2 h-2 rounded-full ${analyzingStep >= 2 ? "bg-green-400" : analyzingStep === 1 ? "bg-yellow-400 animate-pulse" : "bg-zinc-800"}`} />
              <span className={analyzingStep >= 2 ? "text-zinc-400" : analyzingStep === 1 ? "text-zinc-100" : "text-zinc-600"}>Identifying patterns & intervals...</span>
              {analyzingStep >= 2 && <span className="text-green-400 font-bold ml-auto">✓</span>}
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className={`w-2 h-2 rounded-full ${analyzingStep >= 3 ? "bg-green-400" : analyzingStep === 2 ? "bg-yellow-400 animate-pulse" : "bg-zinc-800"}`} />
              <span className={analyzingStep >= 3 ? "text-zinc-400" : analyzingStep === 2 ? "text-zinc-100" : "text-zinc-600"}>Synthesizing daily missions...</span>
              {analyzingStep >= 3 && <span className="text-green-400 font-bold ml-auto">✓</span>}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-8 max-w-xs mx-auto w-full">
            <div className="flex justify-between text-[10px] text-zinc-500 font-heading mb-1 uppercase font-bold tracking-wider">
              <span>DESTRUCTURING PROGRESS</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-600 font-heading block mt-2 tracking-wider">
              ESTIMATED TIME: 15 SECONDS
            </span>
          </div>
        </div>
      )}

      {phase === "complete" && (
        <div className="space-y-5 slide-up-enter z-10 relative">
          <header className="text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/10 text-green-400 mx-auto flex items-center justify-center mb-3">
              <Sparkles className="w-7 h-7 fill-green-400/20" />
            </div>
            <h1 className="text-2xl font-black font-heading text-green-400 tracking-wider">
              ANALYSIS COMPLETE
            </h1>
            <p className="text-zinc-500 text-xs mt-1 uppercase tracking-widest">
              EXTRACTED COGNITIVE BATTLE GRID
            </p>
          </header>

          {/* Categorized Insights cards */}
          <div className="space-y-4">
            {extractedGoals.map((eg, idx) => (
              <div key={eg.id} className="glass p-4 rounded-2xl border-zinc-800 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-950/80 border border-zinc-900 flex items-center justify-center flex-shrink-0 text-xl">
                  {eg.category === "study" && "📚"}
                  {eg.category === "health" && "🍽️"}
                  {eg.category === "career" && "💼"}
                  {eg.category === "skill" && "🛡️"}
                  {eg.category === "other" && "🎯"}
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-heading font-bold text-zinc-500 tracking-wider uppercase">
                      {eg.category} GOAL
                    </span>
                    <span className={`text-[8px] font-heading font-bold px-2 py-0.5 rounded-full uppercase ${
                      eg.priority === "high" ? "bg-red-950 text-red-400 border border-red-500/20" :
                      eg.priority === "medium" ? "bg-orange-950 text-orange-400 border border-orange-500/20" :
                      "bg-zinc-900 text-zinc-400"
                    }`}>
                      {eg.priority}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-zinc-200 leading-snug">{eg.goal_text}</h4>
                  <p className="text-[10px] text-zinc-500 font-semibold tracking-wide flex items-center gap-1 uppercase">
                    <span>📅 DEADLINE:</span>
                    <span className="text-zinc-400">{eg.deadline || "NONE"}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleGenerateTasks}
            className="w-full h-14 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-black font-black font-heading tracking-wider rounded-xl shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 animate-pulse haptic-bounce"
          >
            START GENERATING DAILY MISSIONS
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </main>
  );
}