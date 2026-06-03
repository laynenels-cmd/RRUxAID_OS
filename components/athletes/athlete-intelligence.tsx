"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import type { Athlete } from "@/types/domain";
import { AthleteForm } from "@/components/athletes/athlete-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/form-field";
import { currency, numberCompact } from "@/lib/utils/format";

export function AthleteIntelligence({ athletes }: { athletes: Athlete[] }) {
  const [query, setQuery] = useState("");
  const [sport, setSport] = useState("all");
  const [stage, setStage] = useState("all");
  const [tier, setTier] = useState("all");
  const [sort, setSort] = useState("readiness");
  const [creating, setCreating] = useState(false);

  const sports = Array.from(new Set(athletes.map((athlete) => athlete.sport))).sort();
  const stages = Array.from(new Set(athletes.map((athlete) => athlete.stage || "Unstaged"))).sort();

  const filtered = useMemo(() => {
    return athletes
      .filter((athlete) => {
        const q = query.toLowerCase();
        const readiness = athlete.readiness_score || 0;
        const matchesQuery = [athlete.name, athlete.code, athlete.sport, athlete.stage || ""].join(" ").toLowerCase().includes(q);
        const matchesSport = sport === "all" || athlete.sport === sport;
        const matchesStage = stage === "all" || athlete.stage === stage;
        const matchesTier =
          tier === "all" ||
          (tier === "high" && readiness >= 75) ||
          (tier === "mid" && readiness >= 55 && readiness < 75) ||
          (tier === "low" && readiness < 55);
        return matchesQuery && matchesSport && matchesStage && matchesTier;
      })
      .sort((a, b) => {
        if (sort === "pipeline") return Number(b.pipeline_value || 0) - Number(a.pipeline_value || 0);
        if (sort === "updated") return b.updated_at.localeCompare(a.updated_at);
        return Number(b.readiness_score || 0) - Number(a.readiness_score || 0);
      });
  }, [athletes, query, sort, sport, stage, tier]);

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-4 border-b border-line px-1 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mono-label mb-2 text-accent">Athlete Intelligence</div>
          <h1 className="display-title text-3xl font-medium text-text">Cohort Revenue Readiness</h1>
          <p className="mt-3 max-w-3xl font-mono text-[11px] leading-6 text-text-low">
            Search, filter, create, and maintain athlete revenue infrastructure records.
          </p>
        </div>
        <Button variant="primary" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setCreating(true)}>
          Create Athlete
        </Button>
      </div>

      <Card>
        <CardBody className="grid gap-3 lg:grid-cols-[1fr_160px_190px_150px_170px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-text-min" />
            <Input className="pl-9" placeholder="Search athlete, code, sport, stage" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <Select value={sport} onChange={(event) => setSport(event.target.value)}>
            <option value="all">All sports</option>
            {sports.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </Select>
          <Select value={stage} onChange={(event) => setStage(event.target.value)}>
            <option value="all">All stages</option>
            {stages.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </Select>
          <Select value={tier} onChange={(event) => setTier(event.target.value)}>
            <option value="all">All readiness</option>
            <option value="high">75+</option>
            <option value="mid">55-74</option>
            <option value="low">Under 55</option>
          </Select>
          <Select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="readiness">Sort readiness</option>
            <option value="pipeline">Sort pipeline value</option>
            <option value="updated">Sort updated date</option>
          </Select>
        </CardBody>
      </Card>

      <div className="grid gap-3 xl:grid-cols-3">
        {filtered.map((athlete) => (
          <Link key={athlete.id} href={`/athletes/${athlete.id}`} className="panel block p-4 transition hover:border-[rgba(0,255,102,0.34)] hover:bg-onyx">
            <div className="flex gap-3 border-b border-line-soft pb-3">
              <div className="grid h-12 w-12 place-items-center border border-line bg-bg-2 display-title text-base text-text">
                {athlete.avatar_initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="display-title truncate text-base font-medium text-text">{athlete.name}</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-text-low">{athlete.sport} / {athlete.level}</div>
                <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-text-min">{athlete.code}</div>
              </div>
              <div className="text-right font-mono text-2xl text-accent">{athlete.readiness_score}</div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Meta label="Audience" value={athlete.audience_label || numberCompact(athlete.audience_count)} />
              <Meta label="Pipeline" value={currency(athlete.pipeline_value)} />
              <Meta label="Owner" value={athlete.owner || "Unassigned"} />
              <Meta label="Stage" value={athlete.stage || "Intake"} />
            </div>
            <div className="mt-3 border border-line-soft bg-bg p-3 font-mono text-[10px] leading-5 text-text-dim">
              <span className="text-amber">Leak:</span> {athlete.current_leak || "No leak recorded."}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <Badge tone="green">{athlete.platforms.join(" / ") || "No Platforms"}</Badge>
              <SlidersHorizontal className="h-4 w-4 text-text-min" />
            </div>
          </Link>
        ))}
      </div>

      {!filtered.length ? (
        <Card>
          <CardHeader title="No Athletes Match" label="Empty State" />
          <CardBody>
            <p className="font-mono text-[11px] text-text-low">Adjust filters or create a new athlete record.</p>
          </CardBody>
        </Card>
      ) : null}

      {creating ? <AthleteForm onClose={() => setCreating(false)} /> : null}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mono-label">{label}</div>
      <div className="mt-1 truncate font-mono text-[11px] text-text">{value}</div>
    </div>
  );
}
