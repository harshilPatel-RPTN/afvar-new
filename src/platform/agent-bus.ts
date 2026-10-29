"use client";

import { useEffect } from "react";

/**
 * The frontend side of the OS Agent: validated commands from the assistant
 * (and later the command palette) arrive here, and the desktop executes them.
 * Only whitelisted actions exist — there is no trading command, by design.
 */
export type AgentCommand =
  | { type: "open_window"; window: string }
  | { type: "close_window"; window: string }
  | { type: "close_all" };

type Listener = (command: AgentCommand) => void;
const listeners = new Set<Listener>();

export function emitAgentCommand(command: AgentCommand) {
  listeners.forEach((listener) => listener(command));
}

export function useAgentCommands(listener: Listener) {
  useEffect(() => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [listener]);
}
