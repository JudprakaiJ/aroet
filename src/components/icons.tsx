import type { SVGProps } from "react";

export type IconName =
  | "home" | "folder" | "clock" | "user"
  | "plus" | "minus" | "search" | "filter"
  | "bell" | "menu" | "back" | "chevron" | "chevron-down"
  | "check" | "x"
  | "bolt" | "sparkles" | "pin" | "cube" | "building"
  | "calendar" | "clip-list" | "inbox" | "history"
  | "plane" | "stop" | "play" | "pause" | "car" | "wrench"
  | "cloud" | "send" | "alert" | "dot" | "refresh"
  | "doc" | "star" | "trending-up";

export type IconProps = {
  name: IconName;
  size?: number;
  sw?: number;
} & Omit<SVGProps<SVGSVGElement>, "stroke" | "fill">;

export function Icon({ name, size = 22, sw = 1.75, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

const ICON_PATHS: Record<IconName, React.ReactNode> = {
  home: (
    <>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-6h4v6" />
    </>
  ),
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16.5 16.5 4 4" />
    </>
  ),
  filter: <path d="M4 5h16M7 12h10M10 19h4" />,
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 4 2 5 2 7H4c0-2 2-3 2-7Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  back: (
    <>
      <path d="M14 6l-6 6 6 6" />
      <path d="M8 12h12" />
    </>
  ),
  chevron: <path d="m9 6 6 6-6 6" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  check: <path d="m5 12 5 5 9-11" />,
  x: <path d="M6 6l12 12M6 18 18 6" />,
  bolt: <path d="M13 3 4 14h6l-1 7 9-11h-6l1-7Z" />,
  sparkles: (
    <>
      <path d="M12 3v6M9 6h6" />
      <path d="M5 14l1.5 3L10 19l-3.5 1.5L5 24l-1.5-3.5L0 19l3.5-2L5 14ZM19 11l1 2.5 3 1.5-3 1-1 2.5-1.5-2.5L15 15l3-1 1-3Z" />
    </>
  ),
  pin: (
    <>
      <path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  cube: (
    <>
      <path d="M3 8.5 12 4l9 4.5v7L12 20 3 15.5v-7Z" />
      <path d="M3 8.5 12 13l9-4.5M12 13v7" />
    </>
  ),
  building: (
    <>
      <path d="M4 21V5l8-2 8 2v16" />
      <path d="M9 21V11M15 21V11" />
      <path d="M4 21h16" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </>
  ),
  "clip-list": (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 3h6v4H9z" />
      <path d="M9 11h6M9 15h6M9 19h3" />
    </>
  ),
  inbox: (
    <>
      <path d="M3 13l3-8h12l3 8" />
      <path d="M3 13v6h18v-6h-6a3 3 0 0 1-6 0H3Z" />
    </>
  ),
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  plane: <path d="M21 12 11 14l-3 7-2-1 1-6-7-2 1-2 6 1 4-9 2 1-1 6 8 2Z" />,
  stop: <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />,
  play: <path d="M7 5v14l12-7L7 5Z" fill="currentColor" />,
  pause: (
    <>
      <rect x="7" y="5" width="3.5" height="14" rx="1" fill="currentColor" />
      <rect x="13.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" />
    </>
  ),
  car: (
    <>
      <path d="M3 13l2-6h14l2 6" />
      <path d="M2 13h20v6H2z" />
      <circle cx="7" cy="19" r="1.5" fill="currentColor" />
      <circle cx="17" cy="19" r="1.5" fill="currentColor" />
    </>
  ),
  wrench: <path d="M14 4a5 5 0 0 0-2 9.5L4 21l3 .5L15 13a5 5 0 0 0 4-9l-2 2 1 3-3-1-3 3-1-3 3-3-2-1Z" />,
  cloud: <path d="M7 18a4 4 0 0 1 .8-7.9 6 6 0 0 1 11.5 1.4A3.5 3.5 0 0 1 18.5 18H7Z" />,
  send: <path d="m3 12 18-9-7 18-3-7-8-2Z" />,
  alert: (
    <>
      <path d="M12 4 2 21h20L12 4Z" />
      <path d="M12 10v5" />
      <circle cx="12" cy="18" r=".8" fill="currentColor" />
    </>
  ),
  dot: <circle cx="12" cy="12" r="3" fill="currentColor" />,
  refresh: (
    <>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </>
  ),
  doc: (
    <>
      <path d="M6 3h8l4 4v14H6V3Z" />
      <path d="M14 3v4h4" />
      <path d="M9 13h6M9 17h6" />
    </>
  ),
  star: <path d="m12 4 2.4 5 5.6.8-4 4 1 5.6-5-2.6-5 2.6 1-5.6-4-4 5.6-.8L12 4Z" />,
  "trending-up": (
    <>
      <path d="m3 17 6-6 4 4 8-8" />
      <path d="M14 7h7v7" />
    </>
  ),
};
