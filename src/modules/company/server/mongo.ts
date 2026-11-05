// One shared MongoClient per server process. Cached on globalThis so `next dev`
// hot reloads reuse the open connection pool instead of opening a new one per edit.
//
// Env: MONGODB_URI (mongodb+srv://user:pass@host/), MONGODB_DB (defaults to "afvar").
import { MongoClient, type Db } from "mongodb";

const cache = globalThis as typeof globalThis & { __afvarMongo?: Promise<MongoClient> };

export class MongoNotConfiguredError extends Error {
  constructor() {
    super("MONGODB_URI is not set");
  }
}

export async function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new MongoNotConfiguredError();
  cache.__afvarMongo ??= new MongoClient(uri, { serverSelectionTimeoutMS: 8_000, appName: "afvar-web" })
    .connect()
    .catch((error: unknown) => {
      // Let the next request retry instead of caching a failed connection forever.
      cache.__afvarMongo = undefined;
      throw error;
    });
  const client = await cache.__afvarMongo;
  return client.db(process.env.MONGODB_DB || "afvar");
}
