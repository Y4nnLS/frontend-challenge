import type { ReactNode } from "react";

type IconProps = { className?: string; size?: number };

function IconFrame({
  children,
  className,
  size = 20,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </IconFrame>
  );
}
export function CartIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M3 4h2l1.5 11.5h11.8l2-8H6" />
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </IconFrame>
  );
}
export function TrashIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13M10 11v5m4-5v5" />
    </IconFrame>
  );
}
export function UserIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 20c.7-3.1 3.2-5 6.5-5s5.8 1.9 6.5 5" />
    </IconFrame>
  );
}
export function LoginIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M13 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H13" />
      <path d="M11 12h9m-3.5-3.5L20 12l-3.5 3.5" />
    </IconFrame>
  );
}
export function HeartIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M20.8 8.6c0 5.7-8.8 10.2-8.8 10.2S3.2 14.3 3.2 8.6A4.6 4.6 0 0 1 12 6.7a4.6 4.6 0 0 1 8.8 1.9Z" />
    </IconFrame>
  );
}
export function HomeIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="m3.5 10 8.5-7 8.5 7v10h-5.7v-6H9.2v6H3.5Z" />
    </IconFrame>
  );
}
export function ScanIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M8 21H5a2 2 0 0 1-2-2v-3m18 0v3a2 2 0 0 1-2 2h-3" />
      <path d="M7 12h10" />
    </IconFrame>
  );
}
export function SlidersIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M4 6h16M4 18h16" />
      <circle cx="9" cy="6" r="2.2" fill="currentColor" />
      <circle cx="16" cy="18" r="2.2" fill="currentColor" />
    </IconFrame>
  );
}
export function FacebookIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M14.5 8H17V4.5h-2.5c-3 0-4.5 1.8-4.5 4.7V12H7v3.5h3V21h3.7v-5.5h2.8L17 12h-3.3V9.7c0-1 .3-1.7.8-1.7Z" />
    </IconFrame>
  );
}
export function InstagramIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M17.7 6.5h.01" />
    </IconFrame>
  );
}
export function XIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M5 4 19 20M19 4 5 20" />
    </IconFrame>
  );
}
export function LinkedInIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M6 9v9m0-13.2v.1M10 18v-5.2a3.2 3.2 0 0 1 6.4 0V18m-6.4-5.1V18" />
    </IconFrame>
  );
}
export function YoutubeIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M20.2 7.2a2.5 2.5 0 0 0-1.8-1.8C16.8 5 12 5 12 5s-4.8 0-6.4.4A2.5 2.5 0 0 0 3.8 7.2 26 26 0 0 0 3.5 12c0 1.6.1 3.2.3 4.8a2.5 2.5 0 0 0 1.8 1.8C7.2 19 12 19 12 19s4.8 0 6.4-.4a2.5 2.5 0 0 0 1.8-1.8c.2-1.6.3-3.2.3-4.8s-.1-3.2-.3-4.8Z" />
      <path d="m10 9 5 3-5 3Z" />
    </IconFrame>
  );
}
