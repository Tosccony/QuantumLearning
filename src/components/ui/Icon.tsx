import type { SVGProps } from "react";

/** Single-stroke icon set, 24px grid, drawn for the Select Rail world. */
const PATHS: Record<string, React.ReactNode> = {
  run: <path d="M7 5v14l11-7z" fill="currentColor" stroke="none" />,
  stop: <rect x="6" y="6" width="12" height="12" fill="currentColor" stroke="none" />,
  share: <><path d="M4 12v7h16v-7" /><path d="M12 3v12" /><path d="M8 7l4-4 4 4" /></>,
  fork: <><circle cx="6" cy="5" r="2" /><circle cx="18" cy="5" r="2" /><circle cx="12" cy="19" r="2" /><path d="M6 7v2a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4V7" /><path d="M12 13v4" /></>,
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />,
  "star-filled": <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" fill="currentColor" />,
  lock: <><rect x="5" y="11" width="14" height="10" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  unlock: <><rect x="5" y="11" width="14" height="10" /><path d="M8 11V7a4 4 0 0 1 7.5-2" /></>,
  check: <path d="M4 12.5l5 5L20 6.5" />,
  cross: <><path d="M5 5l14 14" strokeWidth="2.6" /><path d="M19 5L5 19" strokeWidth="2.6" /></>,
  close: <><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>,
  flag: <path d="M6 21V4h11l-2.5 4L17 12H6" />,
  pin: <><circle cx="12" cy="6" r="3" /><path d="M12 9v12" /></>,
  learn: <><path d="M3 6h7a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H3z" /><path d="M21 6h-7a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h7z" /></>,
  lab: <><path d="M9 3h6" /><path d="M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2.2h12.4a1.5 1.5 0 0 0 1.3-2.2L14 9V3" /><path d="M7 15h10" /></>,
  community: <><circle cx="8" cy="8" r="3" /><circle cx="16.5" cy="9.5" r="2.5" /><path d="M2.5 20a5.5 5.5 0 0 1 11 0" /><path d="M14 20a4.5 4.5 0 0 1 7.5-3.3" /></>,
  progress: <><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-8" /><path d="M22 20H2" /></>,
  explorer: <><circle cx="12" cy="12" r="5" /><path d="M2.5 9.5c6-1 13-1 19 0" /><path d="M21.5 14.5c-6 1-13 1-19 0" /></>,
  student: <><path d="M2 9l10-4 10 4-10 4z" /><path d="M6 11v5c3 2.5 9 2.5 12 0v-5" /><path d="M22 9v6" /></>,
  developer: <><path d="M8 7l-5 5 5 5" /><path d="M16 7l5 5-5 5" /><path d="M14 4l-4 16" /></>,
  researcher: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L21 21" /><path d="M7.5 10.5h6" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" /></>,
  sound: <><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16 9a4 4 0 0 1 0 6" /><path d="M18.5 6.5a7.5 7.5 0 0 1 0 11" /></>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" /></>,
  send: <path d="M3 12l18-8-6 18-3-7z" />,
  print: <><path d="M6 9V3h12v6" /><rect x="3" y="9" width="18" height="8" /><rect x="6" y="14" width="12" height="7" /></>,
  download: <><path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M4 21h16" /></>,
  back: <><path d="M19 12H5" /><path d="M11 6l-6 6 6 6" /></>,
  next: <><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></>,
  up: <><path d="M12 19V5" /><path d="M6 11l6-6 6 6" /></>,
  copy: <><rect x="9" y="9" width="12" height="12" /><path d="M5 15V3h12" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  streak: <path d="M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-9z" />,
  xp: <><path d="M12 3l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6L3 10l6-1z" /></>,
  badge: <><circle cx="12" cy="9" r="6" /><path d="M8.5 14L7 22l5-3 5 3-1.5-8" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  qubit: <><circle cx="12" cy="12" r="8" /><path d="M12 4v16" /><ellipse cx="12" cy="12" rx="8" ry="3" /></>,
  noise: <path d="M2 12h3l2-5 3 10 3-8 2 5 2-2h5" />,
  step: <><path d="M4 5v14" /><path d="M9 12h11" /><path d="M15 7l5 5-5 5" /></>,
  tutor: <><path d="M4 5h16v11H9l-5 4z" /><path d="M8 9h8M8 12h5" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></>,
  warn: <><path d="M12 3l10 18H2z" /><path d="M12 10v4" /><path d="M12 17h.01" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  minus: <path d="M5 12h14" />,
  home: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>,
  grownups: <><circle cx="9" cy="7" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 21a6 6 0 0 1 12 0" /><path d="M14 21a4 4 0 0 1 7-2.6" /></>,
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  atom: <><circle cx="12" cy="12" r="1.5" fill="currentColor" /><ellipse cx="12" cy="12" rx="9" ry="3.5" /><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(120 12 12)" /></>,
  cold: <><path d="M12 2v20M4 7l16 10M4 17L20 7" /><path d="M9 4l3 3 3-3M9 20l3-3 3 3M3 10l3 2-3 2M21 10l-3 2 3 2" /></>,
  chip: <><rect x="7" y="7" width="10" height="10" /><path d="M10 2v5M14 2v5M10 17v5M14 17v5M2 10h5M2 14h5M17 10h5M17 14h5" /></>,
  map: <><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" /><path d="M9 4v14M15 6v14" /></>,
  bit: <><rect x="4" y="4" width="16" height="16" /><path d="M9 8v8M15 8v8" /></>,
  wave: <path d="M2 12c2-5 4-5 6 0s4 5 6 0 4-5 6 0" />,
  twins: <><circle cx="8" cy="12" r="4" /><circle cx="16" cy="12" r="4" /><path d="M12 10v4" /></>,
  gear: <><circle cx="12" cy="12" r="3.5" /><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" /></>,
  wand: <><path d="M3 21L15 9" /><path d="M14 3l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" /><path d="M19 13l.7 1.5 1.5.7-1.5.7-.7 1.5-.7-1.5-1.5-.7 1.5-.7z" /></>,
  rocket: <><path d="M12 2c3 2 5 6 5 11l-5 4-5-4c0-5 2-9 5-11z" /><circle cx="12" cy="10" r="1.8" /><path d="M7 13l-3 3 4 1M17 13l3 3-4 1M12 17v5" /></>,
  menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
  reset: <><path d="M4 12a8 8 0 1 0 2.3-5.7" /><path d="M4 4v5h5" /></>,
  edit: <><path d="M4 20h4l11-11-4-4L4 16z" /><path d="M13 7l4 4" /></>,
  camera: <><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>,
};

export type IconName = keyof typeof PATHS;

export default function Icon({ name, size = 18, className, title, ...rest }: { name: IconName; size?: number; title?: string } & Omit<SVGProps<SVGSVGElement>, "name">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      className={className}
      {...rest}
    >
      {title && <title>{title}</title>}
      {PATHS[name]}
    </svg>
  );
}
