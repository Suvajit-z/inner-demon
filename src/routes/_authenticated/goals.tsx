import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { importGoalsFromText, listGoals, deleteGoal } from "@/lib/goals.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { FileUp, Sparkles, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/goals")({
  component: GoalsPage,
});

async function extractPdfText(file: File): Promise<string> {
  // Dynamic import to avoid SSR
  const pdfjs: any = await import("pdfjs-dist");
  const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  let out = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    out += content.items.map((it: any) => it.str).join(" ") + "\n\n";
  }
  return out.trim();
}

function GoalsPage() {
  const importFn = useServerFn(importGoalsFromText);
  const listFn = useServerFn(listGoals);
  const delFn = useServerFn(deleteGoal);

  const [pasted, setPasted] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: goals, refetch } = useQuery({
    queryKey: ["goals"],
    queryFn: () => listFn(),
  });

  async function handlePaste() {
    if (pasted.trim().length < 20) return toast.error("Add more detail to analyze.");
    setBusy(true);
    try {
      const r = await importFn({ data: { text: pasted, source: "paste" } });
      toast.success(`Imported ${r.goalsImported} goal(s), ${r.subtasksImported} sub-tasks.`);
      setPasted("");
      refetch();
    } catch (e: any) {
      toast.error(e.message ?? "Import failed");
    } finally {
      setBusy(false);
    }
  }

  async function handlePdf(file: File) {
    setBusy(true);
    try {
      toast.message("Reading PDF…");
      const text = await extractPdfText(file);
      if (text.length < 20) throw new Error("No text found in PDF.");
      toast.message("Analyzing with AI…");
      const r = await importFn({ data: { text, source: "pdf" } });
      toast.success(`Imported ${r.goalsImported} goal(s), ${r.subtasksImported} sub-tasks.`);
      refetch();
    } catch (e: any) {
      toast.error(e.message ?? "PDF import failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this goal and its sub-tasks?")) return;
    await delFn({ data: { id } });
    refetch();
    toast.success("Goal removed.");
  }

  return (
    <main className="mx-auto max-w-md px-4 pt-6">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Target className="h-6 w-6 text-primary" />
          Your goals
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Feed me your plans. I'll generate your daily missions.
        </p>
      </header>

      {/* PDF upload */}
      <Card className="mb-4 p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Upload PDF
        </h2>
        <label className="flex h-28 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/30 transition-colors hover:border-primary/50 hover:bg-secondary/50">
          <FileUp className="mb-2 h-6 w-6 text-primary" />
          <span className="text-sm font-medium">Tap to choose a PDF</span>
          <span className="mt-1 text-xs text-muted-foreground">Study plans, routines, syllabi</span>
          <input
            type="file"
            accept="application/pdf"
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handlePdf(f);
              e.target.value = "";
            }}
          />
        </label>
      </Card>

      {/* Paste */}
      <Card className="mb-6 p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Paste your goals
        </h2>
        <Textarea
          placeholder="Paste goals, routines, or study plans from anywhere..."
          rows={6}
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          disabled={busy}
        />
        <Button onClick={handlePaste} disabled={busy} className="mt-3 w-full font-semibold">
          <Sparkles className="mr-2 h-4 w-4" />
          {busy ? "Analyzing…" : "Analyze & Import"}
        </Button>
      </Card>

      {/* Existing goals */}
      <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
        Imported ({goals?.length ?? 0})
      </h2>
      {goals && goals.length > 0 ? (
        <ul className="space-y-2">
          {goals.map((g) => (
            <li key={g.id}>
              <Card className="flex items-start gap-3 p-4">
                <div className="flex-1">
                  <p className="font-medium">{g.title}</p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{g.subtask_done}/{g.subtask_total} sub-tasks</span>
                    {g.deadline && <span>Due {g.deadline}</span>}
                    <span className="uppercase">{g.source}</span>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(g.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No goals yet. Upload or paste to begin.</p>
      )}
    </main>
  );
}
