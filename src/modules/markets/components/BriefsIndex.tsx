import { DEFAULT_LOCALE, translate, type MessageKey, type MessageVars } from "@/platform/i18n";
import { getServerEdition } from "@/platform/i18n/server";
import { BRIEFS, CATEGORIES, type CategoryId } from "../data";
import { marketCopy } from "../content";
import { PageHero, Scene } from "./about/kit";
import { BriefsFilters, type BriefItem } from "./BriefsFilters";
import { Breadcrumb } from "./ui";

/**
 * Market Briefs index (W3.7). Lists only real published editions from `BRIEFS`;
 * while that is empty the page is an honest empty state, never a sample brief.
 * `market` and `q` come from the URL so a filtered view is shareable.
 */
export async function BriefsIndex({ market, q }: { market: string; q: string }) {
  const edition = await getServerEdition();
  const t = (key: MessageKey, vars?: MessageVars) => translate(edition, key, vars);
  const copy = marketCopy(edition);

  const dateFormat = new Intl.DateTimeFormat(DEFAULT_LOCALE[edition], { dateStyle: "medium", timeZone: "UTC" });
  const categoryLabel = (id: CategoryId) => t(CATEGORIES.find((category) => category.id === id)?.titleKey ?? "mk.briefs.title");

  const items: BriefItem[] = BRIEFS.map((brief) => ({
    edition: brief.edition,
    title: t(brief.titleKey),
    category: brief.category,
    categoryLabel: categoryLabel(brief.category),
    publishedUtc: brief.publishedUtc,
    dateLabel: dateFormat.format(new Date(brief.publishedUtc)),
  }));

  const markets = CATEGORIES.map((category) => ({ id: category.id, label: t(category.titleKey) }));
  const initialMarket = markets.some((option) => option.id === market) ? market : "";

  return (
    <>
      <PageHero
        top={<Breadcrumb items={[{ label: t("mk.briefs.crumbMarkets"), href: "/market" }, { label: t("mk.briefs.title") }]} t={t} />}
        eyebrow={`AFVAR · ${t("mk.cat.markets")}`}
        title={[t("mk.briefs.title"), copy.briefs.latest]}
        lede={t("mk.briefs.lede")}
      />
      <Scene kind="briefs" label={copy.briefs.scene[0]} caption={copy.briefs.scene[1]} hint={copy.hint} />

      <div className="mx-auto w-full max-w-6xl px-4 pt-20 pb-28 sm:px-6">
        <BriefsFilters items={items} markets={markets} initialMarket={initialMarket} initialQuery={q} />
      </div>
    </>
  );
}
