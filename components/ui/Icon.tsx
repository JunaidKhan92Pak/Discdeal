import type { SVGProps } from "react";

/** All icons used in the app. Add a new one here and it becomes available as <Icon name="…" />. */
const PATHS = {
  // categories & deals
  tag: <><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1" /></>,
  utensils: <><path d="M3 2v7a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6a2 2 0 0 0 2 2h3zm0 0v7" /></>,
  pizza: <><path d="M3 5c6-3 12-3 18 0L12 21z" /><circle cx="9" cy="8.5" r="1" /><circle cx="14.5" cy="9" r="1" /><circle cx="12" cy="13" r="1" /></>,
  coffee: <><path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" /><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" /><path d="M8 3v2M12 3v2" /></>,
  phone: <><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M12 18h.01" /></>,
  headphones: <><path d="M4 15v-3a8 8 0 0 1 16 0v3" /><rect x="3" y="14" width="4" height="7" rx="1.5" /><rect x="17" y="14" width="4" height="7" rx="1.5" /></>,
  tv: <><rect x="2" y="5" width="20" height="13" rx="2" /><path d="M8 21h8" /></>,
  keyboard: <><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" /></>,
  laptop: <><rect x="4" y="5" width="16" height="11" rx="1.5" /><path d="M2 19h20" /></>,
  shirt: <path d="m8 3-6 4 3 4 3-2v12h8V9l3 2 3-4-6-4a4 4 0 0 1-8 0z" />,
  shoe: <><path d="M3 16v-4l4-2 3 2h4c2 0 4 1 5 3v3z" /><path d="M3 19h18" /></>,
  cap: <><path d="M22 10 12 5 2 10l10 5z" /><path d="M6 12v5c3 2 9 2 12 0v-5" /><path d="M22 10v6" /></>,
  book: <><path d="M3 5h7a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H3z" /><path d="M21 5h-7a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h7z" /></>,
  heart: <path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.7A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z" />,
  sparkles: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 15v4M17 17h4" /></>,
  pill: <><path d="M10.5 20.5a4.95 4.95 0 0 1-7-7l10-10a4.95 4.95 0 0 1 7 7z" /><path d="m8.5 8.5 7 7" /></>,
  watch: <><rect x="6" y="6" width="12" height="12" rx="3" /><path d="M9 6V2h6v4M9 18v4h6v-4M12 10v2l1.5 1" /></>,
  plane: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />,
  bed: <><path d="M2 18V7M2 14h20v4M22 14v-2a3 3 0 0 0-3-3h-7v5" /><circle cx="6.5" cy="11" r="1.5" /></>,
  car: <><path d="M5 17h14v-5l-2-5H7l-2 5z" /><circle cx="7.5" cy="17.5" r="1.5" /><circle cx="16.5" cy="17.5" r="1.5" /></>,
  home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>,
  sofa: <><path d="M4 11V8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v3" /><path d="M2 13a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v5H2z" /><path d="M5 18v2M19 18v2" /></>,
  chair: <><path d="M7 3h10v8H7z" /><path d="M5 11h14v4H5z" /><path d="M8 15v6M16 15v6" /></>,
  music: <><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>,
  film: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" /></>,
  cart: <><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.5 12h12L22 7H6" /></>,
  scissors: <><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M8.1 8.1 20 20M8.1 15.9 20 4" /></>,
  cake: <><path d="M4 21v-9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9" /><path d="M4 15c2 1.5 4 1.5 6 0s4-1.5 6 0 3 1 4 0" /><path d="M2 21h20M12 10V7" /><path d="M12 7a1.5 1.5 0 0 0 1.5-1.5C13.5 4.5 12 3 12 3s-1.5 1.5-1.5 2.5A1.5 1.5 0 0 0 12 7z" /></>,
  snowflake: <path d="M12 2v20M4.9 7l14.2 10M4.9 17 19.1 7M9 4l3 2 3-2M9 20l3-2 3 2" />,
  star: <path d="m12 2 3 7 7 .6-5.3 4.7 1.6 7.2L12 17.8 5.7 21.5l1.6-7.2L2 9.6 9 9z" />,

  // interface
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  pin: <><path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></>,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  check: <path d="m5 12 5 5L20 7" />,
  "chevron-left": <path d="m15 18-6-6 6-6" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  sort: <path d="M4 6h16M7 12h10M10 18h4" />,
  "chevron-right": <path d="m9 18 6-6-6-6" />,
  "arrow-right": <path d="M5 12h14M13 6l6 6-6 6" />,
  "arrow-up-right": <path d="M7 17 17 7M8 7h9v9" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
};

export type IconName = keyof typeof PATHS;

type IconProps = { name: IconName } & Omit<SVGProps<SVGSVGElement>, "name">;

export function Icon({ name, className = "size-5", strokeWidth = 1.75, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
