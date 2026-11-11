import type { ReactNode } from 'react'

type IconProps = { className?: string; size?: number }

function IconFrame({ children, className, size = 20 }: IconProps & { children: ReactNode }) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
}

export function SearchIcon(props: IconProps) { return <IconFrame {...props}><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></IconFrame> }
export function CartIcon(props: IconProps) { return <IconFrame {...props}><path d="M3 4h2l1.5 11.5h11.8l2-8H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></IconFrame> }
export function UserIcon(props: IconProps) { return <IconFrame {...props}><circle cx="12" cy="8" r="3.2"/><path d="M5.5 20c.7-3.1 3.2-5 6.5-5s5.8 1.9 6.5 5"/></IconFrame> }
export function HeartIcon(props: IconProps) { return <IconFrame {...props}><path d="M20.8 8.6c0 5.7-8.8 10.2-8.8 10.2S3.2 14.3 3.2 8.6A4.6 4.6 0 0 1 12 6.7a4.6 4.6 0 0 1 8.8 1.9Z"/></IconFrame> }
export function HomeIcon(props: IconProps) { return <IconFrame {...props}><path d="m3.5 10 8.5-7 8.5 7v10h-5.7v-6H9.2v6H3.5Z"/></IconFrame> }
export function ScanIcon(props: IconProps) { return <IconFrame {...props}><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M8 21H5a2 2 0 0 1-2-2v-3m18 0v3a2 2 0 0 1-2 2h-3"/><path d="M7 12h10"/></IconFrame> }
export function SlidersIcon(props: IconProps) { return <IconFrame {...props}><path d="M4 6h16M4 18h16"/><circle cx="9" cy="6" r="2.2" fill="currentColor"/><circle cx="16" cy="18" r="2.2" fill="currentColor"/></IconFrame> }
