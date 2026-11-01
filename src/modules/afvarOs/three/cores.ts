/** The seven specialist cores of the AFVAR AI (same order and names everywhere). Plain data: no three.js. */
export const AI_CORES = [
  { id: "market", label: "Market core" },
  { id: "macro", label: "Macro core" },
  { id: "news", label: "News core" },
  { id: "risk", label: "Risk core" },
  { id: "memory", label: "Memory core" },
  { id: "voice", label: "Voice core" },
  { id: "verify", label: "Verify core" },
] as const;
export type AiCoreId = (typeof AI_CORES)[number]["id"];
export const coreIndex = (id: AiCoreId) => AI_CORES.findIndex((c) => c.id === id);
