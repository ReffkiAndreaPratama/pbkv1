interface ScoreDialProps {
  value: number;
  from: string;
  to: string;
  label?: string;
  size?: number;
}

/** Cincin skor bergaya terminal untuk layar hasil latihan dan ujian. */
export function ScoreDial({ value, from, to, label = "skor", size = 104 }: ScoreDialProps) {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const safe = Math.min(100, Math.max(0, Math.round(value)));
  const id = `dial-${from.replace("#", "")}-${to.replace("#", "")}-${size}`;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - safe / 100)}
        />
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-extrabold leading-none text-white">{safe}</span>
        <span className="mt-0.5 font-mono-tech text-[8px] uppercase tracking-[0.18em] text-slate-500">{label}</span>
      </div>
    </div>
  );
}
