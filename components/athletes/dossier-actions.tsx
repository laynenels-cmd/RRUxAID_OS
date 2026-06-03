"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Edit } from "lucide-react";
import type { Athlete } from "@/types/domain";
import { AthleteForm } from "@/components/athletes/athlete-form";
import { Button } from "@/components/ui/button";
import { emitToast } from "@/components/ui/toast-provider";

export function DossierActions({ athlete, canWrite }: { athlete: Athlete; canWrite: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [archiving, setArchiving] = useState(false);

  async function archiveAthlete() {
    if (!confirm(`Archive ${athlete.name}? The record will be hidden from active cohort views.`)) return;
    setArchiving(true);
    const response = await fetch(`/api/athletes/${athlete.id}`, { method: "DELETE" });
    setArchiving(false);
    if (!response.ok) {
      emitToast("Archive Failed", "The athlete record was not archived.");
      return;
    }
    emitToast("Athlete Archived", athlete.name);
    router.push("/athletes");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button disabled={!canWrite} onClick={() => setEditing(true)} icon={<Edit className="h-3.5 w-3.5" />}>
        Edit Athlete
      </Button>
      <Button disabled={!canWrite || archiving} variant="danger" onClick={archiveAthlete} icon={<Archive className="h-3.5 w-3.5" />}>
        {archiving ? "Archiving" : "Archive"}
      </Button>
      {editing ? <AthleteForm athlete={athlete} onClose={() => setEditing(false)} /> : null}
    </div>
  );
}
