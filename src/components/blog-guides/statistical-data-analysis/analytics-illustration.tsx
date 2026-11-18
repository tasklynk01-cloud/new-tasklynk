export function AnalyticsIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 420"
      role="img"
      aria-label="Analytics lab illustration with a bar chart, a scatter plot with a regression line and a bell curve"
      className={className}
    >
      <rect x="4" y="4" width="512" height="412" rx="28" fill="#FAF8FD" stroke="#E4D9F5" strokeWidth="2" />
      {/* bar chart */}
      <g transform="translate(36 40)">
        <rect width="220" height="170" rx="16" fill="#FFFFFF" stroke="#E4D9F5" />
        <line x1="22" y1="140" x2="200" y2="140" stroke="#22183D" strokeWidth="2" />
        <rect x="34" y="90" width="28" height="50" rx="4" fill="#2a0e74" />
        <rect x="74" y="60" width="28" height="80" rx="4" fill="#FF7A3D" />
        <rect x="114" y="75" width="28" height="65" rx="4" fill="#2a0e74" />
        <rect x="154" y="35" width="28" height="105" rx="4" fill="#FF7A3D" />
      </g>
      {/* scatter */}
      <g transform="translate(274 40)">
        <rect width="210" height="170" rx="16" fill="#FFFFFF" stroke="#E4D9F5" />
        <line x1="24" y1="140" x2="190" y2="140" stroke="#22183D" strokeWidth="2" />
        <line x1="24" y1="140" x2="24" y2="20" stroke="#22183D" strokeWidth="2" />
        {[
          [44, 118], [62, 104], [78, 112], [96, 88], [110, 92], [128, 70], [144, 74], [160, 50], [174, 40], [88, 100], [120, 82], [150, 62],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="5" fill="#2a0e74" />
        ))}
        <line x1="36" y1="126" x2="184" y2="36" stroke="#FF7A3D" strokeWidth="4" strokeLinecap="round" />
      </g>
      {/* bell curve */}
      <g transform="translate(36 230)">
        <rect width="448" height="156" rx="16" fill="#22183D" />
        <path
          d="M30 130 C 90 128, 130 120, 170 80 C 200 46, 215 28, 224 28 C 233 28, 248 46, 278 80 C 318 120, 358 128, 418 130 Z"
          fill="#FF7A3D"
          fillOpacity="0.9"
        />
        <line x1="224" y1="24" x2="224" y2="130" stroke="#FAF8FD" strokeWidth="2" strokeDasharray="5 5" />
        <line x1="30" y1="130" x2="418" y2="130" stroke="#FAF8FD" strokeWidth="2" />
        <text x="224" y="148" textAnchor="middle" fill="#FAF8FD" fontSize="12" fontFamily="sans-serif">
          mean
        </text>
      </g>
    </svg>
  );
}
