'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function InscribirseButton({ cursoId }: { cursoId: number }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const handleEnroll = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inscripciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cursoId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? 'No pudimos completar la inscripción.');
        return;
      }
      toast.success('¡Inscripción confirmada! Ya podés comenzar en el Aula.');
      router.push(`/aula/${cursoId}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleEnroll}
      disabled={loading}
      className="w-full py-2.5 uppercase tracking-wider"
    >
      {loading ? 'Inscribiendo...' : 'Inscribirme gratis (RF-08)'}
    </Button>
  );
}
