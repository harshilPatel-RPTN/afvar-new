// D2 — a large line, shown whole (no scroll-linked word-by-word lighting).
export function WordLight({ text, id, className }: { text: string; id?: string; className?: string }) {
  return (
    <p id={id} className={className}>
      {text}
    </p>
  );
}
