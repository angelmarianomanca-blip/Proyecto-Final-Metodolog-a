const PORTRAIT_CONFIGS = [
  { skin: '#D4B7A0', hair: '#231A14', shirt: '#ECE5D8', beard: false, glasses: false, style: 'short' },
  { skin: '#E2C6B0', hair: '#6E4C36', shirt: '#DED5C5', beard: false, glasses: false, style: 'long' },
  { skin: '#DEC0AA', hair: '#28211C', shirt: '#231A14', beard: false, glasses: true, style: 'short' },
  { skin: '#C9A489', hair: '#3B2F28', shirt: '#332820', beard: true, glasses: false, style: 'full' },
  { skin: '#E3C7B3', hair: '#7D6352', shirt: '#E4DDD0', beard: true, glasses: false, style: 'short' },
  { skin: '#B79277', hair: '#29221D', shirt: '#3E3229', beard: false, glasses: true, style: 'silver' },
];

export function TeacherPortrait({ idx }: { idx: number }) {
  const c = PORTRAIT_CONFIGS[idx % PORTRAIT_CONFIGS.length];
  const gradId = `tGrad-${idx}`;
  const fadeId = `tFade-${idx}`;
  return (
    <svg
      viewBox="0 0 240 250"
      className="w-full h-full block"
      style={{ filter: 'sepia(26%) saturate(75%) contrast(1.06)' }}
    >
      <defs>
        <radialGradient id={gradId} cx="50%" cy="38%" r="65%">
          <stop offset="0%" stopColor="#E6DCCB" />
          <stop offset="100%" stopColor="#8A7966" />
        </radialGradient>
        <linearGradient id={fadeId} x1="0" y1="0.52" x2="0" y2="1">
          <stop offset="0%" stopColor="#241A13" stopOpacity="0" />
          <stop offset="100%" stopColor="#1E1510" stopOpacity="0.88" />
        </linearGradient>
      </defs>
      <rect width="240" height="250" fill={`url(#${gradId})`} />
      {c.style === 'long' && (
        <path
          d="M62 110 Q60 44 120 42 Q180 44 178 110 L185 205 L55 205 Z"
          fill={c.hair}
        />
      )}
      <path
        d="M36 250 C42 190 78 175 120 175 C162 175 198 190 204 250 Z"
        fill={c.shirt}
      />
      <rect x="103" y="145" width="34" height="38" rx="14" fill={c.skin} />
      <ellipse cx="120" cy="112" rx="40" ry="48" fill={c.skin} />
      {c.style === 'short' || c.style === 'full' ? (
        <path
          d="M80 105 C78 62 104 46 125 48 C154 50 163 68 160 104 C153 84 140 76 120 76 C98 76 86 86 80 105 Z"
          fill={c.hair}
        />
      ) : c.style === 'silver' ? (
        <path
          d="M74 114 C72 60 100 46 122 46 C152 46 168 70 166 122 C160 90 144 74 120 74 C96 74 80 90 74 114 Z"
          fill="#B8B0A4"
        />
      ) : (
        <path
          d="M80 98 C82 58 104 48 122 48 C148 48 160 64 160 98 C145 78 134 74 120 74 C104 74 90 80 80 98 Z"
          fill={c.hair}
        />
      )}
      <circle cx="104" cy="110" r="3.4" fill="#241A13" />
      <circle cx="136" cy="110" r="3.4" fill="#241A13" />
      <path
        d="M94 100 Q104 96 112 100"
        stroke="#36281F"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M128 100 Q136 96 146 100"
        stroke="#36281F"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M119 112 L117 125 L123 126"
        stroke="#8C6D58"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {c.beard && (
        <path
          d="M84 122 Q86 162 120 164 Q154 162 156 122 Q144 134 120 134 Q96 134 84 122 Z"
          fill={c.hair}
          opacity="0.92"
        />
      )}
      <path
        d="M107 137 Q120 145 133 137"
        stroke="#573B2E"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      {c.glasses && (
        <g stroke="#241A13" strokeWidth="2.4" fill="none">
          <rect x="91" y="101" width="24" height="16" rx="4" />
          <rect x="125" y="101" width="24" height="16" rx="4" />
          <line x1="115" y1="108" x2="125" y2="108" />
        </g>
      )}
      <g>
        <rect x="115" y="160" width="11" height="22" rx="5" fill="#241A13" />
        <rect x="117" y="182" width="7" height="44" rx="2" fill="#3B2B20" />
      </g>
      <rect width="240" height="250" fill={`url(#${fadeId})`} />
    </svg>
  );
}
