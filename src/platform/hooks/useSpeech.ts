"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// The Web Speech API is not in TypeScript's DOM lib yet; this is the part we use.
interface RecognitionResultEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type RecognitionConstructor = new () => Recognition;

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const scope = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

/** Push-to-talk speech recognition; `supported` is false in browsers without it (e.g. Firefox). */
export function useSpeechRecognition(lang: string, onResult: (transcript: string) => void) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  });

  useEffect(() => () => recognition.current?.stop(), []);

  const start = useCallback(() => {
    const Constructor = recognitionConstructor();
    if (!Constructor) return;
    const instance = new Constructor();
    instance.lang = lang;
    instance.interimResults = false;
    instance.maxAlternatives = 1;
    instance.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) onResultRef.current(transcript);
    };
    instance.onerror = (event) => setError(event.error);
    instance.onend = () => setListening(false);
    recognition.current = instance;
    setError(null);
    setListening(true);
    instance.start();
  }, [lang]);

  const stop = useCallback(() => recognition.current?.stop(), []);

  // Only read in event handlers, so it never affects server-rendered markup.
  const supported = recognitionConstructor() !== null;
  return { supported, listening, error, start, stop };
}

/** Speaks text with the browser's voice; returns false when speech synthesis is unavailable. */
export function speak(text: string, lang: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}
