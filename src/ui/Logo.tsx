/** A sounding line dropping through the surface. */
export function Logo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4.5 10.25c1.25-1 2.5-1 3.75 0s2.5 1 3.75 0 2.5-1 3.75 0 2.5 1 3.75 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M12 13.25v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="18.6" r="1.4" fill="currentColor" />
    </svg>
  );
}
