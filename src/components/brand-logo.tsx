import Link from 'next/link';

export function BrandLogo({
  href = '/',
  compact = false,
}: {
  href?: string;
  compact?: boolean;
}) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5 text-left">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#A46B29] to-[#5B3814] border border-[#E9D5B5]/40 flex items-center justify-center shadow-inner transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3 shrink-0">
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5"
          fill="none"
          stroke="#FAF7F1"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 7v13" />
          <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H5.5A2.5 2.5 0 0 1 3 15.5z" />
          <path d="M21 6.5A2.5 2.5 0 0 0 18.5 4H14a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h4.5a2.5 2.5 0 0 0 2.5-2.5z" />
          <path
            d="M12 1.5l.6 1.5 1.5.6-1.5.6L12 5.7l-.6-1.5-1.5-.6 1.5-.6z"
            fill="#F7E3BA"
            stroke="none"
          />
        </svg>
      </div>
      <div className="leading-none">
        <div
          className={`font-serif-editorial font-bold tracking-tight brand-title-gradient ${
            compact ? 'text-base' : 'text-lg sm:text-xl'
          }`}
        >
          Iglesia <span className="italic font-normal text-[#D4A366]">de</span> Cristo
        </div>
        <div className="text-[10px] tracking-[0.2em] uppercase text-[#D4A366]/90 mt-1 flex items-center gap-1">
          <span>✦</span>
          <span>Formación Teológica</span>
        </div>
      </div>
    </Link>
  );
}
