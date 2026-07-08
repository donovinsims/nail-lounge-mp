/**
 * Sandy Wave Divider — the Coastal Neutral signature element.
 *
 * A subtle, organic shoreline curve used between major sections instead of a
 * hard line. Built once, reused everywhere (doc: "Signature Element").
 *
 * Usage notes:
 * - Color comes from `currentColor`: set a text-* token on the svg via className
 *   (e.g. `text-surface` to blend a section into the card tone below it).
 * - Height comes from className (h-4 … h-10); width should stay w-full.
 * - `flip` mirrors the wave for a section's opposite edge.
 * - Purely decorative: aria-hidden, never focusable, no layout logic.
 */
export function WaveDivider({
  className = "",
  flip = false,
}: {
  className?: string;
  flip?: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 1440 48"
      preserveAspectRatio="none"
      className={(flip ? "rotate-180 " : "") + "block w-full " + className}
    >
      <path
        fill="currentColor"
        d="M0,24 C180,6 360,42 540,26 C720,10 900,44 1080,28 C1260,12 1380,34 1440,22 L1440,48 L0,48 Z"
      />
    </svg>
  );
}
