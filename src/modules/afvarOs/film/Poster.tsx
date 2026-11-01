/**
 * CSS stand-in for a page's 3D scene while WebGL loads, or when it is
 * unavailable: a soft mint glow where the scene will sit, over the shared
 * colour field (transparent, like the home). `left`/`top` place it on desktop
 * (lg+); phones centre it in the upper third.
 */
export function Poster({ left = "62%", top = "50%" }: { left?: string; top?: string }) {
  const place = { "--pl": left, "--pt": top } as React.CSSProperties;
  return (
    <div aria-hidden="true" className="absolute inset-0" style={place}>
      <div className="absolute left-1/2 top-[30%] h-[52vmin] w-[52vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(168,222,194,0.16),rgba(49,89,71,0.08)_45%,transparent_70%)] lg:left-(--pl) lg:top-(--pt)" />
    </div>
  );
}
