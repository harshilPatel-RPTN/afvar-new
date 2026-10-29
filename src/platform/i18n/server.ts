import { cookies } from "next/headers";
import { EDITION_COOKIE } from "../storage";
import { DEFAULT_EDITION, isEdition, translate, type Edition, type MessageKey, type MessageVars } from "./core";

/** The edition the visitor last chose, read on the server so the first paint is already in the right language. */
export async function getServerEdition(): Promise<Edition> {
  const value = (await cookies()).get(EDITION_COOKIE)?.value;
  return isEdition(value) ? value : DEFAULT_EDITION;
}

export async function serverT(key: MessageKey, vars?: MessageVars) {
  return translate(await getServerEdition(), key, vars);
}
