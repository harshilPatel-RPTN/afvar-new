import { ClosingCopy, GlobeClosing } from "@/modules/homeDemo";

/**
 * The closing of a single guide or help topic: the home's point globe with the
 * page's own headline, Register Now and one next step. The site frame adds the
 * footer after it.
 */
export function ResourcesClosing({
  title,
  lede,
  primary,
  secondary,
}: {
  title: string;
  lede: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  const next = primary.href.startsWith("http") ? secondary : primary;
  return (
    <GlobeClosing>
      <ClosingCopy title={title} lede={lede} second={next} />
    </GlobeClosing>
  );
}
