/**
 * Still, GPU-cheap background for every page except the lock screen, /login
 * and /register (which keep the animated nebula).
 */
export function StaticBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-[#03060C]">
      <div className="absolute -left-[10%] top-[-20%] h-[70vh] w-[60vw] rounded-full bg-[radial-gradient(closest-side,rgba(79,140,255,.16),transparent)]" />
      <div className="absolute -right-[10%] bottom-[-25%] h-[70vh] w-[60vw] rounded-full bg-[radial-gradient(closest-side,rgba(255,140,110,.10),transparent)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
    </div>
  );
}
