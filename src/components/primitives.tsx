import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Stack({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-4', className)} {...props} />;
}

export function Inline({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-2', className)}
      {...props}
    />
  );
}

export function Grid({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('grid grid-cols-1 md:grid-cols-2 gap-5', className)}
      {...props}
    />
  );
}

export function Heading({
  as: Tag = 'h1',
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & {
  as?: 'h1' | 'h2' | 'h3' | 'h4';
}) {
  const sizes = {
    h1: 'text-2xl sm:text-3xl font-bold tracking-tight',
    h2: 'text-xl font-bold tracking-tight',
    h3: 'text-lg font-bold',
    h4: 'text-base font-semibold',
  };
  return <Tag className={cn(sizes[Tag], className)} {...props} />;
}

export function Text({
  muted = false,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & { muted?: boolean }) {
  return (
    <p
      className={cn(
        'text-sm leading-relaxed',
        muted ? 'text-[#66584B]' : 'text-[#241A13]',
        className
      )}
      {...props}
    />
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  dark = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  dark?: boolean;
}) {
  if (dark) {
    return (
      <div className="bg-[#241A13] text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          {eyebrow && (
            <span className="text-xs font-bold uppercase tracking-wider text-[#E9D5B5]">
              {eyebrow}
            </span>
          )}
          <Heading as="h1" className="text-white">
            {title}
          </Heading>
          {description && (
            <p className="text-sm text-[#D6CBB8]">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1">
        {eyebrow && (
          <span className="text-xs font-bold uppercase tracking-wider text-[#A46B29]">
            {eyebrow}
          </span>
        )}
        <Heading as="h1">{title}</Heading>
        {description && <Text muted>{description}</Text>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function FormField({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-[#241A13]">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-[#66584B]">{hint}</p>}
      {error && <p className="text-xs text-red-700 font-medium">{error}</p>}
    </div>
  );
}

export function LoadingState({ message = 'Cargando...' }: { message?: string }) {
  return (
    <div className="space-y-4 py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="bg-white border border-[#E3DACB] rounded-2xl p-5 space-y-3"
          >
            <div className="h-4 w-24 bg-[#E9E1D3] rounded-full animate-pulse" />
            <div className="h-6 w-3/4 bg-[#E9E1D3] rounded animate-pulse" />
            <div className="h-14 w-full bg-[#F3EDE2] rounded animate-pulse" />
          </div>
        ))}
      </div>
      <p className="text-xs text-center text-[#66584B]">{message}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-dashed border-[#D6CBB8] rounded-2xl p-10 text-center max-w-lg mx-auto my-6 space-y-3">
      <div className="w-12 h-12 rounded-full bg-[#F8EFE2] text-[#A46B29] flex items-center justify-center mx-auto">
        <BookOpen className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-[#241A13]">{title}</h3>
      <p className="text-sm text-[#66584B]">{description}</p>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'No pudimos cargar esta información',
  description = 'Ocurrió un inconveniente temporal al consultar los datos.',
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-lg mx-auto my-6 space-y-3">
      <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-red-950">{title}</h3>
      <p className="text-sm text-red-900">{description}</p>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  basePath,
  extraParams = {},
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  extraParams?: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const buildUrl = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(extraParams)) {
      if (v) sp.set(k, v);
    }
    sp.set('page', String(p));
    return `${basePath}?${sp.toString()}`;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-[#66584B]">
      <span>
        Mostrando página {page} de {totalPages} ({total} resultados)
      </span>
      <div className="flex gap-1.5">
        {page > 1 ? (
          <Link
            href={buildUrl(page - 1)}
            className="px-3 py-1 rounded-full border border-[#E3DACB] bg-white hover:bg-[#FAF7F1]"
          >
            Anterior
          </Link>
        ) : (
          <span className="px-3 py-1 rounded-full border border-[#E3DACB] bg-white opacity-50">
            Anterior
          </span>
        )}
        <span className="px-3 py-1 rounded-full bg-[#241A13] text-white font-semibold">
          {page}
        </span>
        {page < totalPages ? (
          <Link
            href={buildUrl(page + 1)}
            className="px-3 py-1 rounded-full border border-[#E3DACB] bg-white hover:bg-[#FAF7F1]"
          >
            Siguiente
          </Link>
        ) : (
          <span className="px-3 py-1 rounded-full border border-[#E3DACB] bg-white opacity-50">
            Siguiente
          </span>
        )}
      </div>
    </div>
  );
}
