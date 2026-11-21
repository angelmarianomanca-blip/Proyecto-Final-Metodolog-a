import Link from 'next/link';

/**
 * Emblema tipográfico/heráldico limpio de Iglesia de Cristo:
 * sello circular fino con cruz clásica sobre escritura abierta, sin brillos ni estrellas.
 */
export function BrandEmblem({
  size = 'md',
  tone = 'light',
}: {
  size?: 'sm' | 'md' | 'lg';
  tone?: 'light' | 'dark';
}) {
  const dims =
    size === 'lg' ? 'w-12 h-12' : size === 'sm' ? 'w-8 h-8' : 'w-9 h-9';
  const strokePrimary = tone === 'light' ? '#FAF7F1' : '#241A13';
  const strokeAccent = tone === 'light' ? '#D4A366' : '#A46B29';

  return (
    <svg
      viewBox="0 0 40 40"
      className={`${dims} shrink-0`}
      fill="none"
      aria-hidden="true"
    >
      {/* Sello exterior fino */}
      <circle
        cx="20"
        cy="20"
        r="18.25"
        stroke={strokeAccent}
        strokeWidth="1.25"
        strokeOpacity="0.85"
      />
      {/* Aro interior punteado sutil / línea fina */}
      <circle
        cx="20"
        cy="20"
        r="15"
        stroke={strokePrimary}
        strokeWidth="0.75"
        strokeOpacity="0.28"
      />
      {/* Cruz clásica estilizada */}
      <path
        d="M20 9.5V23.5M14.5 14.5H25.5"
        stroke={strokePrimary}
        strokeWidth="1.75"
        strokeLinecap="square"
      />
      {/* Base de Escritura abierta (trazo arquitectónico minimalista) */}
      <path
        d="M11.5 27.5C14.2 25.8 17.3 25.8 20 27.4C22.7 25.8 25.8 25.8 28.5 27.5"
        stroke={strokeAccent}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M13.5 30.2C15.8 29 18 29 20 30.2C22 29 24.2 29 26.5 30.2"
        stroke={strokePrimary}
        strokeWidth="1"
        strokeOpacity="0.55"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BrandLogo({
  href = '/',
  compact = false,
}: {
  href?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-3 text-left"
    >
      <div className="transition-transform duration-300 group-hover:scale-[1.04]">
        <BrandEmblem size={compact ? 'sm' : 'md'} tone="light" />
      </div>
      <div className="border-l border-[#E9D5B5]/20 pl-3 leading-none">
        <div
          className={`font-serif-editorial font-semibold tracking-tight text-[#FAF7F1] ${
            compact ? 'text-base' : 'text-lg sm:text-[1.22rem]'
          }`}
        >
          Iglesia{' '}
          <span className="italic font-normal text-[#D4A366]">de</span> Cristo
        </div>
        <div className="text-[9.5px] tracking-[0.22em] uppercase text-[#C4B49C] mt-1 font-medium">
          Formación Teológica
        </div>
      </div>
    </Link>
  );
}
