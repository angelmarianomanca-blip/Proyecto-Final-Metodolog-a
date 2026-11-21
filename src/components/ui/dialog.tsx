'use client';

import * as React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  eyebrow,
  maxWidth = 'max-w-xl',
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  maxWidth?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-3 sm:p-5">
      <div
        className={cn(
          'bg-white border border-[#E3DACB] rounded-2xl p-5 sm:p-6 w-full max-h-[92vh] overflow-y-auto shadow-2xl text-[#241A13]',
          maxWidth
        )}
      >
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#E3DACB] mb-4">
          <div>
            {eyebrow && (
              <div className="text-xs font-bold uppercase tracking-wider text-[#A46B29]">
                {eyebrow}
              </div>
            )}
            <h3 className="text-xl font-bold mt-0.5">{title}</h3>
            {subtitle && (
              <p className="text-xs text-[#66584B] mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#FAF7F1] text-[#66584B]"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4">
      <div className="bg-white border border-[#E3DACB] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-full bg-red-50 text-red-700 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#241A13]">{title}</h3>
            <p className="text-sm text-[#66584B] mt-1">{description}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? 'Procesando...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
