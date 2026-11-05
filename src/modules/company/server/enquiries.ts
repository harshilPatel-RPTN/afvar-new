// Contact-us enquiries stored in MongoDB (collection `contact_enquiries`):
// validation for /api/contact and the paged, sorted listing for /admin.
import { ObjectId, type Collection, type Sort } from "mongodb";
import { getDb } from "./mongo";

export const NAME_MAX = 120;
export const EMAIL_MAX = 254;
export const MESSAGE_MAX = 5_000;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface EnquiryInput {
  name: string;
  email: string;
  message: string | null;
}

interface EnquiryDoc extends EnquiryInput {
  createdAt: Date;
}

export interface Enquiry extends EnquiryInput {
  id: string;
  createdAt: string;
}

export type EnquiryErrors = Partial<Record<keyof EnquiryInput, string>>;

/** Trims and checks a raw body; returns the clean input or per-field errors. */
export function parseEnquiry(body: Record<string, unknown>): { input: EnquiryInput } | { errors: EnquiryErrors } {
  const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
  const name = text(body.name).replace(/\s+/g, " ");
  const email = text(body.email).toLowerCase();
  const message = text(body.message);
  const errors: EnquiryErrors = {};
  if (!name) errors.name = "Enter your name.";
  else if (name.length > NAME_MAX) errors.name = `Keep your name under ${NAME_MAX} characters.`;
  if (!EMAIL_PATTERN.test(email) || email.length > EMAIL_MAX) errors.email = "Enter a valid email address.";
  if (message.length > MESSAGE_MAX) errors.message = `Keep the message under ${MESSAGE_MAX} characters.`;
  if (Object.keys(errors).length) return { errors };
  return { input: { name, email, message: message || null } };
}

let indexed: Promise<unknown> | null = null;

async function collection(): Promise<Collection<EnquiryDoc>> {
  const col = (await getDb()).collection<EnquiryDoc>("contact_enquiries");
  // Once per process: the default sort (newest first) and the email sort stay index-backed.
  indexed ??= col
    .createIndexes([{ key: { createdAt: -1 } }, { key: { email: 1 } }])
    .catch((error: unknown) => {
      indexed = null;
      throw error;
    });
  await indexed;
  return col;
}

export async function saveEnquiry(input: EnquiryInput): Promise<string> {
  const result = await (await collection()).insertOne({ ...input, createdAt: new Date() });
  return result.insertedId.toHexString();
}

/** Removes one enquiry by id. Returns false when the id is malformed or nothing matched. */
export async function deleteEnquiry(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const result = await (await collection()).deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

export const SORT_FIELDS = ["createdAt", "name", "email"] as const;
export type SortField = (typeof SORT_FIELDS)[number];
export type SortDir = "asc" | "desc";
export const PAGE_SIZES = [10, 25, 50, 100] as const;

export interface ListQuery {
  page: number;
  pageSize: number;
  sort: SortField;
  dir: SortDir;
}

/** Reads `?page=&size=&sort=&dir=` leniently: anything unknown falls back to the defaults. */
export function parseListQuery(params: Record<string, string | string[] | undefined>): ListQuery {
  const one = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const sort = (SORT_FIELDS as readonly string[]).includes(one("sort") ?? "") ? (one("sort") as SortField) : "createdAt";
  const dir: SortDir = one("dir") === "asc" ? "asc" : one("dir") === "desc" ? "desc" : sort === "createdAt" ? "desc" : "asc";
  const size = Number(one("size"));
  const pageSize = (PAGE_SIZES as readonly number[]).includes(size) ? size : 25;
  const page = Math.max(1, Math.floor(Number(one("page"))) || 1);
  return { page, pageSize, sort, dir };
}

export async function listEnquiries(query: ListQuery): Promise<{ items: Enquiry[]; total: number; page: number; pages: number }> {
  const col = await collection();
  const total = await col.countDocuments();
  const pages = Math.max(1, Math.ceil(total / query.pageSize));
  const page = Math.min(query.page, pages);
  const order = query.dir === "asc" ? 1 : -1;
  // _id breaks ties so rows never repeat or vanish across pages.
  const sort: Sort = { [query.sort]: order, _id: order };
  const docs = await col
    .find({}, query.sort === "name" ? { collation: { locale: "en", strength: 2 } } : {})
    .sort(sort)
    .skip((page - 1) * query.pageSize)
    .limit(query.pageSize)
    .toArray();
  const items = docs.map((doc) => ({
    id: doc._id.toHexString(),
    name: doc.name,
    email: doc.email,
    message: doc.message ?? null,
    createdAt: doc.createdAt.toISOString(),
  }));
  return { items, total, page, pages };
}
