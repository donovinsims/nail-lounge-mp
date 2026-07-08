import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { getSalonName } from "@/lib/env";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: `Privacy Policy — ${getSalonName()}` },
      {
        name: "description",
        content: `${getSalonName()} privacy policy — how we collect, use, and protect your personal information.`,
      },
      { property: "og:title", content: `Privacy Policy — ${getSalonName()}` },
      {
        property: "og:description",
        content: "Learn how we handle your personal information.",
      },
      { property: "og:url", content: "/privacy" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-3xl px-6 py-20 sm:px-10 sm:py-28">
          <p className="text-xs uppercase tracking-[0.35em] text-accent">Legal</p>
          <h1 className="mt-6 font-display text-5xl leading-[0.95] tracking-[-0.01em] sm:text-7xl">
            Privacy <span className="italic">Policy.</span>
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">Last updated: January 1, 2026</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16 sm:px-10 sm:py-24">
        <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
          <h2>Information We Collect</h2>
          <p>
            When you book an appointment, contact us, or use our services, we may collect the
            following information:
          </p>
          <ul>
            <li>Your name, phone number, and email address</li>
            <li>Appointment dates, times, and service preferences</li>
            <li>Payment information (processed securely through our payment provider)</li>
            <li>Any notes or preferences you share with us about your visit</li>
            <li>
              Technical data such as your IP address, browser type, and device information when you
              visit our website
            </li>
          </ul>

          <h2>How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Schedule, confirm, and manage your appointments</li>
            <li>Send appointment reminders and follow-ups via SMS or email</li>
            <li>Respond to your inquiries and requests</li>
            <li>Improve our services and website experience</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2>SMS &amp; Communications</h2>
          <p>
            By providing your phone number, you consent to receive appointment-related messages
            (reminders, confirmations, and follow-ups). Message and data rates may apply. You can
            opt out at any time by replying STOP to any message.
          </p>
          <p>
            We do not share your phone number with third parties for marketing purposes. Your
            communications data is retained only as long as necessary to provide our services and
            comply with applicable law.
          </p>

          <h2>Information Sharing</h2>
          <p>
            We do not sell your personal information. We may share your data with trusted
            third-party service providers who help us operate our business (such as SMS delivery,
            email, and payment processing), provided they agree to keep your information
            confidential and use it only for the services we request.
          </p>
          <p>We may disclose your information if required by law or to protect our legal rights.</p>

          <h2>Data Security</h2>
          <p>
            We implement reasonable administrative, technical, and physical safeguards to protect
            your personal information against unauthorized access, alteration, disclosure, or
            destruction. However, no method of transmission over the internet is completely secure,
            and we cannot guarantee absolute security.
          </p>

          <h2>Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to provide our services and
            fulfill the purposes described in this policy, or as required by applicable law. When we
            no longer need your data, we will securely delete or anonymize it.
          </p>

          <h2>Your Rights</h2>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul>
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Opt out of marketing communications</li>
            <li>Withdraw consent where processing is based on consent</li>
          </ul>
          <p>To exercise any of these rights, please contact us using the information below.</p>

          <h2>Cookies</h2>
          <p>
            Our website uses minimal cookies for essential functionality and analytics. We use
            privacy-friendly analytics (Umami) that does not track individual users across sites.
            You can control cookie preferences through your browser settings.
          </p>

          <h2>Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. Changes will be posted on this page
            with an updated revision date. We encourage you to review this policy periodically.
          </p>

          <h2>Contact</h2>
          <p>
            If you have any questions about this privacy policy or wish to exercise your rights,
            please contact us:
          </p>
          <ul>
            <li>In person at our studio</li>
            <li>
              By phone: <span className="text-foreground">{import.meta.env.VITE_SALON_PHONE}</span>
            </li>
            <li>
              By email: <span className="text-foreground">{import.meta.env.VITE_SALON_EMAIL}</span>
            </li>
          </ul>
        </div>

        <div className="mt-16 border-t border-border pt-8">
          <Link
            to="/terms"
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition"
          >
            View Terms of Service →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
