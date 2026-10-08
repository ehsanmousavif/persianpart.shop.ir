import React from 'react'

export interface SolarIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string
  size?: number
}

/** Solar Linear / Broken Style Ruler & Measure Icon */
export function SolarRulerIcon({ className = 'w-5 h-5', size = 20, ...props }: SolarIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path
        d="M3.275 15.293L15.293 3.275a2.5 2.5 0 0 1 3.536 0l1.896 1.896a2.5 2.5 0 0 1 0 3.536L8.707 20.725a2.5 2.5 0 0 1-3.536 0l-1.896-1.896a2.5 2.5 0 0 1 0-3.536z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M7 11.5l2.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 8.5l2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M13 5.5l2.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

/** Solar Linear Box / Carton Packaging Icon */
export function SolarBoxIcon({ className = 'w-5 h-5', size = 20, ...props }: SolarIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path
        d="M21 8.5v7c0 2.5-1.5 3.5-3.5 4.5l-4 2c-.8.4-2.2.4-3 0l-4-2C4.5 19 3 18 3 15.5v-7C3 6 4.5 5 6.5 4l4-2c.8-.4 2.2-.4 3 0l4 2C19.5 5 21 6 21 8.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3.5 8l8.5 4.5 8.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 12.5V22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.5 5.8l8.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

/** Solar Linear Layers / Tile Count Icon */
export function SolarLayersIcon({ className = 'w-5 h-5', size = 20, ...props }: SolarIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path
        d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 12.5l-9.17 4.16a2 2 0 0 1-1.66 0L2 12.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 17.5l-9.17 4.16a2 2 0 0 1-1.66 0L2 17.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Solar Linear Barcode / SKU Tag Icon */
export function SolarTagIcon({ className = 'w-5 h-5', size = 20, ...props }: SolarIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path
        d="M2 12V6a4 4 0 0 1 4-4h6c.8 0 1.6.3 2.1.9l7 7a3 3 0 0 1 0 4.2l-5.8 5.8a3 3 0 0 1-4.2 0l-7-7A3 3 0 0 1 2 12z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
    </svg>
  )
}

/** Solar Linear Shop / Factory Icon */
export function SolarShopIcon({ className = 'w-5 h-5', size = 20, ...props }: SolarIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path
        d="M3 9l1.6-4.5A2.5 2.5 0 0 1 6.95 3h10.1a2.5 2.5 0 0 1 2.35 1.5L21 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M4 11v8a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M9 22v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

/** Solar Linear Shield Check / Grade Icon */
export function SolarShieldCheckIcon({ className = 'w-5 h-5', size = 20, ...props }: SolarIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path
        d="M12 2l7.5 3.5v6.2c0 5.4-3.4 9.8-7.5 11.3-4.1-1.5-7.5-5.9-7.5-11.3V5.5L12 2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8.5 12l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Solar Linear Palette / Color & Surface Icon */
export function SolarPaletteIcon({ className = 'w-5 h-5', size = 20, ...props }: SolarIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path
        d="M12 2a10 10 0 0 0-4 19.18c.6.25 1-.2 1-.74v-1.12a2.3 2.3 0 0 1 2.3-2.32h1.4c3.48 0 6.3-2.82 6.3-6.3A8.7 8.7 0 0 0 12 2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="7.5" cy="10.5" r="1.2" fill="currentColor" />
      <circle cx="12" cy="7.5" r="1.2" fill="currentColor" />
      <circle cx="16.5" cy="10.5" r="1.2" fill="currentColor" />
    </svg>
  )
}

/** Solar Linear Scale / Weight Icon */
export function SolarScaleIcon({ className = 'w-5 h-5', size = 20, ...props }: SolarIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
      <path d="M12 3v18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 7h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 7l3 7h-6l3-7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M20 7l3 7h-6l3-7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 21h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
