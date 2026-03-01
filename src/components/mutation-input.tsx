"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DISEASE_INFO, DiseaseKey } from "@/lib/diseases";
import { MutationInput, MutationType } from "@/lib/framemath/types";

interface MutationInputFormProps {
  onSubmit: (mutation: MutationInput) => void;
  onGeneChange?: (gene: string) => void;
  isLoading: boolean;
}

const EXAMPLE_MUTATIONS: { label: string; mutation: MutationInput }[] = [
  {
    label: "DMD del 45-50",
    mutation: { gene: "DMD", mutationType: "deletion", affectedExons: [45, 46, 47, 48, 49, 50] },
  },
  {
    label: "DMD del 44",
    mutation: { gene: "DMD", mutationType: "deletion", affectedExons: [44] },
  },
  {
    label: "DMD del 52",
    mutation: { gene: "DMD", mutationType: "deletion", affectedExons: [52] },
  },
  {
    label: "DMD del 3-7",
    mutation: { gene: "DMD", mutationType: "deletion", affectedExons: [3, 4, 5, 6, 7] },
  },
  {
    label: "USH2A del 13",
    mutation: { gene: "USH2A", mutationType: "deletion", affectedExons: [13] },
  },
];

export function MutationInputForm({ onSubmit, onGeneChange, isLoading }: MutationInputFormProps) {
  const [gene, setGene] = useState<string>("");
  const [mutationType, setMutationType] = useState<MutationType>("deletion");
  const [exonInput, setExonInput] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  function parseExons(input: string): number[] {
    const exons: number[] = [];
    const parts = input.split(",").map((s) => s.trim());

    for (const part of parts) {
      if (part.includes("-")) {
        const [startStr, endStr] = part.split("-").map((s) => s.trim());
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) exons.push(i);
        }
      } else {
        const n = parseInt(part, 10);
        if (!isNaN(n)) exons.push(n);
      }
    }

    return [...new Set(exons)].sort((a, b) => a - b);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const affectedExons = parseExons(exonInput);
    if (!gene || affectedExons.length === 0) return;

    onSubmit({
      gene: gene.toUpperCase(),
      mutationType,
      affectedExons,
      description: description || undefined,
    });
  }

  function loadExample(mutation: MutationInput) {
    setGene(mutation.gene);
    setMutationType(mutation.mutationType);
    setExonInput(mutation.affectedExons.join(", "));
    setDescription("");
    onGeneChange?.(mutation.gene);
  }

  const selectedDisease = DISEASE_INFO[gene as DiseaseKey];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Mutation Input</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Specify the patient&apos;s mutation details below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="gene" className="text-xs">Gene / Disease</Label>
          <Select value={gene} onValueChange={(v) => { setGene(v); onGeneChange?.(v); }}>
            <SelectTrigger id="gene" className="w-full h-9 text-sm">
              <SelectValue placeholder="Select a gene..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DISEASE_INFO).map(([key, info]) => (
                <SelectItem key={key} value={key}>
                  <span className="font-medium">{info.gene}</span>
                  <span className="text-muted-foreground ml-1.5">— {info.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedDisease && (
            <p className="text-[11px] text-muted-foreground leading-snug pt-0.5">
              {selectedDisease.description}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mutationType" className="text-xs">Mutation Type</Label>
          <Select
            value={mutationType}
            onValueChange={(v) => setMutationType(v as MutationType)}
          >
            <SelectTrigger id="mutationType" className="w-full h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deletion">Deletion</SelectItem>
              <SelectItem value="duplication">Duplication</SelectItem>
              <SelectItem value="insertion">Insertion</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="exons" className="text-xs">Affected Exon(s)</Label>
          <Input
            id="exons"
            className="h-9 text-sm"
            placeholder='e.g. "45-50" or "44" or "3, 4, 5, 6, 7"'
            value={exonInput}
            onChange={(e) => setExonInput(e.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">
            Commas for individual exons, dashes for ranges
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-xs">Notes (optional)</Label>
          <Input
            id="description"
            className="h-9 text-sm"
            placeholder="e.g. c.6439+1G>A"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          className="w-full h-9 text-sm"
          disabled={!gene || !exonInput.trim() || isLoading}
        >
          {isLoading ? "Analyzing..." : "Analyze Mutation"}
        </Button>
      </form>

      <Separator />

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Quick examples
        </p>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_MUTATIONS.map((ex, i) => (
            <button
              key={i}
              className="px-2.5 py-1 rounded-md border text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-secondary transition-colors"
              onClick={() => loadExample(ex.mutation)}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
