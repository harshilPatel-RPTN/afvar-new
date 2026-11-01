"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { useRouter } from "next/navigation";
import { ApiError } from "@/platform/api/client";
import { useT, type MessageKey } from "@/platform/i18n";
import { authApi } from "../api";
import { useLockStore } from "../lock";
import { useAuthStore } from "../store";

export const PIN_LENGTH = 4;

interface PinPadProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  /** Bumped by the parent to replay the shake on a wrong PIN. */
  errorSignal?: number;
  autoFocus?: boolean;
}

/** Four dots over a hidden numeric input: the PIN is typed on the keyboard. */
export function PinPad({ label, value, onChange, onComplete, disabled, errorSignal = 0, autoFocus = true }: PinPadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const shake = useAnimationControls();

  useEffect(() => {
    if (errorSignal > 0) void shake.start({ x: [0, -12, 10, -8, 5, -2, 0], transition: { duration: 0.45 } });
  }, [errorSignal, shake]);

  // Disabling the input while a PIN is checked drops focus; take it back so typing keeps working.
  useEffect(() => {
    if (!disabled && autoFocus) inputRef.current?.focus({ preventScroll: true });
  }, [disabled, autoFocus]);

  const update = (next: string) => {
    const digits = next.replace(/\D/g, "").slice(0, PIN_LENGTH);
    onChange(digits);
    if (digits.length === PIN_LENGTH) onComplete?.(digits);
  };

  // With no on-screen keypad, digits typed while focus is elsewhere on the page still count.
  const latest = useRef({ value, disabled, update });
  useEffect(() => {
    latest.current = { value, disabled, update };
  });
  useEffect(() => {
    if (!autoFocus) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target === inputRef.current || target?.closest("input, textarea, select, [contenteditable]")) return;
      if (event.ctrlKey || event.metaKey || event.altKey || latest.current.disabled) return;
      if (/^\d$/.test(event.key)) latest.current.update(latest.current.value + event.key);
      else if (event.key === "Backspace") latest.current.update(latest.current.value.slice(0, -1));
      else return;
      event.preventDefault();
      inputRef.current?.focus({ preventScroll: true });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [autoFocus]);

  return (
    <div className="flex flex-col items-center gap-5">
      <label htmlFor={inputId} className="text-[13px] font-medium text-white/85 [text-shadow:0_1px_10px_rgba(0,0,0,.6)]">
        {label}
      </label>
      <motion.div animate={shake} className="relative" onClick={() => inputRef.current?.focus()}>
        <input
          ref={inputRef}
          id={inputId}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          pattern="\d*"
          maxLength={PIN_LENGTH}
          autoFocus={autoFocus}
          disabled={disabled}
          value={value}
          onChange={(event) => update(event.target.value)}
          className="absolute inset-0 h-full w-full cursor-default opacity-0"
        />
        <div className="flex gap-4" aria-hidden="true">
          {Array.from({ length: PIN_LENGTH }, (_, index) => (
            <motion.span
              key={index}
              animate={{ scale: index < value.length ? 1.1 : 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className={`h-3.5 w-3.5 rounded-full border-[1.5px] transition-colors ${
                index < value.length ? "border-(--afvar-mint) bg-(--afvar-mint) shadow-[0_0_14px_rgba(168,222,194,.4)]" : "border-(--afvar-muted)/70 bg-transparent"
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/** Enter-then-confirm PIN creation, shared by onboarding and the lock screen. */
export function useCreatePin(onPin: (pin: string) => Promise<void> | void) {
  const [first, setFirst] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<MessageKey | null>(null);
  const [errorSignal, setErrorSignal] = useState(0);
  const [pending, setPending] = useState(false);

  const complete = async (pin: string) => {
    if (first === null) {
      if (/^(\d)\1+$/.test(pin) || "0123456789".includes(pin) || "9876543210".includes(pin)) {
        setError("pin.tooSimple");
        setErrorSignal((count) => count + 1);
        setValue("");
        return;
      }
      setFirst(pin);
      setValue("");
      setError(null);
      return;
    }
    if (pin !== first) {
      setError("pin.mismatch");
      setErrorSignal((count) => count + 1);
      setFirst(null);
      setValue("");
      return;
    }
    setPending(true);
    try {
      await onPin(pin);
    } catch {
      setError("auth.error.unknown");
      setErrorSignal((count) => count + 1);
      setFirst(null);
      setValue("");
    } finally {
      setPending(false);
    }
  };

  return {
    step: first === null ? ("enter" as const) : ("confirm" as const),
    value,
    setValue: (next: string) => {
      setValue(next);
      if (next) setError(null);
    },
    complete: (pin: string) => void complete(pin),
    error,
    errorSignal,
    pending,
  };
}

/**
 * The lock screen's unlock flow: verify the PIN, or create one first if the
 * account has none. Five wrong PINs end the session (password required).
 */
/**
 * `onUnlocked`, when given, takes over after a correct PIN (e.g. navigating to
 * another page) and the tab is NOT unlocked in place — otherwise the unlocked
 * desktop would flash on screen before the navigation lands.
 */
export function AppUnlock({ onUnlocked }: { onUnlocked?: () => void }) {
  const { t } = useT();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setPin = useAuthStore((state) => state.setPin);
  const unlock = useLockStore((state) => state.unlock);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorSignal, setErrorSignal] = useState(0);
  const [pending, setPending] = useState(false);

  const creator = useCreatePin(async (pin) => {
    try {
      const updated = await setPin(pin);
      if (onUnlocked) onUnlocked();
      else unlock(updated.id);
    } catch (failure) {
      // The session died while the PIN was being created: back to the password.
      if (failure instanceof ApiError && failure.status === 401) {
        useAuthStore.getState().clearSession();
        router.replace("/login");
        return;
      }
      throw failure;
    }
  });

  if (!user) return null;

  const signInWithPassword = async () => {
    await useAuthStore.getState().logout();
    router.replace("/login");
  };

  if (!user.appPinSetAt) {
    return (
      <div className="flex flex-col items-center gap-3">
        <PinPad
          label={creator.step === "enter" ? t("pin.create") : t("pin.confirm")}
          value={creator.value}
          onChange={creator.setValue}
          onComplete={creator.complete}
          disabled={creator.pending}
          errorSignal={creator.errorSignal}
        />
        <p role="status" className="min-h-4 text-[12px] text-white/80 [text-shadow:0_1px_8px_rgba(0,0,0,.7)]">
          {creator.error ? t(creator.error) : t("pin.createHint")}
        </p>
        <button type="button" onClick={() => void signInWithPassword()} className="text-[12px] text-(--afvar-muted) underline-offset-4 hover:text-white hover:underline">
          {t("pin.signOut")}
        </button>
      </div>
    );
  }

  const verify = async (pin: string) => {
    setPending(true);
    try {
      await authApi.verifyPin(pin);
      if (onUnlocked) onUnlocked();
      else unlock(user.id);
    } catch (failure) {
      setValue("");
      setErrorSignal((count) => count + 1);
      if (failure instanceof ApiError && failure.code === "pin_locked") {
        useAuthStore.getState().clearSession();
        router.replace("/login?reason=pin_locked");
        return;
      }
      if (failure instanceof ApiError && failure.status === 401 && failure.code !== "wrong_pin") {
        useAuthStore.getState().clearSession();
        router.replace("/login");
        return;
      }
      const left = failure instanceof ApiError ? Number(failure.body.attempts_left) : NaN;
      setError(!Number.isFinite(left) ? t("auth.error.unknown") : left === 1 ? t("pin.wrongOne") : t("pin.wrong", { count: left }));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <PinPad
        label={t("pin.enter")}
        value={value}
        onChange={(next) => {
          setValue(next);
          if (next) setError(null);
        }}
        onComplete={(pin) => void verify(pin)}
        disabled={pending}
        errorSignal={errorSignal}
      />
      <p role="status" className="min-h-4 text-[12px] text-white/85 [text-shadow:0_1px_8px_rgba(0,0,0,.7)]">
        {error}
      </p>
      <button type="button" onClick={() => void signInWithPassword()} className="text-[12px] text-(--afvar-muted) underline-offset-4 hover:text-white hover:underline">
        {t("pin.forgot")}
      </button>
    </div>
  );
}

function NewPinStep({ currentPin, onWrongCurrent, onDone }: { currentPin: string; onWrongCurrent: () => void; onDone: () => void }) {
  const { t } = useT();
  const setPin = useAuthStore((state) => state.setPin);
  const creator = useCreatePin(async (pin) => {
    try {
      await setPin(pin, currentPin);
      onDone();
    } catch (failure) {
      if (failure instanceof ApiError && failure.code === "wrong_pin") onWrongCurrent();
      else throw failure;
    }
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <PinPad
        label={creator.step === "enter" ? t("pin.new") : t("pin.confirm")}
        value={creator.value}
        onChange={creator.setValue}
        onComplete={creator.complete}
        disabled={creator.pending}
        errorSignal={creator.errorSignal}
      />
      <p role="status" className="min-h-4 text-[12px] text-(--afvar-loss)">{creator.error ? t(creator.error) : ""}</p>
    </div>
  );
}

/** Settings → Security: current PIN, then the new PIN twice. */
export function ChangePinForm({ onDone }: { onDone: () => void }) {
  const { t } = useT();
  const [current, setCurrent] = useState<string | null>(null);
  const [currentValue, setCurrentValue] = useState("");
  const [currentError, setCurrentError] = useState<MessageKey | null>(null);
  const [signal, setSignal] = useState(0);

  if (current !== null) {
    return (
      <NewPinStep
        currentPin={current}
        onDone={onDone}
        onWrongCurrent={() => {
          setCurrent(null);
          setCurrentError("auth.error.wrong_pin");
          setSignal((count) => count + 1);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <PinPad
        label={t("pin.current")}
        value={currentValue}
        onChange={(next) => {
          setCurrentValue(next);
          if (next) setCurrentError(null);
        }}
        onComplete={(pin) => {
          setCurrent(pin);
          setCurrentValue("");
        }}
        errorSignal={signal}
      />
      <p role="status" className="min-h-4 text-[12px] text-(--afvar-loss)">{currentError ? t(currentError) : ""}</p>
    </div>
  );
}
