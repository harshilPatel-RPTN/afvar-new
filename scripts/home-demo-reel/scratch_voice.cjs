// Builds a scratch (guide) voice track for the overview reel with macOS `say`,
// so timing can be reviewed before the voice artist records. For each cue in
// narration.json it renders the line, measures it against the slot, and
// writes cues.tsv (for mux_voice.swift) plus a WebVTT subtitle file.
// Subtitles sit near the top (line:0, wrapped to 86% width) — the reel burns its own captions in at the bottom.
// The voice reads the `pronounce` forms (AFVAR → "अफ़वार", one word); the
// subtitles keep the written brand.
//
// usage: node scratch_voice.cjs <en|hi> <outDir> [rate=165]
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const [lang, outDir, rateArg] = process.argv.slice(2);
const VOICES = { en: "Rishi", hi: "Lekha" };
if (!VOICES[lang] || !outDir) {
  console.error("usage: node scratch_voice.cjs <en|hi> <outDir> [rate]");
  process.exit(2);
}
const rate = String(rateArg || 165);
const { cues, pronounce = {} } = JSON.parse(fs.readFileSync(path.join(__dirname, "narration.json"), "utf8"));
fs.mkdirSync(outDir, { recursive: true });

/** The line as it should be spoken: written words swapped for their spoken form. */
const spoken = (text) =>
  Object.entries(pronounce).reduce((t, [word, forms]) => (forms[lang] ? t.split(word).join(forms[lang]) : t), text);

const vttTime = (s) => {
  const ms = Math.round(s * 1000);
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const sec = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  return `${h}:${m}:${sec}.${String(ms % 1000).padStart(3, "0")}`;
};

const tsv = [];
const vtt = ["WEBVTT", ""];
const report = [];
cues.forEach((cue, i) => {
  const file = path.join(outDir, `${lang}-${String(i + 1).padStart(2, "0")}.aiff`);
  execFileSync("say", ["-v", VOICES[lang], "-r", rate, "-o", file, spoken(cue[lang])]);
  const info = execFileSync("afinfo", [file], { encoding: "utf8" });
  const seconds = Number(/estimated duration: ([\d.]+)/.exec(info)?.[1] ?? NaN);
  tsv.push(`${cue.start}\t${file}`);
  vtt.push(String(i + 1), `${vttTime(cue.start)} --> ${vttTime(cue.start + Math.min(seconds, cue.max))} line:0 size:86% align:center`, cue[lang], "");
  report.push({ shot: cue.shot, seconds: +seconds.toFixed(2), max: cue.max, fits: seconds <= cue.max ? "ok" : `OVER by ${(seconds - cue.max).toFixed(2)}s` });
});

fs.writeFileSync(path.join(outDir, `cues-${lang}.tsv`), tsv.join("\n") + "\n");
fs.writeFileSync(path.join(outDir, `overview.${lang}.vtt`), vtt.join("\n"));
console.table(report);
