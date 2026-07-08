import { useEffect, useRef, useState } from "react";
import { Instagram } from "lucide-react";
import { getSalonSocial } from "@/lib/env";

/**
 * Lightweight social embeds — render a static skeleton until the user
 * scrolls them into view, then mount the third-party iframe. This keeps
 * the booking flow & initial page weight unaffected.
 */
function useInView<T extends Element>(rootMargin = "200px") {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current || inView) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setInView(true)),
      { rootMargin },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [inView, rootMargin]);
  return { ref, inView } as const;
}

export function InstagramEmbed() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const handle = getSalonSocial().instagram.split("/").filter(Boolean).pop() || "";
  const src = `https://www.instagram.com/${handle}/embed`;
  return (
    <div ref={ref} className="overflow-hidden rounded-3xl bg-surface hairline">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
        <a
          href={getSalonSocial().instagram}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-sm font-medium"
        >
          <Instagram className="h-4 w-4 text-accent" /> @{handle}
        </a>
        <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Instagram</span>
      </div>
      {inView ? (
        <iframe
          title={`Instagram feed for @${handle}`}
          src={src}
          loading="lazy"
          allow="encrypted-media"
          className="block h-[560px] w-full border-0 bg-white"
        />
      ) : (
        <div className="h-[560px] w-full animate-pulse bg-muted/30" />
      )}
    </div>
  );
}

export function TikTokEmbed() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const handle = (getSalonSocial().tiktok.split("/@").pop() || "").replace(/\/$/, "");
  // TikTok creator embed
  const src = `https://www.tiktok.com/embed/@${handle}`;
  return (
    <div ref={ref} className="overflow-hidden rounded-3xl bg-surface hairline">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
        <a
          href={getSalonSocial().tiktok}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-sm font-medium"
        >
          <span aria-hidden className="text-accent">
            ♪
          </span>{" "}
          @{handle}
        </a>
        <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">TikTok</span>
      </div>
      {inView ? (
        <iframe
          title={`TikTok feed for @${handle}`}
          src={src}
          loading="lazy"
          allow="encrypted-media; fullscreen"
          className="block h-[560px] w-full border-0 bg-white"
        />
      ) : (
        <div className="h-[560px] w-full animate-pulse bg-muted/30" />
      )}
    </div>
  );
}
