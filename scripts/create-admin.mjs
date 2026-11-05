#!/usr/bin/env node
// Creates an /admin account in MongoDB (collection `admin_users`), or resets
// the password of an existing one. Passwords are stored as scrypt hashes only.
//
//   node --env-file=.env.local scripts/create-admin.mjs <username>
//
// Prompts for the password (hidden). For non-interactive use, pass it in the
// NEW_ADMIN_PASSWORD environment variable instead. Resetting a password signs
// that admin out everywhere.
import { randomBytes, scrypt } from "node:crypto";
import { createInterface } from "node:readline";
import { promisify } from "node:util";
import { MongoClient } from "mongodb";

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

function promptHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (text) => {
      if (text.includes(question)) process.stdout.write(text);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const username = process.argv[2]?.trim();
if (!username) fail("Usage: node --env-file=.env.local scripts/create-admin.mjs <username>");
if (!/^[A-Za-z0-9._@-]{3,64}$/.test(username)) fail("Username: 3–64 characters, letters, digits, . _ @ - only.");
if (!process.env.MONGODB_URI) fail("MONGODB_URI is not set (run with --env-file=.env.local).");

const password = process.env.NEW_ADMIN_PASSWORD ?? (await promptHidden(`Password for ${username}: `));
if (password.length < 12) fail("Password must be at least 12 characters.");

const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
try {
  await client.connect();
  const users = client.db(process.env.MONGODB_DB || "afvar").collection("admin_users");
  await users.createIndex({ username: 1 }, { unique: true });
  const now = new Date();
  const result = await users.updateOne(
    { username },
    { $set: { passwordHash: await hashPassword(password), passwordUpdatedAt: now }, $setOnInsert: { username, createdAt: now } },
    { upsert: true },
  );
  console.log(result.upsertedCount ? `Created admin "${username}".` : `Updated password for admin "${username}".`);
} catch (error) {
  fail(`Could not save the admin account: ${error.message}`);
} finally {
  await client.close();
}
