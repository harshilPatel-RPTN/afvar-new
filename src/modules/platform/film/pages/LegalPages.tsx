// Privacy, Terms and Cookies: the footer links to them. The full documents are
// published before launch; until then each page states only verified facts
// about what this preview website does.
import type { ReactNode } from "react";
import { SiteFrame } from "@/modules/homeDemo";

const UPDATED = "1 November 2026";

function Legal({ id, eyebrow, title, lede, children }: { id: string; eyebrow: string; title: string; lede: string; children: ReactNode }) {
  return (
    <SiteFrame>
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
            <a href="/contact" className="inline-flex min-h-6 items-center text-[#A8DEC2] underline-offset-4 hover:underline">
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

function Table({ rows }: { rows: readonly (readonly [string, string, string])[] }) {
  return (
    <div className="overflow-x-auto rounded-[12px] border border-[rgba(255,255,255,0.1)]">
      <table className="w-full text-left text-[13.5px] sm:min-w-130">
        <thead className="bg-[#06110C] font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#92A399]">
          <tr>
            <th className="px-3 py-2.5 sm:px-4 font-normal">Name</th>
            <th className="px-3 py-2.5 sm:px-4 font-normal">What it remembers</th>
            <th className="px-3 py-2.5 sm:px-4 font-normal">Kept</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([n, w, k]) => (
            <tr key={n} className="border-t border-[rgba(255,255,255,0.06)]">
              <td className="px-3 py-2.5 sm:px-4 font-mono text-[12px] text-[#F2F5F2] [overflow-wrap:anywhere]">{n}</td>
              <td className="px-3 py-2.5 sm:px-4 text-[#C9CFD1]">{w}</td>
              <td className="px-3 py-2.5 sm:px-4 text-[#B7C5BC]">{k}</td>
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
        <p>When you register for the launch queue you give a mobile number and an email address, and confirm each with a code. That creates one account and one queue record.</p>
        <p>If you use the contact form, you give a topic, an email address and a message. Before launch the message is kept in your own browser until the line opens; it is not sent anywhere yet.</p>
      </Part>
      <Part title="What we do not collect">
        <p>No payment details are taken before launch. This website runs no advertising trackers and no third-party analytics.</p>
        <p>Supported broker accounts connect read-only. AFVAR never asks for a trading or master password.</p>
      </Part>
      <Part title="What stays in your browser">
        <p>A few small settings are remembered on your own device so the site behaves the way you left it — your language, sound and motion choices. The{" "}
          <a href="/cookies" className="inline-flex min-h-6 items-center text-[#A8DEC2] underline-offset-4 hover:underline">
            Cookies page
          </a>{" "}
          lists each one.
        </p>
      </Part>
      <Part title="Your choices">
        <p>You can clear these settings at any time from your browser. To ask about information held with your account, write to the team through{" "}
          <a href="/contact" className="inline-flex min-h-6 items-center text-[#A8DEC2] underline-offset-4 hover:underline">
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
    <Legal id="cookies" eyebrow="Cookies" title="Cookies and local storage." lede="Every small item this website keeps in your browser, and why. None of them is used for advertising or tracking.">
      <Part title="Cookies">
        <Table
          rows={[
            ["afwar_edition", "Your language edition (English or हिन्दी)", "1 year"],
            ["afwar_session", "Whether you are signed in, so pages can route you", "30 days"],
            ["afwar_onboarded", "Whether you have finished first-time setup", "30 days"],
            ["afvar_intro_seen", "That you have seen the opening animation", "1 year"],
          ]}
        />
      </Part>
      <Part title="Local storage">
        <Table
          rows={[
            ["afvar-home-sound", "Sound on or off", "until cleared"],
            ["afvar-demo-reduce-motion", "Your reduced-motion choice", "until cleared"],
            ["afvar.contact.enquiry", "An unsent contact-form draft", "until sent or cleared"],
            ["afvar.mk.prelaunchDismissed", "That you closed the pre-launch banner", "until the tab is closed"],
            ["afvar-waitlist-email", "The email you entered for launch news", "until cleared"],
            ["afvar_intro_seen", "That you have seen the opening animation", "until cleared"],
          ]}
        />
        <p>Signing in to the app also stores your session on this device, so you are not asked to sign in on every page.</p>
      </Part>
      <Part title="Turning them off">
        <p>You can clear cookies and site data from your browser settings at any time. The site still works; it will simply forget your choices.</p>
      </Part>
    </Legal>
  );
}
