/** Geometric SortFlow mark — one belt splitting into three sorted lanes. */
export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="7" fill="#0F1826" stroke="#28374F" strokeWidth="1.2" />
      <path d="M6 16H15" stroke="#2DD4BF" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M15 16L23 9" stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M15 16H23" stroke="#2DD4BF" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M15 16L23 23" stroke="#818CF8" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="15" cy="16" r="2.4" fill="#2DD4BF" />
      <circle cx="23.5" cy="9" r="1.7" fill="#38BDF8" />
      <circle cx="23.5" cy="16" r="1.7" fill="#2DD4BF" />
      <circle cx="23.5" cy="23" r="1.7" fill="#818CF8" />
    </svg>
  )
}
