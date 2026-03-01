"use client";

import { useRef, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface ProteinViewer3DProps {
  gene: string;
}

const GENE_STRUCTURES: Record<string, {
  url: string;
  label: string;
  protein: string;
  source: string;
  description: string;
}> = {
  DMD: {
    url: "rcsb://3UUN",
    label: "Dystrophin",
    protein: "Spectrin repeats R1-R3",
    source: "PDB: 3UUN",
    description:
      "Crystal structure of dystrophin's spectrin-like repeats — the rod-domain building blocks that link actin to the dystroglycan complex at the muscle membrane.",
  },
  DYSF: {
    url: "rcsb://4IHB",
    label: "Dysferlin",
    protein: "C2A domain",
    source: "PDB: 4IHB",
    description:
      "Crystal structure of the calcium-dependent C2A domain essential for membrane repair and vesicle fusion in skeletal muscle.",
  },
  USH2A: {
    url: "https://alphafold.ebi.ac.uk/files/AF-O75445-2-F1-model_v6.cif",
    label: "Usherin",
    protein: "N-terminal region",
    source: "AlphaFold: O75445",
    description:
      "AlphaFold-predicted structure of usherin's extracellular region — critical for stereocilia and photoreceptor maintenance in the inner ear and retina.",
  },
  DMPK: {
    url: "https://alphafold.ebi.ac.uk/files/AF-Q09013-F1-model_v6.cif",
    label: "DMPK",
    protein: "Serine/threonine kinase",
    source: "AlphaFold: Q09013",
    description:
      "AlphaFold-predicted kinase structure. Note: DM1 pathology stems from toxic CUG RNA repeat expansion, not protein misfolding.",
  },
};

function ViewerCanvas({ config }: { config: typeof GENE_STRUCTURES[string] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;
    let stage: any = null;
    let observer: ResizeObserver | null = null;

    el.innerHTML = "";

    import("ngl").then((NGL) => {
      if (cancelled || !el) return;

      stage = new NGL.Stage(el, { backgroundColor: "white" });
      stageRef.current = stage;

      try {
        const renderer = stage.viewer.renderer;
        renderer.setClearColor(0x000000, 0);
        const canvas = renderer.domElement;
        if (canvas) canvas.style.background = "transparent";
      } catch {}

      observer = new ResizeObserver(() => {
        try { stage?.handleResize(); } catch {}
      });
      observer.observe(el);

      stage
        .loadFile(config.url)
        .then((component: any) => {
          if (cancelled) return;

          component.addRepresentation("cartoon", {
            colorScheme: "residueindex",
            smoothSheet: true,
            quality: "high",
          });

          component.autoView(500);
          stage.setSpin(true);

          try {
            const renderer = stage.viewer.renderer;
            renderer.setClearColor(0x000000, 0);
          } catch {}

          setReady(true);
        })
        .catch(() => {
          if (!cancelled) setError(true);
        });
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      try { stage?.dispose(); } catch {}
      stageRef.current = null;
      if (el) el.innerHTML = "";
    };
  }, [config.url]);

  return (
    <>
      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-muted-foreground">
              Fetching from {config.source.startsWith("PDB") ? "RCSB PDB" : "AlphaFold"}...
            </p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <p className="text-xs text-destructive">Could not load structure</p>
        </div>
      )}
      <div
        ref={containerRef}
        className="w-full h-full transition-opacity duration-500"
        style={{ opacity: ready ? 1 : 0, cursor: "grab" }}
      />
    </>
  );
}

export function ProteinViewer3D({ gene }: ProteinViewer3DProps) {
  const config = GENE_STRUCTURES[gene];
  if (!config) return null;

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="relative w-full max-w-[460px] aspect-square">
        <ViewerCanvas key={gene} config={config} />
        <div className="absolute bottom-2 left-0 right-0 text-center">
          <p className="text-[10px] text-muted-foreground/50">
            Drag to rotate &middot; Scroll to zoom
          </p>
        </div>
      </div>

      <div className="text-center max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-1">
          <h3 className="text-sm font-semibold text-foreground">{config.label}</h3>
          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
            {config.source}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{config.protein}</p>
        <p className="text-[11px] text-muted-foreground/70 mt-1.5 leading-snug">
          {config.description}
        </p>
      </div>
    </div>
  );
}
