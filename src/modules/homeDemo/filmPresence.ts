// The film-presence signal now lives in the shared kit, so every AFVAR film
// (home, platform…) drives the same floating extras. Re-exported for the
// home's existing imports.
export { setFilmOnScreen, useFilmOnScreen } from "@/modules/afvarOs";
