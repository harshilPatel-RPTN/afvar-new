// Privacy, Terms and Cookies: the footer links to them. The full documents are
// published before launch; until then each page states only verified facts
// about what this preview website does.
import type { ReactNode } from "react";
import { SiteFrame } from "@/modules/homeDemo";

const UPDATED = "1 November 2026";

function Legal({ id, eyebrow, title, lede, children }: { id: string; eyebrow: string; title: string; lede: string; children: ReactNode }) {
  return (
    <SiteFrame nav="back">
      <article aria-labelledby={`${id}-t`} className="bg-transparent px-5 pb-28 pt-[136px] sm:px-8 lg:px-16">
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#A8DEC2]">{eyebrow}</p>
          <h1 id={`${id}-t`} className="mt-4 text-[clamp(2.1rem,5vw,3.4rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-[#F2F5F2]">
            {title}
          </h1>
          <p className="mt-5 text-[17px] leading-relaxed text-[#B7C5BC]">{lede}</p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-[rgba(246,185,74,0.45)] px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#F6B94A]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F6B94A]" />
            Full document published before launch · last checked {UPDATED}
          </p>
          <div className="mt-12 space-y-10">{children}</div>
          <p className="mt-14 border-t border-[rgba(255,255,255,0.08)] pt-6 text-[14px] leading-relaxed text-[#B7C5BC]">
            Questions about this page? Write to the team through{" "}
            <a href="/contact" className="inline-flex min-h-10 items-center text-[#A8DEC2] underline-offset-4 hover:underline">
              Contact
            </a>
            . AFVAR is operated by RedPhantom Tech Novelty Private Limited, Pandharpur, Maharashtra, India.
          </p>
        </div>
      </article>
    </SiteFrame>
  );
}

function Part({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-[#F2F5F2]">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-[#B7C5BC]">{children}</div>
    </section>
  );
}

/** Three-column table on tablets and up; on phones each row stacks as a small card so names never break mid-word. */
function Table({ rows }: { rows: readonly (readonly [string, string, string])[] }) {
  const label = "font-mono text-[10px] uppercase tracking-[0.1em] text-[#92A399] sm:hidden";
  return (
    <div className="overflow-x-auto rounded-[12px] border border-[rgba(255,255,255,0.1)]">
      <table className="block w-full text-left text-[13.5px] sm:table sm:min-w-130">
        <thead className="sr-only bg-[#06110C] font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#92A399] sm:not-sr-only sm:table-header-group">
          <tr>
            <th className="px-3 py-2.5 sm:px-4 font-normal">Name</th>
            <th className="px-3 py-2.5 sm:px-4 font-normal">What it remembers</th>
            <th className="px-3 py-2.5 sm:px-4 font-normal">Kept</th>
          </tr>
        </thead>
        <tbody className="block sm:table-row-group">
          {rows.map(([n, w, k]) => (
            <tr key={n} className="block border-t border-[rgba(255,255,255,0.06)] px-4 py-3 first:border-t-0 sm:table-row sm:p-0 sm:first:border-t">
              <td className="block pb-1 font-mono text-[12.5px] text-[#F2F5F2] [overflow-wrap:anywhere] sm:table-cell sm:whitespace-nowrap sm:px-4 sm:py-2.5 sm:text-[12px]">{n}</td>
              <td className="block text-[#C9CFD1] sm:table-cell sm:px-4 sm:py-2.5">{w}</td>
              <td className="block pt-1 text-[#B7C5BC] sm:table-cell sm:px-4 sm:py-2.5">
                <span className={label}>Kept · </span>
                {k}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <Legal id="privacy" eyebrow="Privacy" title="Privacy." lede="How this preview website handles your information today. The full privacy policy for the AFVAR platform is published before launch.">
      <Part title="What you give us">
        <p>When you register you give a display name, an email address and a password, and you can add your country, a mobile number and your trading experience. Your email address is confirmed with a link. That creates one account.</p>
        <p>If you use the contact form, you give your name, an email address and, if you like, a message. These are stored securely so the team can read and reply to your enquiry; they are not shared or used for marketing. An unsent draft stays only in your own browser.</p>
      </Part>
      <Part title="What we do not collect">
        <p>No payment details are taken before launch. This website runs no advertising trackers and no third-party analytics.</p>
        <p>Supported broker accounts connect read-only. AFVAR never asks for a trading or master password.</p>
      </Part>
      <Part title="What stays in your browser">
        <p>A few small items are remembered on your own device so the site behaves the way you left it — your language, sound and motion choices, whether you are signed in, and drafts of forms you have started. The{" "}
          <a href="/cookies" className="inline-flex min-h-10 items-center text-[#A8DEC2] underline-offset-4 hover:underline">
            Cookies page
          </a>{" "}
          lists each one.
        </p>
      </Part>
      <Part title="Your choices">
        <p>You can clear these settings at any time from your browser. To ask about information held with your account, write to the team through{" "}
          <a href="/contact" className="inline-flex min-h-10 items-center text-[#A8DEC2] underline-offset-4 hover:underline">
            Contact
          </a>
          .
        </p>
      </Part>
    </Legal>
  );
}

export function TermsPage() {
  return (
    <Legal id="terms" eyebrow="Terms" title="Terms of use." lede="The ground rules for this preview website. The full terms for the AFVAR platform, its plans and launch offers are published before launch.">
      <Part title="What AFVAR is">
        <p>AFVAR provides market information, analysis and explanation. Nothing on this website is investment advice, and AFVAR never places, changes or closes trades. Trading decisions, and responsibility for them, stay with you.</p>
      </Part>
      <Part title="What this website shows">
        <p>Before launch, this website previews the platform. Prices marked live or delayed come from named public sources; everything else is a labelled sample or illustration. Historical results never predict future returns.</p>
      </Part>
      <Part title="Registering">
        <p>Registering joins the launch queue and costs nothing. It does not unlock the full workspace. Prices, plan names and launch offer terms shown here are indicative until they are confirmed before launch.</p>
      </Part>
      <Part title="Fair use">
        <p>Please do not misuse the site — for example by trying to break it, overload it or pass yourself off as AFVAR. Groups outside the app that claim to be AFVAR are not run by us.</p>
      </Part>
    </Legal>
  );
}

export function CookiesPage() {
  return (
    <Legal id="cookies" eyebrow="Cookies" title="Cookies and local storage." lede="The small items this website keeps in your browser, and why. None of them is used for advertising or tracking.">
      <Part title="Cookies">
        <Table
          rows={[
            ["afwar_edition", "Your language edition (English or हिन्दी)", "1 year"],
            ["afwar_sid", "Your signed-in session, signed by the server and not readable by page scripts", "30 days, or until you sign out"],
            ["afwar_session", "Whether you are signed in, so pages can route you", "30 days"],
            ["afwar_onboarded", "Whether you have finished first-time setup", "30 days"],
          ]}
        />
      </Part>
      <Part title="Local storage">
        <Table
          rows={[
            ["afwar.edition", "Your language edition, on this device", "until cleared"],
            ["afwar.auth.v1", "Your signed-in account on this device, so you are not asked to sign in on every page", "until you sign out or clear it"],
            ["afvar-home-sound", "Sound on or off", "until cleared"],
            ["afvar-demo-reduce-motion", "Your reduced-motion choice", "until cleared"],
            ["afvar.contact.enquiry", "An unsent contact-form draft, kept on this device so nothing you type is lost", "until the enquiry is sent"],
            ["afvar-waitlist-email", "The email you entered for launch news", "until cleared"],
            ["afvar-font-preview", "The font picked in the team’s font preview on the Platform page", "until cleared"],
          ]}
        />
      </Part>
      <Part title="Session storage">
        <Table
          rows={[
            ["afwar.registerDraft", "Your unfinished registration form — name, email, phone, country and experience, never the password", "until you register or close the tab"],
            ["afwar.unlocked", "That you unlocked the app with your PIN in this tab", "until it locks or you close the tab"],
            ["afvar.mk.prelaunchDismissed", "That you closed the pre-launch banner", "until you close the tab"],
            ["afvar-home-cta-dismissed", "That you closed the floating launch-queue card", "until you close the tab"],
            ["afvar-demo-reminder-dismissed", "That you closed the launch reminder", "until you close the tab"],
          ]}
        />
      </Part>
      <Part title="Turning them off">
        <p>You can clear cookies and site data from your browser settings at any time. The site still works; it will simply forget your choices.</p>
      </Part>
    </Legal>
  );
}
