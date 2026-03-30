import { SVGProps } from 'react';

export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient id="d20-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-hover)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
        <filter id="d20-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Main Hexagon Outline */}
      <polygon
        points="50,5 95,28 95,72 50,95 5,72 5,28"
        stroke="url(#d20-gradient)"
        strokeWidth="6"
        strokeLinejoin="round"
        fill="var(--surface)"
        filter="url(#d20-glow)"
      />

      {/* Internal Geometry (D20 vertices) */}
      <polyline
        points="5,28 50,50 95,28"
        stroke="url(#d20-gradient)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <line
        x1="50" y1="50" x2="50" y2="95"
        stroke="url(#d20-gradient)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <polygon
        points="30,75 50,50 70,75"
        stroke="url(#d20-gradient)"
        strokeWidth="4"
        strokeLinejoin="round"
        fill="var(--accent-muted)"
      />
      <line
        x1="5" y1="72" x2="30" y2="75"
        stroke="url(#d20-gradient)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <line
        x1="95" y1="72" x2="70" y2="75"
        stroke="url(#d20-gradient)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <line
        x1="50" y1="5" x2="50" y2="25"
        stroke="url(#d20-gradient)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <polygon
        points="35,32 50,25 65,32 50,50"
        stroke="url(#d20-gradient)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
