export function RoadmapIllustration() {
  const flags = [
    { x: 60, y: 200, label: "Topic" },
    { x: 190, y: 120, label: "Proposal" },
    { x: 330, y: 190, label: "Method" },
    { x: 470, y: 110, label: "Data" },
    { x: 610, y: 180, label: "Results" },
    { x: 740, y: 90, label: "Viva" },
  ];
  return (
    <svg
      viewBox="0 0 820 260"
      role="img"
      aria-label="A winding path with six milestone flags: topic, proposal, methodology, data, results and viva"
      className="mx-auto h-auto w-full max-w-3xl"
    >
      <defs>
        <linearGradient id="pathGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#FF7A3D" />
          <stop offset="1" stopColor="#2a0e74" />
        </linearGradient>
      </defs>
      <path
        d="M40 230 C 100 250, 140 120, 200 140 S 300 240, 340 210 S 440 90, 480 130 S 580 220, 620 195 S 710 90, 760 105"
        fill="none"
        stroke="url(#pathGrad)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray="2 14"
      />
      {flags.map((f) => (
        <g key={f.label}>
          <line x1={f.x} y1={f.y} x2={f.x} y2={f.y - 46} stroke="#22183D" strokeWidth="3" className="dark:stroke-white" />
          <path d={`M${f.x} ${f.y - 46} l34 10 l-34 12 z`} fill="#FF7A3D" />
          <circle cx={f.x} cy={f.y} r="6" fill="#2a0e74" className="dark:fill-white" />
          <text x={f.x} y={f.y + 24} textAnchor="middle" fontSize="15" fontWeight="600" fill="#22183D" className="dark:fill-white">
            {f.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function StageIcon({ n }: { n: number }) {
  return (
    <svg viewBox="0 0 40 40" role="img" aria-label={`Stage ${n}`} className="h-10 w-10">
      <circle cx="20" cy="20" r="19" fill="#FF7A3D" />
      <text x="20" y="26" textAnchor="middle" fontSize="18" fontWeight="700" fill="#ffffff">
        {n}
      </text>
    </svg>
  );
}
