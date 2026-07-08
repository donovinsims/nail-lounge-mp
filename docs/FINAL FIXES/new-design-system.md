NAIL LOUNGE · DESIGN SYSTEM
The "Coastal Neutral" Foundation
A warm, relaxed, earthy, and approachable design system inspired by sun-bleached sand and quiet shoreline mornings — the shared visual language for both the customer-facing booking site and the internal tools that power daily operations.
Color
Use semantic color roles instead of hardcoding colors. Replace the hex values for each brand while keeping the same role names.
Background
#EDE7DE
Warm sand with soft cream undertones — feels like walking into a sunlit lounge rather than a clinical spa.
Surface / Card
#F7F3EC
A slightly lighter, cleaner neutral than the background, used to lift cards and panels just enough to feel tactile without harsh contrast.
Primary
#4E6F62 (light mode) · #A9BFB6 (dark mode)

Deepened seafoam green, the main brand color.

The pale #A9BFB6 seafoam from the original concept fails WCAG AA as a button

background with light text, so light mode uses a deepened seafoam (#4E6F62) for

actionable primary. The pale seafoam lives on as secondary tints and as the

dark-mode primary (where it reads well against the dark ground).

Examples:
Primary actions
Buttons
Links
Section headings
Accent
#C9A24B
Soft champagne gold — a warm highlight that adds a touch of quiet luxury against the neutral palette.
Foreground
#2F2F2F
Espresso brown-black, the primary text color.
Avoid using pure black; the warm undertone keeps text feeling soft rather than stark against the sand background.
Muted
#8C7B6B
Taupe, used for secondary text, captions, metadata, placeholders, and helper text.
Success
#7A9E85
A deeper, grounded green for confirmation states and successful bookings — feels earthy rather than clinical.
Warning
#D9A44C
A dusty amber for attention states and caution messaging, close in family to the accent gold but distinct enough to signal urgency.
Destructive
#B5654F
A muted terracotta red for delete, cancel, irreversible actions, and destructive alerts — warm enough to stay on-brand, clear enough to signal risk.
Typography
Fonts reinforce a relaxed, boutique-lounge personality rather than a sterile med-spa feel.
Display — Fraunces
Used for:
Hero headings
Marketing headlines
Major section titles
Example text:
"Relax. Refresh. Repolish."
Why this font:
A soft serif with organic curves gives the brand warmth and a boutique, handcrafted feel without tipping into overly formal luxury.
Body — Inter
Used for:
Paragraphs
UI copy
Forms
Navigation
Example text:
"Book your next appointment in under a minute."
Why this font:
A clean, highly legible sans-serif keeps booking flows and service descriptions easy to scan on any device, especially for quick mobile bookings.
Utility / Data — JetBrains Mono
Used for:
Tables
Numbers
Pricing
IDs
Time
Code
Status labels
Example:
"$48.00 · 45 min · CONFIRMED"
Why this font:
A monospaced typeface aligns pricing, durations, and appointment statuses cleanly in tables and confirmation screens, reducing visual clutter in operational tools.
Spacing
Use an 8px spacing system to maintain consistent rhythm throughout the product.
Scale Size
1 4px
2 8px
3 12px
4 16px
6 24px
8 32px
12 48px
16 64px
Border Radius
Soft, rounded corners echo smoothed beach stones and create a calm, welcoming interface.

Example:

Large rounded corners create a friendly, approachable interface inspired by smooth, weathered natural forms.

Available tokens:
xs
sm
md
lg (default)
xl
2xl
Elevation
Depth should feel gentle and diffuse, like soft midday light rather than dramatic studio lighting.
Shadow 1
Primary resting surfaces — barely perceptible lift for cards on the background.
Shadow 2
Hover states and elevated cards — a slightly stronger, still-soft shadow that signals interactivity.
Shadow 3
Dialogs, modals, overlays — the deepest shadow, reserved for booking confirmations and modals that need full attention.
Motion
Everything should feel calm, premium, and responsive.

Respect reduced-motion preferences.
Easing
Name
Tide Ease
Curve
cubic-bezier(0.33, 1, 0.68, 1)
Motion should feel like a slow wave settling — smooth deceleration with no abrupt stops, reinforcing the relaxed lounge atmosphere.
Duration
Fast

150ms

Used for:
Hover
Toggle
Press states
Base

240ms

Used for:
Most UI transitions
Navigation
Panels
Slow

400ms

Used for:
Page transitions
Dialogs
Hero animations
Iconography
Style:

Rounded outline

Corner style:

Rounded

Stroke weight:

1.5px

Visual principles:
Icons should feel soft and hand-drawn, never sharp or clinical
Consistent stroke weight across all icon sets for visual harmony
Avoid filled icons except for active/selected states
Components
Buttons
Primary buttons feel soft and tactile rather than sharp or corporate.

Examples:
Height: 44px minimum for comfortable tap targets
Radius: lg token (rounded, pill-adjacent)
Typography: Inter, medium weight, letter-spacing slightly open
Shadow: Shadow 1 at rest, Shadow 2 on hover
Hover behavior: subtle scale (1.02x) plus shadow lift, no color-jump
Inputs
Form controls use generous padding, soft borders in the Muted taupe tone, and a gentle focus ring in Primary seafoam rather than a harsh blue — keeping the booking flow feeling calm even during data entry.
Cards
Cards use Surface color, 24px internal padding, lg radius, and Shadow 1 at rest — service cards lift to Shadow 2 on hover to invite interaction without feeling aggressive.
Badges
Status badges use semantic colors at 15% opacity backgrounds with full-opacity text (e.g., Success green background/text for "Confirmed," Warning amber for "Pending," Destructive terracotta for "Cancelled") — soft enough to stay on-brand, clear enough to scan quickly.
Navigation
A simple top-level navigation with generous spacing, using Primary seafoam for the active state indicator and Muted taupe for inactive links — hierarchy is communicated through weight and color, not heavy dividers or boxes.
Imagery
Photography style:

Natural light, close-up manicure shots on neutral linen or wood backdrops, minimal props, soft shadows — avoid harsh studio lighting or neon backgrounds.

Illustration style:

Simple line-art botanicals (leaves, waves) used sparingly as background texture, never as the focal point.

Avoid:
Overly saturated neon nail art photography
Stock photos that feel corporate or clinical
Busy, cluttered backgrounds that compete with product/nail detail
Voice & Personality
The interface should sound:
Warm
Relaxed
Genuine
Locally rooted
Avoid sounding:
Overly salesy
Clinical or corporate
Trend-chasing or gimmicky
Example UI copy:
"Reserve your spot"
"No appointments yet — let's find you a time that works."
"You're all set! We'll see you soon."
Signature Element
The one visual detail users will remember.
Sandy Wave Divider
A subtle, organic wave-shaped divider (echoing a shoreline) used between major sections instead of a hard straight line.

Where it appears:
Primary buttons (as a subtle bottom-edge curve)
Hero sections
Cards
Navigation
Illustrations
Why it matters:
It softens every hard edge in the interface, visually tying the "lounge" concept to a calming coastal metaphor, and gives the brand a quiet, recognizable signature that differentiates it from competitors' sharper, more clinical "luxury" branding nearby.
Overall Design Philosophy
Nail Lounge is designed to feel warm, relaxed, and genuine. Every decision—from color and typography to motion and spacing—supports a product that feels like a calm coastal retreat while remaining easy and fast to book on any device. The result is an experience that users immediately associate with a neighborhood escape rather than a sterile, trend-driven salon chain.
