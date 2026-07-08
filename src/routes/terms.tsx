import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { getSalonName, getSalonAddress } from "@/lib/env";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: `Terms of Service — ${getSalonName()}` },
      {
        name: "description",
        content: `${getSalonName()} terms of service — appointment policies, cancellation policy, and salon guidelines.`,
      },
      { property: "og:title", content: `Terms of Service — ${getSalonName()}` },
      {
        property: "og:description",
        content: "Our appointment policies, cancellation terms, and salon guidelines.",
      },
      { property: "og:url", content: "/terms" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-3xl px-6 py-20 sm:px-10 sm:py-28">
          <p className="text-xs uppercase tracking-[0.35em] text-accent">Legal</p>
          <h1 className="mt-6 font-display text-5xl leading-[0.95] tracking-[-0.01em] sm:text-7xl">
            Terms of <span className="italic">Service.</span>
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">Last updated: January 1, 2026</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16 sm:px-10 sm:py-24">
        <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
          <h2>Services</h2>
          <p>
            {getSalonName()} provides professional nail care and beauty services by appointment. All
            services are performed by licensed technicians in our studio at {getSalonAddress()}.
          </p>
          <p>
            Service descriptions and pricing are listed on our website and may be updated at any
            time. We reserve the right to refuse service to anyone.
          </p>

          <h2>Appointments</h2>
          <p>
            Appointments can be booked online through our website, by phone, or in person. By
            booking an appointment, you agree to provide accurate contact information and arrive on
            time.
          </p>
          <p>
            We recommend arriving 5–10 minutes before your scheduled appointment. Late arrivals may
            result in shortened service time or rescheduling.
          </p>

          <h2>Cancellation &amp; No-Show Policy</h2>
          <p>
            We understand that plans change. Please notify us at least 24 hours in advance if you
            need to cancel or reschedule.
          </p>
          <ul>
            <li>
              Cancellations made with less than 24 hours notice may result in a cancellation fee.
            </li>
            <li>
              No-shows (failure to arrive without notice) will be charged the full service amount.
            </li>
            <li>
              Repeated no-shows or late cancellations may result in being blocked from future online
              booking.
            </li>
          </ul>

          <h2>Pricing &amp; Payment</h2>
          <p>
            All prices are listed in U.S. dollars and are subject to change without notice. We make
            every effort to keep our website pricing current, but prices quoted at the time of
            booking are not guaranteed until confirmed at check-in.
          </p>
          <p>
            Payment is collected in-studio at the completion of your service. We accept cash, credit
            and debit cards, Venmo, and Cash App. We do not accept checks.
          </p>
          <p>
            A gratuity of 15–20% is customary for nail services and is greatly appreciated by our
            staff.
          </p>

          <h2>Gift Cards</h2>
          <p>
            Gift cards are available for purchase in-studio or by phone. They never expire and may
            be used toward any service. Gift cards are non-refundable and cannot be redeemed for
            cash except where required by law.
          </p>

          <h2>Refunds</h2>
          <p>
            All services are final sale. If you are unsatisfied with your service, please let us
            know before leaving the studio so we can address any concerns. We are committed to your
            satisfaction and will make every reasonable effort to resolve any issues.
          </p>
          <p>
            Product sales (polish, retail items) may be returned within 14 days for store credit.
          </p>

          <h2>Health &amp; Safety</h2>
          <p>
            We maintain a clean and sanitary environment in accordance with state board regulations.
            Our tools are sterilized between clients, and our technicians follow proper hygiene
            protocols.
          </p>
          <p>
            If you have any of the following conditions, please reschedule your appointment: nail
            fungus, active infections, open wounds, or contagious illness. We reserve the right to
            refuse service for health or safety reasons.
          </p>

          <h2>Liability Waiver</h2>
          <p>
            By receiving services at {getSalonName()}, you acknowledge that nail care services
            involve some inherent risk, including but not limited to allergic reactions to products,
            minor cuts, or irritation. We use high-quality products and take precautions to minimize
            these risks.
          </p>
          <p>
            {getSalonName()} is not liable for allergic reactions to products used during your
            visit. Please inform your technician of any known allergies before services begin.
          </p>

          <h2>Salon Conduct</h2>
          <p>
            We strive to provide a relaxing and professional environment for all guests. We ask that
            you:
          </p>
          <ul>
            <li>Treat staff and other guests with respect</li>
            <li>Keep phone conversations and speaker calls to a minimum</li>
            <li>Supervise children at all times</li>
            <li>Refrain from consuming outside alcohol on the premises</li>
          </ul>
          <p>
            We reserve the right to refuse or discontinue service to anyone who violates these
            guidelines.
          </p>

          <h2>Website Use</h2>
          <p>
            By using our website, you agree not to misuse the site or engage in any activity that
            could disrupt its operation. All content on this website, including text, images, and
            branding, is the property of {getSalonName()} and may not be reproduced without
            permission.
          </p>

          <h2>Changes to Terms</h2>
          <p>
            We reserve the right to update these terms at any time. Continued use of our services
            after changes constitutes acceptance of the updated terms.
          </p>

          <h2>Contact</h2>
          <p>
            For questions about these terms, please reach out to us in person, by phone, or by
            email.
          </p>
        </div>

        <div className="mt-16 border-t border-border pt-8">
          <Link
            to="/privacy"
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition"
          >
            View Privacy Policy →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
