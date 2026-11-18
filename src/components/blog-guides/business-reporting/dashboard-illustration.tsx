export function DashboardIllustration() {
  return (
    <svg
      viewBox="0 0 520 360"
      role="img"
      aria-label="Illustration of a business dashboard with KPI tiles, a line chart, a donut chart and a bar chart"
      className="h-auto w-full drop-shadow-2xl"
    >
      <rect x="4" y="4" width="512" height="352" rx="20" fill="#1b1233" stroke="#6d4fc2" strokeWidth="2" />
      <rect x="4" y="4" width="512" height="36" rx="20" fill="#2a0e74" />
      <circle cx="28" cy="22" r="5" fill="#FF7A3D" />
      <circle cx="46" cy="22" r="5" fill="#b9a4ee" />
      <circle cx="64" cy="22" r="5" fill="#FAF8FD" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={24 + i * 164} y="56" width="152" height="62" rx="12" fill="#2d2150" />
          <rect x={38 + i * 164} y="70" width="52" height="8" rx="4" fill="#b9a4ee" />
          <rect x={38 + i * 164} y="90" width="86" height="14" rx="5" fill={i === 1 ? '#FF7A3D' : '#FAF8FD'} />
        </g>
      ))}
      <rect x="24" y="132" width="236" height="200" rx="12" fill="#2d2150" />
      <polyline
        points="40,300 80,270 120,282 160,236 200,246 244,190"
        fill="none"
        stroke="#FF7A3D"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="40,310 80,296 120,300 160,272 200,280 244,250"
        fill="none"
        stroke="#b9a4ee"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="40" y="148" width="70" height="8" rx="4" fill="#b9a4ee" />
      <rect x="276" y="132" width="220" height="96" rx="12" fill="#2d2150" />
      <circle cx="338" cy="180" r="30" fill="none" stroke="#b9a4ee" strokeWidth="14" />
      <circle
        cx="338"
        cy="180"
        r="30"
        fill="none"
        stroke="#FF7A3D"
        strokeWidth="14"
        strokeDasharray="110 189"
        transform="rotate(-90 338 180)"
      />
      <rect x="392" y="158" width="80" height="8" rx="4" fill="#FAF8FD" />
      <rect x="392" y="178" width="60" height="8" rx="4" fill="#b9a4ee" />
      <rect x="392" y="198" width="70" height="8" rx="4" fill="#FF7A3D" />
      <rect x="276" y="240" width="220" height="92" rx="12" fill="#2d2150" />
      {[34, 56, 44, 72, 60, 80].map((h, i) => (
        <rect key={i} x={298 + i * 33} y={320 - h} width="20" height={h} rx="4" fill={i % 2 ? '#FF7A3D' : '#b9a4ee'} />
      ))}
    </svg>
  );
}
