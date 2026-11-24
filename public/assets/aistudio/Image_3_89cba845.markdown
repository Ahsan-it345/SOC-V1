---
name: Cyber Defense Console
colors:
  surface: '#031427'
  surface-dim: '#031427'
  surface-bright: '#2a3a4f'
  surface-container-lowest: '#000f21'
  surface-container-low: '#0b1c30'
  surface-container: '#102034'
  surface-container-high: '#1b2b3f'
  surface-container-highest: '#26364a'
  on-surface: '#d3e4fe'
  on-surface-variant: '#bcc9cd'
  inverse-surface: '#d3e4fe'
  inverse-on-surface: '#213145'
  outline: '#869397'
  outline-variant: '#3d494c'
  surface-tint: '#4cd7f6'
  primary: '#4cd7f6'
  on-primary: '#003640'
  primary-container: '#06b6d4'
  on-primary-container: '#00424f'
  inverse-primary: '#00687a'
  secondary: '#adc6ff'
  on-secondary: '#002e6a'
  secondary-container: '#0566d9'
  on-secondary-container: '#e6ecff'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#1bbd85'
  on-tertiary-container: '#00452e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#acedff'
  primary-fixed-dim: '#4cd7f6'
  on-primary-fixed: '#001f26'
  on-primary-fixed-variant: '#004e5c'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#031427'
  on-background: '#d3e4fe'
  surface-variant: '#26364a'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
  body-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 12px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  gutter-mobile: 0.5rem
  margin: 1rem
  margin-mobile: 0.75rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system targets SecOps engineers, threat intelligence analysts, and incident responders managing mission-critical infrastructure under high-stress conditions. The emotional response is one of surgical precision, immediate situational awareness, and total operational control.

The aesthetic fuses **Corporate High-Tech** with **Technical Minimalism**:
- **Information Density:** High spatial efficiency that minimizes vertical scrolling and maximizes simultaneous cross-telemetry correlation.
- **Precision Engineering:** Crisp structural divisions, muted backdrops, and deliberate hierarchy eliminate visual fatigue during 12-hour operational shifts.
- **Signal-to-Noise Ratio:** Neutral backgrounds remain visually quiet, reserving saturated chromatic energy exclusively for state indicators, active incident severity, and tactical callouts.

## Colors

The color palette is calibrated for dark mode environments (SOC monitoring floors), establishing a structured hierarchy through deep slate-charcoal tonal tiers, precise borders, and unambiguous security status indicators.

### Surface Architecture
- **Base Canvas (`#0B0F19`):** Foundational backplane for the console shell and window frame.
- **Surface Elevation 1 (`#111827`):** Primary panel, sidebar, and workspace surface.
- **Surface Elevation 2 (`#1E293B`):** Interactive cards, table headers, modal surfaces, and floating toolbars.
- **Surface Elevation 3 (`#334155`):** Sub-elements, hover states, and activated tool targets.

### Structural Lines
- **Subtle Outline (`#1F2937`):** Primary partition lines between major console zones.
- **Prominent Outline (`#374151`):** Active card perimeters, input borders, and divider rules.

### Tactical Status & Telemetry
- **Critical / Threat (`#EF4444`):** High-severity incidents, uncontained malware, compromised assets.
- **Warning / Suspicious (`#F59E0B`):** Anomalous behavioral heuristics, pending updates, privilege escalation risks.
- **Healthy / Protected (`#10B981`):** Healthy agents, clean scans, resolved tickets, operational nodes.
- **Accent Primary / Command (`#06B6D4`):** Active selections, highlighted traces, primary interactions, link states.
- **Accent Secondary / Telemetry (`#3B82F6`):** Network telemetry metrics, auxiliary data charts, informational metadata.
- **Text & Readability:**
  - Primary Content: `#F8FAFC`
  - Secondary Metadata: `#94A3B8`
  - Muted Annotations: `#64748B`

## Typography

The typographical structure balances rapid semantic scanning with absolute data precision.

- **Primary Typeface (`Inter`):** Handles UI chrome, narrative incident summaries, navigation hierarchies, and field labels. Inter provides balanced optical proportions and distinctive letterforms that maintain legibility at compact enterprise scales.
- **Telemetry & Monospace Typeface (`JetBrains Mono`):** Dedicated to technical artifacts: SHA-256 file hashes, IPv4/IPv6 addresses, CVE identifiers, system process paths, MITRE ATT&CK technique IDs, and raw SIEM log streams. Tabular figures are enforced system-wide to maintain column alignment across dynamic counters and high-speed data refreshes.

## Layout & Spacing

The layout philosophy relies on a high-density, multi-pane fluid workspace. Grid alignment adapts to enterprise multi-monitor setups and multi-column telemetry consoles.

### Grid & Breakpoints
- **Desktop Ultrawide / 4K (≥1920px):** 16-column dynamic grid layout allowing simultaneous multi-panel investigation: telemetry trees, raw payload logs, and entity relationship graphs.
- **Desktop Standard (1280px - 1919px):** 12-column layout with collapsible primary navigation, contextual action drawers, and sticky filter bars.
- **Compact / Tablet (768px - 1279px):** 8-column layout. Split views collapse into tabbed interfaces.
- **Mobile (≤767px):** 4-column layout reserved for on-call triage, critical escalation approvals, and alert acknowledgment.

### Layout Principles
- **Dense Vertical Spacing:** 4px baseline rhythm (`space-xs` = 4px, `space-sm` = 8px, `space-md` = 12px, `space-lg` = 16px).
- **Persistent Visibility:** Essential data grids must preserve header visibility via sticky tracking while maximizing table record display area.

## Elevation & Depth

Visual hierarchy within this design system relies on **tonal layered surfaces** and **low-contrast technical borders** rather than diffuse drop shadows. This avoids visual muddiness in low-ambient-light SOC work environments.

- **Base Layer (`#0B0F19`):** Global frame canvas.
- **Panel Layer (`#111827`):** Work area divisions, bounded by a 1px solid border (`#1F2937`).
- **Raised Module Layer (`#1E293B`):** Cards, flyout inspectors, and telemetry containers with 1px border (`#374151`).
- **Floating Modals & Command Palettes:** Elevated using `#1E293B` combined with a directional 1px highlight border (`#38BDF8`/20% opacity) and a tight perimeter shadow (`0 8px 24px -4px rgba(0, 0, 0, 0.65)`).
- **Contextual Inlays:** Filter zones, search bars, and log terminals use inset backgrounds (`#0B0F19`) surrounded by a 1px border (`#1F2937`) to indicate receptive input areas.

## Shapes

The design system enforces a disciplined, engineering-focused shape scale using subtle corner rounding (`0.25rem` / `4px`).

- **Structural Containers:** Cards, tables, panels, and code execution consoles use standard `4px` corner radii, ensuring dense, flush alignments without wasted corner space.
- **Interactive Controls:** Form inputs, action buttons, dropdown items, and filter trigger bars adopt `4px` corner radii.
- **Badges & Severity Indicators:** Status badges and MITRE tags use rounded micro-capsules (`rounded-lg` / `8px` or full pill structures strictly when functioning as standalone status tokens).

## Components

### Buttons
- **Primary / Tactical:** Electric Cyan fill (`#06B6D4`), solid dark typography (`#0B0F19`), font weight 600, 4px border-radius. On hover: `#22D3EE`. Focus state: 2px ring offset in `#0B0F19` with a `#06B6D4` outer ring.
- **Destructive / Containment:** Ruby Red fill (`#EF4444`), white typography (`#FFFFFF`). Used for immediate threat remediation (e.g., "Isolate Host", "Revoke Token").
- **Secondary / Ghost:** Transparent background with 1px solid border (`#374151`), slate text (`#F8FAFC`). Hover: background `#1E293B`, border `#4B5563`.
- **Micro Action Buttons:** 24px height, 12px JetBrains Mono icon/label pair for inline grid actions (e.g., "Pivot", "PCAP Download").

### Status Badges & Pill Indicators
- **Architecture:** 20px fixed height, font family `JetBrains Mono`, 10px uppercase type with medium tracking.
- **Critical (P1 / Active Threat):** Ruby Red background (`rgba(239, 68, 68, 0.12)`), solid border (`rgba(239, 68, 68, 0.4)`), text `#F87171`, paired with an animated pulse dot (`#EF4444`).
- **Warning (P2 / Investigation):** Amber background (`rgba(245, 158, 11, 0.12)`), solid border (`rgba(245, 158, 11, 0.4)`), text `#FBBF24`.
- **Healthy / Clear:** Emerald background (`rgba(16, 185, 129, 0.12)`), solid border (`rgba(16, 185, 129, 0.4)`), text `#34D399`.
- **Info / Triage:** Cobalt background (`rgba(59, 130, 246, 0.12)`), solid border (`rgba(59, 130, 246, 0.4)`), text `#60A5FA`.

### Dense Telemetry Tables
- **Geometry:** Compact row height (32px default, 28px ultra-dense toggle).
- **Header:** Sticky positioning, background `#111827`, typography `JetBrains Mono` 11px uppercase in `#64748B`, 1px solid border bottom (`#1F2937`).
- **Row Styling:** Alternating subtle zebra striping (`#111827` to `#0E1422`), row hover state `#1E293B`. Selected rows receive a 2px left-border accent in `#06B6D4`.
- **Data Rendering:** Monospace numbers right-aligned with tabular figures. Hostnames and IPs hyperlinked in `#38BDF8` with quick-pivot menu triggers on hover.

### Inputs & Filter Bars
- **Search & Query Bars:** Integrated Lucene/KQL syntax inputs with deep background (`#0B0F19`), crisp border (`#374151`), monospace tokens, syntax-highlighted keywords (operators in `#06B6D4`, values in `#10B981`).
- **Checkboxes & Radios:** Sharp square indicators (4px radius for checkboxes, full circle for radios) with a 1px border (`#4B5563`). When checked: solid `#06B6D4` fill with `#0B0F19` iconography.

### Metric Cards & Micro-Charts
- **Metric Cards:** `#111827` surface with 1px border (`#1F2937`). Contains title in 11px Inter uppercase (`#94A3B8`), metric total in 24px Inter (`#F8FAFC`), and trailing trend indicator (+/- percentage with status tint).
- **Micro-Charts (Sparklines):** High-density SVG sparklines (40px height) embedded inside metric cards, utilizing `#06B6D4` for baseline traffic and `#EF4444` for anomalous threshold spikes, accompanied by a gradient area fill (`rgba(6, 182, 212, 0.1)` to transparent).

### Incident Investigation Timeline
- **Layout:** Vertical branch visualization connected by 1px solid track lines (`#1F2937`).
- **Nodes:** Hexagonal or circular anchors colored according to the MITRE ATT&CK phase (Initial Access, Persistence, Exfiltration).
- **Event Metadata:** Timestamped entries in `JetBrains Mono` 11px (`#64748B`), associated process trees rendered with collapsible indentation guides.