# /home-demo overview reel — production pipeline

The overview video on `/home-demo` is recorded from the page's own 3D chapters
and narrated in English and Hindi. Everything here runs locally on macOS
with no extra installs: Playwright (already a dev dependency) for capture, and
Swift + AVFoundation for H.264 MP4 and audio.

What the page serves (`public/home-demo/`):

| File | What it is |
|---|---|
| `overview.en.mp4` / `.hi.mp4` | The reel with narration per language (the player switches between them) |
| `overview.en.vtt` / `.hi.vtt` | Matching subtitles |
| `overview-poster.jpg` | Frame shown before play |

The current narration is a **temporary synthetic voice** (macOS `say`); the page
caption says so. Replace it with the recorded voice-over per step 3.

| Script | What it does |
|---|---|
| `capture_reel.cjs` | Records one shot per chapter (1920×1080) via Chrome screencast, joins shots with 0.5 s crossfades → `frames.txt` |
| `encode_reel.swift` | Encodes `frames.txt` to a silent H.264 master MP4 |
| `narration.json` | Voice-over cue sheet: start time and slot length per shot, lines in EN / HI, plus the spoken form of AFVAR (“अफ़वार”, one word) |
| `scratch_voice.cjs` | Synthetic voice with macOS `say`; checks every line fits its slot; writes `cues-<lang>.tsv` + WebVTT |
| `mux_voice.swift` | Puts a voice track on the reel without re-encoding the picture (uses only the input's video track) |

The voice-artist brief lives in `docs/home-demo-reel/VOICEOVER-BRIEF.md`.

## 1 · Re-record the reel (after chapters change)

```bash
npm run build && npx next start -p 3100 &
node scripts/home-demo-reel/capture_reel.cjs "$PWD" http://localhost:3100/home-demo /tmp/reel
swiftc -O scripts/home-demo-reel/encode_reel.swift -o /tmp/encode_reel
/tmp/encode_reel /tmp/reel/frames.txt /tmp/reel/master.mp4 1920 1080 30 2500000 /tmp/reel/blend /tmp/reel/resolved.txt
```

Then run step 2 (or 3) with `/tmp/reel/master.mp4` as the picture source. Capture
blocks `/api/home/market`, so the reel always shows **SNAPSHOT** — a recording must
never carry a frozen "LIVE" badge. If shot lengths change, update `start` / `max`
in `narration.json` (shot N starts at the sum of earlier shot lengths minus 15
frames per crossfade).

## 2 · Synthetic voice (current) — also the timing guide for the artist

```bash
node scripts/home-demo-reel/scratch_voice.cjs en /tmp/voice        # Rishi, en-IN
node scripts/home-demo-reel/scratch_voice.cjs hi /tmp/voice        # Lekha, hi-IN
swiftc -O scripts/home-demo-reel/mux_voice.swift -o /tmp/mux_voice
for l in en hi; do
  /tmp/mux_voice public/home-demo/overview.en.mp4 /tmp/voice/cues-$l.tsv /tmp/voice/overview.$l.mp4
  cp /tmp/voice/overview.$l.mp4 public/home-demo/ && cp /tmp/voice/overview.$l.vtt public/home-demo/
done
```

Every line must report `ok`. Any existing `overview.<lang>.mp4` works as the picture
source — only its video track is used. Always write to a temp path first, never
over the file being read.

## 3 · Final voice from the artist

The artist delivers one full-length WAV per language, recorded to picture (starts at 00:00).

```bash
for l in en hi; do
  printf '0\t/path/to/AFVAR-reel-VO-%s.wav\n' $l > /tmp/final-$l.tsv
  /tmp/mux_voice public/home-demo/overview.en.mp4 /tmp/final-$l.tsv /tmp/overview.$l.mp4
done
cp /tmp/overview.{en,hi}.mp4 public/home-demo/
```

Then rebuild the two `.vtt` files from the final timings (same cue text, end
times from the recording), and remove "temporary voice" from the caption in
`src/modules/homeDemo/OverviewVideo.tsx`.

Note: on macOS 27 the Swift tools compile with deprecation warnings for the older
AVAssetReader/Writer APIs; they build and run correctly.
