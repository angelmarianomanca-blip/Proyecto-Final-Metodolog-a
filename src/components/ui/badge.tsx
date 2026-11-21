import { cn } from '@/lib/utils';

const STATUS_MAP: Record<string, { cls: string; label: string }> = {
  publicado: {
    cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    label: 'Publicado',
  },
  finalizado: {
    cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    label: 'Finalizado',
  },
  activo: {
    cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    label: 'Activo',
  },
  respondida: {
    cls: 'bg-sky-50 text-sky-800 border-sky-200',
    label: 'Respondida',
  },
  en_curso: {
    cls: 'bg-sky-50 text-sky-800 border-sky-200',
    label: 'En curso',
  },
  borrador: {
    cls: 'bg-[#F8EFE2] text-[#7C4F1D] border-[#E4CCA8]',
    label: 'Borrador',
  },
  abierta: {
    cls: 'bg-[#F8EFE2] text-[#7C4F1D] border-[#E4CCA8]',
    label: 'Abierta',
  },
  archivado: {
    cls: 'bg-stone-100 text-stone-700 border-stone-300',
    label: 'Archivado',
  },
  cerrada: {
    cls: 'bg-stone-100 text-stone-700 border-stone-300',
    label: 'Cerrada',
  },
  inactivo: {
    cls: 'bg-red-50 text-red-800 border-red-200',
    label: 'Inactivo',
  },
  admin: {
    cls: 'bg-[#241A13] text-[#F5ECD8] border-[#241A13]',
    label: 'Administrador',
  },
  profesor: {
    cls: 'bg-[#F8EFE2] text-[#7C4F1D] border-[#E4CCA8]',
    label: 'Profesor / Pastor',
  },
  alumno: {
    cls: 'bg-[#EFE8DC] text-[#4A3B2E] border-[#DDD2C0]',
    label: 'Alumno',
  },
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  const cfg = STATUS_MAP[status] ?? {
    cls: 'bg-stone-100 text-stone-700 border-stone-300',
    label: status,
  };
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        cfg.cls,
        className
      )}
    >
      {label ?? cfg.label}
    </span>
  );
}
