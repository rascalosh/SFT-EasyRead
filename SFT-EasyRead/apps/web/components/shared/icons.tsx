// Icon set — stroke-only, 24×24 viewBox, currentColor, strokeWidth 1.8.
// All icons are accessible: wrap with aria-label or aria-hidden as needed.
import type { SVGProps } from "react"

type IconProps = SVGProps<SVGSVGElement>

function base(props: IconProps) {
  return {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  }
}

/* ── Navigation ───────────────────────────────────────────────── */
export const IconHome = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 10.5 12 4l8 6.5"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/></svg>
)
export const IconBook = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 5.5A2 2 0 0 1 6 4h6v15H6a2 2 0 0 0-2 1.5z"/><path d="M20 5.5A2 2 0 0 0 18 4h-6v15h6a2 2 0 0 1 2 1.5z"/></svg>
)
export const IconSettings = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>
)
export const IconChevron = (p: IconProps) => (
  <svg {...base(p)}><path d="M9 6l6 6-6 6"/></svg>
)
export const IconChevronDown = (p: IconProps) => (
  <svg {...base(p)}><path d="M6 9l6 6 6-6"/></svg>
)
export const IconChevronUp = (p: IconProps) => (
  <svg {...base(p)}><path d="M6 15l6-6 6 6"/></svg>
)
export const IconArrow = (p: IconProps) => (
  <svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6"/></svg>
)
export const IconArrowLeft = (p: IconProps) => (
  <svg {...base(p)}><path d="M19 12H5M11 18l-6-6 6-6"/></svg>
)
export const IconClose = (p: IconProps) => (
  <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18"/></svg>
)
export const IconMenu = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 6h16M4 12h16M4 18h16"/></svg>
)
export const IconSidebar = (p: IconProps) => (
  <svg {...base(p)}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></svg>
)
export const IconExternalLink = (p: IconProps) => (
  <svg {...base(p)}><path d="M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/><path d="M14 4h6v6M20 4 10 14"/></svg>
)

/* ── Reading & Content ────────────────────────────────────────── */
export const IconSparkle = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 3v4M12 17v4M5 12H3M21 12h-2M6.5 6.5 5 5M19 19l-1.5-1.5M17.5 6.5 19 5M5 19l1.5-1.5"/><circle cx="12" cy="12" r="3"/></svg>
)
export const IconLetters = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 18 8 6l4 12M5.5 14h5M15 18V6M15 6h3.5a2.5 2.5 0 0 1 0 5H15"/></svg>
)
export const IconTextSize = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 17 7 6l4 11M4 14h6M14 17l3-8 3 8M14.7 15h4.6"/></svg>
)
export const IconAlignLeft = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 6h18M3 11h12M3 16h15"/></svg>
)
export const IconLineHeight = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 9V4h16v5M4 15v5h16v-5M12 9v6"/><path d="M9 12l3-2 3 2"/></svg>
)
export const IconHighlight = (p: IconProps) => (
  <svg {...base(p)}><path d="M9 7h9M9 12h7M9 17h4"/><path d="M5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="currentColor" stroke="none"/></svg>
)
export const IconSpacing = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 3v18M7 8l-4 4 4 4M17 8l4 4-4 4"/></svg>
)
export const IconBookmark = (p: IconProps) => (
  <svg {...base(p)}><path d="M6 4h12a1 1 0 0 1 1 1v16l-7-4-7 4V5a1 1 0 0 1 1-1z"/></svg>
)
export const IconParagraph = (p: IconProps) => (
  <svg {...base(p)}><path d="M13 4h5M13 4v16M13 20h-2M10 4h3M10 4a4 4 0 0 0 0 8h3"/></svg>
)

/* ── Media & Input ────────────────────────────────────────────── */
export const IconUpload = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 16V5M8 9l4-4 4 4"/><path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"/></svg>
)
export const IconCamera = (p: IconProps) => (
  <svg {...base(p)}><path d="M5 8h3l1.5-2h5L16 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.2"/></svg>
)
export const IconPaste = (p: IconProps) => (
  <svg {...base(p)}><rect x="6" y="5" width="12" height="16" rx="2"/><path d="M9 5V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1"/><path d="M9 11h6M9 15h4"/></svg>
)
export const IconClipboard = (p: IconProps) => (
  <svg {...base(p)}><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="M8.5 11l2 2 4-4"/></svg>
)
export const IconMic = (p: IconProps) => (
  <svg {...base(p)}><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6"/></svg>
)
export const IconMicOff = (p: IconProps) => (
  <svg {...base(p)}><line x1="2" y1="2" x2="22" y2="22"/><path d="M10.5 10.5A3 3 0 0 0 15 8V7"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M6 11a6 6 0 0 0 9.88 4.6M12 17v4M9 21h6"/></svg>
)
export const IconSpeaker = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a3 3 0 0 1 0 6M18.5 7a6 6 0 0 1 0 10"/></svg>
)
export const IconSpeakerOff = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 9v6h4l5 4V5L8 9zM17 14l3-3M20 14l-3-3"/></svg>
)
export const IconWave = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 12h1M8 8v8M12 5v14M16 8v8M20 12h0"/></svg>
)

/* ── Playback ─────────────────────────────────────────────────── */
export const IconPlay = (p: IconProps) => (
  <svg {...base(p)}><path d="M7 5l12 7-12 7z" fill="currentColor" stroke="none"/></svg>
)
export const IconPause = (p: IconProps) => (
  <svg {...base(p)}><rect x="7" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="13.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none"/></svg>
)
export const IconSkipBack = (p: IconProps) => (
  <svg {...base(p)}><path d="M5 5v14"/><path d="M19 5l-10 7 10 7z" fill="currentColor" stroke="none"/></svg>
)
export const IconSkipForward = (p: IconProps) => (
  <svg {...base(p)}><path d="M19 5v14"/><path d="M5 19l10-7L5 5z" fill="currentColor" stroke="none"/></svg>
)
export const IconRepeat = (p: IconProps) => (
  <svg {...base(p)}><path d="M17 3l3 3-3 3"/><path d="M20 6H8a4 4 0 0 0-4 4v1"/><path d="M7 21l-3-3 3-3"/><path d="M4 18h12a4 4 0 0 0 4-4v-1"/></svg>
)

/* ── Status & Feedback ────────────────────────────────────────── */
export const IconCheck = (p: IconProps) => (
  <svg {...base(p)}><path d="M5 12.5l4.5 4.5L19 7"/></svg>
)
export const IconCheckCircle = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9"/></svg>
)
export const IconInfo = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>
)
export const IconWarning = (p: IconProps) => (
  <svg {...base(p)}><path d="M10.3 4l-7.7 14h18.8zM12 10v4M12 16.5h.01"/></svg>
)
export const IconError = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 15.5h.01"/></svg>
)
export const IconBell = (p: IconProps) => (
  <svg {...base(p)}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>
)

/* ── Achievement & Progress ───────────────────────────────────── */
export const IconTrophy = (p: IconProps) => (
  <svg {...base(p)}><path d="M7 4h10v4a5 5 0 0 1-10 0z"/><path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3M9 15h6M10 19h4M12 13v2M9 19v2h6v-2"/></svg>
)
export const IconChart = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 20V4M4 20h16"/><path d="M8 16v-3M12 16V9M16 16v-6"/></svg>
)
export const IconTarget = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></svg>
)
export const IconFlame = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 21c-4 0-7-3.5-7-7 0-2 1-4 2-5.5 0 2.5 2 3.5 2 3.5s-1-3.5 2-6c0 2.5 1.5 4 3 5 .5-1.5 1.5-2.5 1.5-2.5.5 2 2 3.5 2 6a7 7 0 0 1-5.5 6.5z"/></svg>
)
export const IconStar = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 2l2.9 6.3L22 9.3l-5 5 1.2 7L12 18l-6.2 3.3 1.2-7-5-5 7.1-1z"/></svg>
)
export const IconMedal = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="14" r="6"/><path d="M8 8l-2-4h12l-2 4"/><path d="M12 11v6M9.5 14.5l2.5-2 2.5 2"/></svg>
)
export const IconStreak = (p: IconProps) => (
  <svg {...base(p)}><path d="M13 2L8 12h5l-2 10 8-12h-5l2-8z"/></svg>
)

/* ── UI Controls ──────────────────────────────────────────────── */
export const IconSearch = (p: IconProps) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5l4 4"/></svg>
)
export const IconFilter = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 5h16M7 10h10M10 15h4M11 20h2"/></svg>
)
export const IconSliders = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2" fill="var(--color-surface)" strokeWidth="1.8"/><circle cx="15" cy="12" r="2" fill="var(--color-surface)" strokeWidth="1.8"/><circle cx="9" cy="18" r="2" fill="var(--color-surface)" strokeWidth="1.8"/></svg>
)
export const IconEye = (p: IconProps) => (
  <svg {...base(p)}><ellipse cx="12" cy="12" rx="9" ry="5"/><circle cx="12" cy="12" r="2.5"/></svg>
)
export const IconEyeOff = (p: IconProps) => (
  <svg {...base(p)}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/><line x1="3" y1="3" x2="21" y2="21"/></svg>
)
export const IconLock = (p: IconProps) => (
  <svg {...base(p)}><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="16" r="1" fill="currentColor" stroke="none"/></svg>
)
export const IconEdit = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 20H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h7"/><path d="M15.7 3.3a2 2 0 0 1 3 3L11 14l-4 1 1-4z"/></svg>
)
export const IconTrash = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 7h16M6 7v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M9 12v5M15 12v5"/></svg>
)
export const IconDownload = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 4v12M8 12l4 4 4-4"/><path d="M5 19h14"/></svg>
)
export const IconShare = (p: IconProps) => (
  <svg {...base(p)}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.6l6.8-3.9M8.6 13.4l6.8 3.9"/></svg>
)
export const IconCopy = (p: IconProps) => (
  <svg {...base(p)}><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
)
export const IconMore = (p: IconProps) => (
  <svg {...base(p)}><circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.3" fill="currentColor" stroke="none"/></svg>
)
export const IconMoreVertical = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="5" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.3" fill="currentColor" stroke="none"/></svg>
)
export const IconPlus = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14"/></svg>
)
export const IconMinus = (p: IconProps) => (
  <svg {...base(p)}><path d="M5 12h14"/></svg>
)
export const IconRefresh = (p: IconProps) => (
  <svg {...base(p)}><path d="M21 12a9 9 0 0 1-15.8 6M3 12a9 9 0 0 1 15.8-6"/><path d="M3 7v5h5M21 17v-5h-5"/></svg>
)

/* ── People & Personalization ─────────────────────────────────── */
export const IconUser = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
)
export const IconPalette = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none"/><circle cx="7" cy="14" r="1.5" fill="currentColor" stroke="none"/><circle cx="17" cy="14" r="1.5" fill="currentColor" stroke="none"/></svg>
)
export const IconAccessibility = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="5" r="2"/><path d="M5 9l7 1 7-1M9 9v7l3 4 3-4V9"/></svg>
)
export const IconGlobe = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-2.5 3.5-2.5 15 0 18M12 3c2.5 3.5 2.5 15 0 18"/></svg>
)
export const IconMoon = (p: IconProps) => (
  <svg {...base(p)}><path d="M20 13.5A9 9 0 0 1 10.5 4 9 9 0 1 0 20 13.5z"/></svg>
)
export const IconSun = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>
)

/* ── Misc ─────────────────────────────────────────────────────── */
export const IconTap = (p: IconProps) => (
  <svg {...base(p)}><path d="M9 11V6a2 2 0 0 1 4 0v5"/><path d="M13 11V9a2 2 0 0 1 4 0v6a5 5 0 0 1-5 5h-1.5a4 4 0 0 1-3.2-1.6L4 15s1-1.5 3 0l2 1.5"/></svg>
)
export const IconHelp = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 4 2.8c-.7.3-1 .9-1 1.7v.5M12 17.5h.01"/></svg>
)
export const IconRocket = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 2s5 2 5 10v3l2 2v2h-4l-1-1H10l-1 1H5v-2l2-2v-3C7 4 12 2 12 2z"/><path d="M9 15a3 3 0 0 0 6 0"/><circle cx="12" cy="9" r="1" fill="currentColor" stroke="none"/></svg>
)
export const IconBrain = (p: IconProps) => (
  <svg {...base(p)}><path d="M9 3a5 5 0 0 0-5 5c0 1.5.7 2.8 1.7 3.7A5 5 0 0 0 9 21a5 5 0 0 0 3.3-1.3A5 5 0 0 0 15 21a5 5 0 0 0 3.3-9.3A5 5 0 0 0 15 3a5 5 0 0 0-3.3 1.3A5 5 0 0 0 9 3z"/><path d="M12 4.3V21M8 8h3M13 8h3M8 13h3M13 13h3"/></svg>
)
