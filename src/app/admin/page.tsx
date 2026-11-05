import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminAutoRefresh } from "@/modules/company/kit";
import { currentAdmin } from "@/modules/company/server/admin-session";
import { DeleteEnquiryButton } from "@/modules/company";
import {
  listEnquiries,
  PAGE_SIZES,
  parseListQuery,
  type ListQuery,
  type SortField,
} from "@/modules/company/server/enquiries";
import { MongoNotConfiguredError } from "@/modules/company/server/mongo";

export const metadata: Metadata = { title: "Contact enquiries" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const href = (query: ListQuery, patch: Partial<ListQuery>) => {
  const next = { ...query, ...patch };
  const params = new URLSearchParams({ page: String(next.page), size: String(next.pageSize), sort: next.sort, dir: next.dir });
  return `/admin?${params}`;
};

// Shown in Indian Standard Time, whatever the server or viewer is set to.
const DATE = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

/** Page numbers to show: first, last, and two either side of the current page, with gaps as null. */
function pageWindow(page: number, pages: number): (number | null)[] {
  const shown = [...new Set([1, pages, page - 2, page - 1, page, page + 1, page + 2])]
    .filter((n) => n >= 1 && n <= pages)
    .sort((a, b) => a - b);
  return shown.flatMap((n, i) => (i > 0 && n - shown[i - 1] > 1 ? [null, n] : [n]));
}

function SortHeader({ query, field, label }: { query: ListQuery; field: SortField; label: string }) {
  const active = query.sort === field;
  const nextDir = active ? (query.dir === "asc" ? "desc" : "asc") : field === "createdAt" ? "desc" : "asc";
  return (
    <th scope="col" aria-sort={active ? (query.dir === "asc" ? "ascending" : "descending") : "none"} className="px-4 py-3 text-left font-medium">
      <Link href={href(query, { sort: field, dir: nextDir, page: 1 })} className="inline-flex items-center gap-1.5 hover:text-foreground">
        {label}
        <span aria-hidden className={active ? "text-accent" : "opacity-30"}>
          {active && query.dir === "asc" ? "↑" : "↓"}
        </span>
      </Link>
    </th>
  );
}

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  // Fail closed: if the account can't be confirmed (signed out, or database unreachable), go to sign-in.
  const admin = await currentAdmin().catch((error: unknown) => {
    console.error("[admin] could not confirm admin session", error);
    return null;
  });
  if (!admin) redirect("/admin/login");

  const query = parseListQuery(await searchParams);
  let result: Awaited<ReturnType<typeof listEnquiries>> | null = null;
  let failure: string | null = null;
  try {
    result = await listEnquiries(query);
  } catch (error) {
    failure =
      error instanceof MongoNotConfiguredError
        ? "MongoDB is not configured. Set MONGODB_URI in the server environment."
        : "Could not reach the database. Check the connection string and Atlas network access, then reload.";
    if (!(error instanceof MongoNotConfiguredError)) console.error("[admin] failed to list enquiries", error);
  }
  const current = result ? { ...query, page: result.page } : query;

  const first = result && result.total ? (result.page - 1) * current.pageSize + 1 : 0;
  const last = result ? Math.min(result.total, result.page * current.pageSize) : 0;

  return (
    <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-medium tracking-wide text-accent uppercase">AFVAR · Admin</p>
          <h1 className="mt-1 text-[26px] font-semibold">Contact enquiries</h1>
          <p className="mt-1 text-[13.5px] text-muted">
            {result ? `${result.total.toLocaleString("en-GB")} total` : "—"} · signed in as {admin}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AdminAutoRefresh />
          <form action="/api/admin/logout" method="post">
            <button type="submit" className="h-10 rounded-full border border-border-subtle px-4 text-[13.5px] font-medium hover:border-accent">
              Sign out
            </button>
          </form>
        </div>
      </header>

      {failure ? (
        <p role="alert" className="mt-8 rounded-xl border border-border-subtle bg-surface p-5 text-[14px] text-negative">
          {failure}
        </p>
      ) : result && result.total === 0 ? (
        <p className="mt-8 rounded-xl border border-border-subtle bg-surface p-8 text-center text-[14px] text-muted">No enquiries yet.</p>
      ) : result ? (
        <>
          <div className="mt-8 overflow-x-auto rounded-xl border border-border-subtle bg-surface">
            <table className="w-full min-w-[800px] text-[13.5px]">
              <thead className="border-b border-border-subtle text-[12px] text-muted">
                <tr>
                  <SortHeader query={current} field="createdAt" label="Received (IST)" />
                  <SortHeader query={current} field="name" label="Name" />
                  <SortHeader query={current} field="email" label="Email" />
                  <th scope="col" className="px-4 py-3 text-left font-medium">
                    Message
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((row) => (
                  <tr key={row.id} className="border-b border-border-subtle/60 align-top last:border-0">
                    <td className="px-4 py-3 whitespace-nowrap text-muted">
                      <time dateTime={row.createdAt}>{DATE.format(new Date(row.createdAt))}</time>
                    </td>
                    <td className="px-4 py-3 font-medium break-words">{row.name}</td>
                    <td className="px-4 py-3">
                      <a href={`mailto:${row.email}`} className="text-accent hover:underline">
                        {row.email}
                      </a>
                    </td>
                    <td className="max-w-[46ch] px-4 py-3 whitespace-pre-wrap break-words text-foreground/90">
                      {row.message ? (
                        row.message.length > 180 ? (
                          <details>
                            <summary className="cursor-pointer list-none">
                              {row.message.slice(0, 180)}… <span className="text-accent">Show all</span>
                            </summary>
                            <div className="mt-2">{row.message}</div>
                          </details>
                        ) : (
                          row.message
                        )
                      ) : (
                        <span className="text-muted italic">No message</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <DeleteEnquiryButton id={row.id} name={row.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <nav aria-label="Pagination" className="mt-5 flex flex-wrap items-center justify-between gap-4 text-[13px]">
            <div className="flex flex-wrap items-center gap-3 text-muted">
              <span>
                Showing {first}–{last} of {result.total}
              </span>
              <span className="flex items-center gap-1">
                Per page:
                {PAGE_SIZES.map((size) => (
                  <Link
                    key={size}
                    href={href(current, { pageSize: size, page: 1 })}
                    aria-current={size === current.pageSize ? "true" : undefined}
                    className={`rounded-md px-2 py-1 ${size === current.pageSize ? "bg-surface-raised text-foreground" : "hover:text-foreground"}`}
                  >
                    {size}
                  </Link>
                ))}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <PageLink disabled={result.page <= 1} to={href(current, { page: result.page - 1 })} label="Previous page">
                ‹ Prev
              </PageLink>
              {pageWindow(result.page, result.pages).map((n, i) =>
                n === null ? (
                  <span key={`gap-${i}`} className="px-1.5 text-muted">
                    …
                  </span>
                ) : (
                  <Link
                    key={n}
                    href={href(current, { page: n })}
                    aria-current={n === result.page ? "page" : undefined}
                    className={`grid h-8 min-w-8 place-items-center rounded-md px-2 ${n === result.page ? "bg-accent font-semibold text-black" : "text-muted hover:bg-surface-raised hover:text-foreground"}`}
                  >
                    {n}
                  </Link>
                ),
              )}
              <PageLink disabled={result.page >= result.pages} to={href(current, { page: result.page + 1 })} label="Next page">
                Next ›
              </PageLink>
            </div>
          </nav>
        </>
      ) : null}
    </main>
  );
}

function PageLink({ disabled, to, label, children }: { disabled: boolean; to: string; label: string; children: React.ReactNode }) {
  const style = "inline-flex h-8 items-center rounded-md px-2.5";
  return disabled ? (
    <span aria-disabled="true" className={`${style} text-muted opacity-40`}>
      {children}
    </span>
  ) : (
    <Link href={to} aria-label={label} className={`${style} text-muted hover:bg-surface-raised hover:text-foreground`}>
      {children}
    </Link>
  );
}
