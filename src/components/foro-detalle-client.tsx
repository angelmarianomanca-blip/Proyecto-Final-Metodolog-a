'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { SessionUser } from '@/lib/auth/session';
import { formatFechaHora } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { ConfirmDialog, Modal } from '@/components/ui/dialog';
import { FormField } from '@/components/primitives';

export function ForoDetalleClient({
  user,
  consulta,
}: {
  user: SessionUser;
  consulta: {
    id: number;
    cursoTitulo: string;
    leccionTitulo: string | null;
    usuarioId: number;
    autor: string;
    autorRol: string;
    tituloConsulta: string;
    mensajePregunta: string;
    fechaCreacion: string;
    estado: string;
    respuestas: Array<{
      id: number;
      usuarioId: number;
      autor: string;
      autorRol: string;
      respuesta: string;
      fechaRespuesta: string;
    }>;
  };
}) {
  const router = useRouter();
  const isMod = user.rol === 'admin' || user.rol === 'profesor';
  const isAuthor = user.id === consulta.usuarioId;
  const canEditOwn = isAuthor && consulta.respuestas.length === 0 && consulta.estado !== 'cerrada';

  const [reply, setReply] = React.useState('');
  const [sending, setSending] = React.useState(false);

  const [editOpen, setEditOpen] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState(consulta.tituloConsulta);
  const [editMsg, setEditMsg] = React.useState(consulta.mensajePregunta);

  const [confirmState, setConfirmState] = React.useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  } | null>(null);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/foros/${consulta.id}/respuestas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respuesta: reply }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? 'No se pudo publicar la respuesta.');
        return;
      }
      toast.success('Respuesta publicada correctamente.');
      setReply('');
      router.refresh();
    } finally {
      setSending(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/foros/${consulta.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tituloConsulta: editTitle,
        mensajePregunta: editMsg,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error?.message ?? 'No se pudo editar.');
      return;
    }
    toast.success('Consulta actualizada.');
    setEditOpen(false);
    router.refresh();
  };

  const handleCerrarHilo = () => {
    setConfirmState({
      open: true,
      title: 'Cerrar hilo de consulta',
      description:
        'Al cerrar el hilo no se admitirán nuevas respuestas (RN-10). ¿Confirmás el cierre?',
      action: async () => {
        const res = await fetch(`/api/foros/${consulta.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: 'cerrada' }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error?.message ?? 'Error al cerrar.');
          return;
        }
        toast.success('Hilo cerrado por moderación.');
        setConfirmState(null);
        router.refresh();
      },
    });
  };

  const handleEliminarConsulta = () => {
    setConfirmState({
      open: true,
      title: 'Eliminar consulta completa',
      description:
        'Esta acción eliminará la consulta y sus respuestas asociadas. ¿Continuar?',
      action: async () => {
        const res = await fetch(`/api/foros/${consulta.id}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error?.message ?? 'No se pudo eliminar.');
          return;
        }
        toast.success('Consulta eliminada.');
        setConfirmState(null);
        router.push('/foros');
        router.refresh();
      },
    });
  };

  const handleEliminarRespuesta = (respuestaId: number) => {
    setConfirmState({
      open: true,
      title: 'Eliminar respuesta',
      description: '¿Querés eliminar esta respuesta del hilo por moderación?',
      action: async () => {
        const res = await fetch(`/api/foros/respuestas/${respuestaId}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          toast.error('No se pudo eliminar la respuesta.');
          return;
        }
        toast.success('Respuesta eliminada.');
        setConfirmState(null);
        router.refresh();
      },
    });
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-[#E3DACB] rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={consulta.estado} />
              <span className="text-xs text-[#A46B29] font-semibold">
                {consulta.cursoTitulo}
                {consulta.leccionTitulo ? ` · ${consulta.leccionTitulo}` : ''}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">
              {consulta.tituloConsulta}
            </h1>
            <div className="text-xs text-[#66584B]">
              Consultado por <strong>{consulta.autor}</strong> ·{' '}
              {formatFechaHora(consulta.fechaCreacion)}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(canEditOwn || isMod) && (
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                Editar
              </Button>
            )}
            {isMod && consulta.estado !== 'cerrada' && (
              <Button variant="dark" size="sm" onClick={handleCerrarHilo}>
                Cerrar hilo
              </Button>
            )}
            {(canEditOwn || isMod) && (
              <Button
                variant="destructiveOutline"
                size="sm"
                onClick={handleEliminarConsulta}
              >
                Eliminar
              </Button>
            )}
          </div>
        </div>

        <p className="text-sm leading-relaxed text-[#2D221A] bg-[#FAF7F1] p-4 rounded-xl border border-[#E3DACB] whitespace-pre-line">
          {consulta.mensajePregunta}
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-[#66584B]">
          Respuestas ({consulta.respuestas.length})
        </h2>
        {consulta.respuestas.length === 0 ? (
          <div className="bg-white border border-dashed border-[#D6CBB8] rounded-2xl p-6 text-center text-sm text-[#66584B]">
            Aún no hay respuestas en este hilo.
          </div>
        ) : (
          consulta.respuestas.map((r) => {
            const isDoc = r.autorRol === 'profesor' || r.autorRol === 'admin';
            return (
              <div
                key={r.id}
                className={`bg-white border rounded-2xl p-5 space-y-2 ${
                  isDoc ? 'border-[#A46B29]/55' : 'border-[#E3DACB]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <strong>{r.autor}</strong>
                    <StatusBadge status={r.autorRol} />
                    <span className="text-[#66584B]">
                      {formatFechaHora(r.fechaRespuesta)}
                    </span>
                  </div>
                  {isMod && (
                    <button
                      type="button"
                      onClick={() => handleEliminarRespuesta(r.id)}
                      className="text-xs text-red-700 hover:underline cursor-pointer"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-[#2D221A] whitespace-pre-line">
                  {r.respuesta}
                </p>
              </div>
            );
          })
        )}
      </div>

      {consulta.estado === 'cerrada' ? (
        <div className="p-4 rounded-2xl bg-stone-100 border border-stone-300 text-xs text-stone-700 text-center">
          Este hilo fue cerrado por moderación docente. No se admiten nuevas
          respuestas (RN-10).
        </div>
      ) : (
        <form
          onSubmit={handleReply}
          className="bg-white border border-[#E3DACB] rounded-2xl p-4 space-y-3"
        >
          <Textarea
            rows={3}
            required
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Escribí tu respuesta o aporte bíblico..."
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={sending}>
              {sending ? 'Publicando...' : 'Publicar respuesta'}
            </Button>
          </div>
        </form>
      )}

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar consulta"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <FormField label="Título">
            <Input
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
          </FormField>
          <FormField label="Pregunta">
            <Textarea
              required
              rows={4}
              value={editMsg}
              onChange={(e) => setEditMsg(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar cambios</Button>
          </div>
        </form>
      </Modal>

      {confirmState && (
        <ConfirmDialog
          open={confirmState.open}
          onClose={() => setConfirmState(null)}
          onConfirm={confirmState.action}
          title={confirmState.title}
          description={confirmState.description}
        />
      )}
    </div>
  );
}
