"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, ChevronsRight, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import type { Athlete, Buildout, BuildoutTask } from "@/types/domain";
import { buildoutTaskSchema } from "@/lib/validators/schemas";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldError, FieldLabel, Input, Select, Textarea } from "@/components/ui/form-field";
import { emitToast } from "@/components/ui/toast-provider";

type BuildoutRow = Buildout & { athlete: Athlete | null; tasks: BuildoutTask[] };
type TaskFormValues = {
  buildout_id: string;
  title: string;
  description: string;
  status: BuildoutTask["status"];
  due_date: string;
};

export function BuildoutWorkspace({
  buildouts,
  canWrite,
}: {
  buildouts: BuildoutRow[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [taskBuildout, setTaskBuildout] = useState<BuildoutRow | null>(null);
  const lanes = useMemo(() => {
    return Array.from({ length: 10 }, (_, index) => index + 1).map((stage) => ({
      stage,
      buildouts: buildouts.filter((buildout) => buildout.stage === stage),
    }));
  }, [buildouts]);

  async function action(path: string, body?: unknown) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      emitToast("Buildout Update Failed", payload.error || "Update was not saved.");
      return;
    }
    emitToast("Buildout Updated", "Changes persisted.");
    router.refresh();
  }

  async function completeTask(id: string) {
    const response = await fetch(`/api/buildouts/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    if (!response.ok) {
      emitToast("Task Update Failed", "Task status was not saved.");
      return;
    }
    emitToast("Task Completed");
    router.refresh();
  }

  return (
    <div className="grid gap-3">
      <div className="border-b border-line px-1 pb-4">
        <div className="mono-label mb-2 text-accent">Buildout Tracker</div>
        <h1 className="display-title text-3xl font-medium text-text">10-Stage Revenue Infrastructure Buildout</h1>
        <p className="mt-3 max-w-3xl font-mono text-[11px] leading-6 text-text-low">
          Stage advancement, blocked state, task creation, and completion persist to the backend.
        </p>
      </div>

      <div className="grid gap-3 overflow-x-auto pb-2 xl:grid-cols-5">
        {lanes.map((lane) => (
          <div key={lane.stage} className="min-w-[250px] border border-line bg-bg-2">
            <div className="flex items-center justify-between border-b border-line px-3 py-2">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-dim">Stage {lane.stage}</div>
              <div className="bg-onyx-hi px-2 py-1 font-mono text-[9px] text-text-low">{lane.buildouts.length}</div>
            </div>
            <div className="grid gap-2 p-2">
              {lane.buildouts.map((buildout) => (
                <div key={buildout.id} className="border border-line bg-onyx p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-[11px] text-text">{buildout.athlete?.name || "Unknown Athlete"}</div>
                      <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-text-min">{buildout.owner || "Unassigned"}</div>
                    </div>
                    <Badge tone={statusTone(buildout.status)}>{buildout.status}</Badge>
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between font-mono text-[10px] text-text-low">
                      <span>Progress</span>
                      <span>{buildout.percent_complete}%</span>
                    </div>
                    <div className="h-2 bg-onyx-hi">
                      <div className="h-2 bg-accent" style={{ width: `${buildout.percent_complete}%` }} />
                    </div>
                  </div>
                  <p className="mt-3 font-mono text-[10px] leading-5 text-text-dim">{buildout.next_action || "No next action recorded."}</p>
                  {buildout.blocker ? (
                    <div className="mt-3 border border-[rgba(255,176,32,0.34)] bg-[rgba(255,176,32,0.08)] p-2 font-mono text-[10px] leading-5 text-amber">
                      {buildout.blocker}
                    </div>
                  ) : null}
                  <div className="mt-3 grid gap-2">
                    {buildout.tasks.slice(0, 3).map((task) => (
                      <button
                        key={task.id}
                        disabled={!canWrite || task.status === "done"}
                        onClick={() => completeTask(task.id)}
                        className="flex items-center gap-2 border border-line-soft bg-bg p-2 text-left font-mono text-[10px] text-text-low disabled:opacity-50"
                      >
                        <Check className={task.status === "done" ? "h-3.5 w-3.5 text-accent" : "h-3.5 w-3.5 text-text-min"} />
                        {task.title}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button disabled={!canWrite || buildout.status === "complete"} size="sm" onClick={() => action(`/api/buildouts/${buildout.id}/advance`)} icon={<ChevronsRight className="h-3.5 w-3.5" />}>
                      Advance
                    </Button>
                    <Button disabled={!canWrite || buildout.status === "blocked"} size="sm" onClick={() => action(`/api/buildouts/${buildout.id}/status`, { status: "blocked", blocker: buildout.blocker || "Operator marked blocked." })} icon={<AlertTriangle className="h-3.5 w-3.5" />}>
                      Block
                    </Button>
                    <Button disabled={!canWrite} size="sm" onClick={() => setTaskBuildout(buildout)} icon={<Plus className="h-3.5 w-3.5" />}>
                      Task
                    </Button>
                    <Button disabled={!canWrite || buildout.status === "complete"} size="sm" onClick={() => action(`/api/buildouts/${buildout.id}/status`, { status: "complete" })}>
                      Complete
                    </Button>
                  </div>
                </div>
              ))}
              {!lane.buildouts.length ? <div className="p-6 text-center font-mono text-[10px] text-text-min">No buildouts in this stage.</div> : null}
            </div>
          </div>
        ))}
      </div>

      {taskBuildout ? <TaskForm buildout={taskBuildout} onClose={() => setTaskBuildout(null)} /> : null}
    </div>
  );
}

function TaskForm({ buildout, onClose }: { buildout: BuildoutRow; onClose: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<TaskFormValues>({
    defaultValues: {
      buildout_id: buildout.id,
      title: "",
      description: "",
      status: "todo",
      due_date: "",
    },
  });

  async function submit(values: TaskFormValues) {
    const parsed = buildoutTaskSchema.safeParse({
      ...values,
      due_date: values.due_date || null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Invalid task payload.");
      return;
    }
    const response = await fetch("/api/buildouts/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || "Task save failed.");
      return;
    }
    emitToast("Task Created", values.title);
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <form onSubmit={form.handleSubmit(submit)} className="w-full max-w-xl border border-line-hi bg-bg-2">
        <div className="border-b border-line p-4">
          <div className="mono-label">Create Task</div>
          <div className="display-title text-base font-medium text-text">{buildout.athlete?.name}</div>
        </div>
        <div className="grid gap-4 p-4">
          <div>
            <FieldLabel>Title</FieldLabel>
            <Input {...form.register("title")} />
          </div>
          <div>
            <FieldLabel>Description</FieldLabel>
            <Textarea {...form.register("description")} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Status</FieldLabel>
              <Select {...form.register("status")}>
                <option value="todo">Todo</option>
                <option value="doing">Doing</option>
                <option value="blocked">Blocked</option>
              </Select>
            </div>
            <div>
              <FieldLabel>Due Date</FieldLabel>
              <Input type="date" {...form.register("due_date")} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-line p-4">
          <FieldError>{error}</FieldError>
          <Button type="button" variant="ghost" className="ml-auto" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Create Task</Button>
        </div>
      </form>
    </div>
  );
}
