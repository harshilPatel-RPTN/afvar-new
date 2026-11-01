/**
 * CSS stand-in for the AI core while WebGL loads, or when it is unavailable.
 * `left`/`top` place the core on desktop (lg+); phones centre it in the upper third.
 */
export function Poster({ left = "62%", top = "50%" }: { left?: string; top?: string }) {
  const place = { "--pl": left, "--pt": top } as React.CSSProperties;
  return (
    <div aria-hidden="true" className="absolute inset-0 bg-[#050607]" style={place}>
      <div className="absolute left-1/2 top-[30%] h-[46vmin] w-[46vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(233,180,76,0.28),transparent_68%)] lg:left-(--pl) lg:top-(--pt)" />
      <div className="absolute left-1/2 top-[30%] h-[13vmin] w-[13vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_38%_35%,#FFD98A,#E9B44C_40%,#7A4E10_85%)] shadow-[0_0_80px_20px_rgba(233,180,76,0.35)] lg:left-(--pl) lg:top-(--pt)" />
    </div>
  );
}
