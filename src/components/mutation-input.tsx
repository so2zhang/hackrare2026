"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DISEASE_INFO, DiseaseKey } from "@/lib/diseases";
import { MutationInput, MutationType } from "@/lib/framemath/types";

interface MutationInputFormProps {
  onSubmit: (mutation: MutationInput) => void;
  isLoading: boolean;
}

const EXAMPLE_MUTATIONS: { label: string; mutation: MutationInput }[] = [
  {
    label: "DMD del exons 45-50 (Classic Duchenne)",
    mutation: { gene: "DMD", mutationType: "deletion", affectedExons: [45, 46, 47, 48, 49, 50] },
  },
  {
    label: "DMD del exon 44 (Casimersen target)",
    mutation: { gene: "DMD", mutationType: "deletion", affectedExons: [44] },
  },
  {
    label: "DMD del exon 52 (Golodirsen target)",
    mutation: { gene: "DMD", mutationType: "deletion", affectedExons: [52] },
  },
  {
    label: "DMD del exons 3-7 (Becker, in-frame)",
    mutation: { gene: "DMD", mutationType: "deletion", affectedExons: [3, 4, 5, 6, 7] },
  },
  {
    label: "USH2A del exon 13 (Ultevursen target)",
    mutation: { gene: "USH2A", mutationType: "deletion", affectedExons: [13] },
  },
];

export function MutationInputForm({ onSubmit, isLoading }: MutationInputFormProps) {
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
  }

  const selectedDisease = DISEASE_INFO[gene as DiseaseKey];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Mutation Input</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="gene">Gene / Disease</Label>
            <Select value={gene} onValueChange={setGene}>
              <SelectTrigger id="gene" className="w-full">
                <SelectValue placeholder="Select a gene..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DISEASE_INFO).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    {info.gene} — {info.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedDisease && (
              <p className="text-sm text-muted-foreground">
                {selectedDisease.description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mutationType">Mutation Type</Label>
            <Select
              value={mutationType}
              onValueChange={(v) => setMutationType(v as MutationType)}
            >
              <SelectTrigger id="mutationType" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deletion">Deletion</SelectItem>
                <SelectItem value="duplication">Duplication</SelectItem>
                <SelectItem value="insertion">Insertion</SelectItem>
                <SelectItem value="point">Point Mutation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exons">Affected Exon(s)</Label>
            <Input
              id="exons"
              placeholder='e.g. "45-50" or "44" or "3, 4, 5, 6, 7"'
              value={exonInput}
              onChange={(e) => setExonInput(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Use commas for individual exons, dashes for ranges
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              placeholder="e.g. c.6439+1G>A or patient notes"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!gene || !exonInput.trim() || isLoading}
          >
            {isLoading ? "Analyzing..." : "Analyze Mutation"}
          </Button>
        </form>

        <div className="mt-6 border-t pt-4">
          <p className="text-sm font-medium text-muted-foreground mb-3">
            Quick examples (validated cases):
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_MUTATIONS.map((ex, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => loadExample(ex.mutation)}
              >
                {ex.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
