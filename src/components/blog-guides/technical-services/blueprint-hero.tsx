export function BlueprintIllustration() {
  return (
    <svg
      viewBox="0 0 480 340"
      role="img"
      aria-label="Blueprint style illustration of a code editor window connected by API nodes to a database cylinder and a gear"
      className="h-auto w-full"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <pattern id="bp-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" stroke="#FF7A3D" strokeOpacity="0.18" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="480" height="340" rx="16" fill="url(#bp-grid)" />
      {/* editor window */}
      <rect x="24" y="30" width="210" height="150" rx="10" stroke="#FF7A3D" strokeWidth="2.5" />
      <path d="M24 56H234" stroke="#FF7A3D" strokeWidth="2" />
      <circle cx="42" cy="43" r="4" stroke="#FF7A3D" strokeWidth="1.5" />
      <circle cx="58" cy="43" r="4" stroke="#FF7A3D" strokeWidth="1.5" />
      <circle cx="74" cy="43" r="4" stroke="#FF7A3D" strokeWidth="1.5" />
      <path d="M48 84L38 96L48 108" stroke="#8b5cf6" strokeWidth="3" />
      <path d="M96 84L106 96L96 108" stroke="#8b5cf6" strokeWidth="3" />
      <path d="M78 114L68 78" stroke="#FF7A3D" strokeWidth="3" />
      <path d="M126 88H206M126 106H190M48 134H170M48 152H210" stroke="#8b5cf6" strokeWidth="2" strokeOpacity="0.7" />
      {/* api nodes */}
      <path d="M234 105H290L320 70H370" stroke="#FF7A3D" strokeWidth="2" strokeDasharray="6 5" />
      <path d="M234 105H290L320 150H370" stroke="#FF7A3D" strokeWidth="2" strokeDasharray="6 5" />
      <circle cx="290" cy="105" r="9" fill="#FAF8FD" stroke="#FF7A3D" strokeWidth="2.5" />
      <circle cx="320" cy="70" r="9" fill="#FAF8FD" stroke="#8b5cf6" strokeWidth="2.5" />
      <circle cx="320" cy="150" r="9" fill="#FAF8FD" stroke="#8b5cf6" strokeWidth="2.5" />
      {/* gear */}
      <circle cx="405" cy="70" r="22" stroke="#FF7A3D" strokeWidth="2.5" />
      <circle cx="405" cy="70" r="8" stroke="#FF7A3D" strokeWidth="2.5" />
      <path d="M405 38V30M405 110V102M373 70H365M445 70H437M382 47L376 41M434 99L428 93M428 47L434 41M376 99L382 93" stroke="#FF7A3D" strokeWidth="3" />
      {/* database */}
      <ellipse cx="405" cy="230" rx="42" ry="14" stroke="#8b5cf6" strokeWidth="2.5" />
      <path d="M363 230V290C363 298 382 304 405 304C428 304 447 298 447 290V230" stroke="#8b5cf6" strokeWidth="2.5" />
      <path d="M363 260C363 268 382 274 405 274C428 274 447 268 447 260" stroke="#8b5cf6" strokeWidth="2" />
      <path d="M405 150V216" stroke="#FF7A3D" strokeWidth="2" strokeDasharray="6 5" />
      <circle cx="405" cy="190" r="9" fill="#FAF8FD" stroke="#FF7A3D" strokeWidth="2.5" />
      {/* dimension lines */}
      <path d="M24 205H234M24 199V211M234 199V211" stroke="#FF7A3D" strokeWidth="1.5" />
      <path d="M24 250H300M24 244V256M300 244V256" stroke="#8b5cf6" strokeWidth="1.5" strokeOpacity="0.7" />
      <path d="M24 295H210" stroke="#FF7A3D" strokeWidth="1.5" strokeOpacity="0.6" strokeDasharray="3 5" />
    </svg>
  );
}
