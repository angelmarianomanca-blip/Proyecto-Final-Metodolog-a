'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Bold,
  CheckCircle2,
  Compass,
  Eye,
  FileAudio,
  FileText,
  Heading1,
  Heading2,
  Lightbulb,
  Link2,
  List,
  Pencil,
  Plus,
  Quote,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatFecha } from '@/lib/format';
import { MAX_LOCAL_AUDIO_BYTES, parseAudioSource } from '@/lib/audio';
import { PredicaTranscript } from '@/components/predica-transcript';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/dialog';
import { FormField } from '@/components/primitives';

interface PredicaListItem {
  id: number;
  titulo: string;
  predicador: string;
  fechaPredica: string;
  pasajeBiblico: string;
  urlArchivoAudio: string;
  reproducciones: number;
  tieneTranscripcion: boolean;
}

const PLANTILLA_PREDICA = `# Introducción del Mensaje

Escribí aquí el párrafo introductorio que presenta el tema central de la prédica.

[CONTEXTO]
Explicá el contexto histórico, bíblico y literario del pasaje que se está estudiando.

## Primer punto principal

Desarrollá la enseñanza bíblica con **ideas clave resaltadas** para facilitar el estudio.

> «Escribí aquí el versículo o cita bíblica central del mensaje.» — Libro Capítulo:Versículo

[EJEMPLO]
Compartí una ilustración, testimonio o ejemplo cotidiano que ayude a comprender esta verdad.

[PRACTICA]
Proponé pasos concretos para aplicar esta enseñanza en la vida diaria y en la congregación:
- Primer paso práctico de oración o estudio.
- Segundo paso práctico de servicio o discipulado.`;

export function GestionPredicasClient({
  predicas,
}: {
  predicas: PredicaListItem[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [titulo, setTitulo] = React.useState('');
  const [predicador, setPredicador] = React.useState('');
  const [fechaPredica, setFechaPredica] = React.useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [pasajeBiblico, setPasaje] = React.useState('');
  const [urlArchivoAudio, setUrlAudio] = React.useState('');
  const [audioMode, setAudioMode] = React.useState<'upload' | 'link'>('upload');
  const [uploadedFileName, setUploadedFileName] = React.useState<string | null>(
    null
  );
  const [uploadedFileSize, setUploadedFileSize] = React.useState<number | null>(
    null
  );
  const [textoTranscripcion, setTranscripcion] = React.useState('');
  const [editorTab, setEditorTab] = React.useState<'edit' | 'preview'>('edit');
  const [saving, setSaving] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const parsedAudio = React.useMemo(
    () => (urlArchivoAudio.trim() ? parseAudioSource(urlArchivoAudio) : null),
    [urlArchivoAudio]
  );

  const openNew = () => {
    setEditingId(null);
    setTitulo('');
    setPredicador('');
    setFechaPredica(new Date().toISOString().slice(0, 10));
    setPasaje('');
    setUrlAudio('');
    setAudioMode('upload');
    setUploadedFileName(null);
    setUploadedFileSize(null);
    setTranscripcion('');
    setEditorTab('edit');
    setOpen(true);
  };

  const openEdit = async (id: number) => {
    const res = await fetch(`/api/predicas/${id}`);
    if (!res.ok) {
      toast.error('No se pudo cargar la prédica.');
      return;
    }
    const p = await res.json();
    setEditingId(p.id);
    setTitulo(p.titulo);
    setPredicador(p.predicador);
    setFechaPredica(p.fechaPredica);
    setPasaje(p.pasajeBiblico);
    setUrlAudio(p.urlArchivoAudio);
    const isLocalData = String(p.urlArchivoAudio ?? '').startsWith(
      'data:audio/'
    );
    setAudioMode(isLocalData ? 'upload' : 'link');
    setUploadedFileName(isLocalData ? 'Archivo de audio cargado' : null);
    setUploadedFileSize(null);
    setTranscripcion(p.textoTranscripcion ?? '');
    setEditorTab('edit');
    setOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !/\.(mp3|ogg|wav|m4a|aac)$/i.test(file.name)) {
      toast.error('Seleccioná un archivo de audio válido (.mp3, .ogg, .wav o .m4a).');
      return;
    }

    if (file.size > MAX_LOCAL_AUDIO_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      toast.error(
        `El archivo pesa ${mb} MB y supera el máximo de 3 MB para carga directa. Para audios más pesados, subilo a Google Drive (público) y pegá el enlace en la pestaña "Enlace".`
      );
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result.startsWith('data:')) {
        toast.error('No se pudo leer el archivo de audio.');
        return;
      }
      setUrlAudio(result);
      setUploadedFileName(file.name);
      setUploadedFileSize(file.size);
      toast.success(`Audio "${file.name}" cargado correctamente.`);
    };
    reader.onerror = () => {
      toast.error('Error al leer el archivo desde tu computadora.');
    };
    reader.readAsDataURL(file);
  };

  const insertSnippet = (prefix: string, placeholder: string, suffix = '') => {
    const el = textareaRef.current;
    if (!el) {
      setTranscripcion((prev) =>
        `${prev}${prev && !prev.endsWith('\n') ? '\n\n' : ''}${prefix}${placeholder}${suffix}`
      );
      return;
    }
    const start = el.selectionStart ?? textoTranscripcion.length;
    const end = el.selectionEnd ?? textoTranscripcion.length;
    const selected = textoTranscripcion.slice(start, end) || placeholder;
    const needsNewlineBefore =
      start > 0 && !prefix.startsWith('**') && textoTranscripcion[start - 1] !== '\n'
        ? '\n\n'
        : '';
    const insertion = `${needsNewlineBefore}${prefix}${selected}${suffix}`;
    const next =
      textoTranscripcion.slice(0, start) +
      insertion +
      textoTranscripcion.slice(end);
    setTranscripcion(next);

    requestAnimationFrame(() => {
      el.focus();
      const cursorStart =
        start + needsNewlineBefore.length + prefix.length;
      el.setSelectionRange(cursorStart, cursorStart + selected.length);
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlArchivoAudio.trim()) {
      toast.error('Subí un archivo de audio desde tu computadora o pegá un enlace de Google Drive / MP3.');
      return;
    }
    setSaving(true);
    try {
      const url = editingId ? `/api/predicas/${editingId}` : '/api/predicas';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          predicador,
          fechaPredica,
          pasajeBiblico,
          urlArchivoAudio,
          textoTranscripcion,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? 'Error al guardar la prédica.');
        return;
      }
      toast.success(
        editingId
          ? 'Prédica actualizada correctamente.'
          : 'Prédica creada correctamente.'
      );
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew}>
          <Plus className="w-4 h-4" />
          <span>Cargar nueva prédica</span>
        </Button>
      </div>

      <div className="bg-white border border-[#E3DACB] rounded-2xl overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#241A13] text-white text-xs">
            <tr>
              <th className="p-4">Título / Pasaje</th>
              <th className="p-4">Predicador</th>
              <th className="p-4">Fecha</th>
              <th className="p-4">Desarrollo escrito</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E3DACB]">
            {predicas.map((p) => (
              <tr key={p.id}>
                <td className="p-4">
                  <div className="font-semibold">{p.titulo}</div>
                  <div className="text-xs text-[#A46B29] font-medium">
                    {p.pasajeBiblico} · {p.reproducciones} reproducciones
                  </div>
                </td>
                <td className="p-4 text-xs">{p.predicador}</td>
                <td className="p-4 text-xs">{formatFecha(p.fechaPredica)}</td>
                <td className="p-4">
                  <StatusBadge
                    status={p.tieneTranscripcion ? 'activo' : 'borrador'}
                    label={p.tieneTranscripcion ? 'Disponible' : 'Pendiente'}
                  />
                </td>
                <td className="p-4 text-right">
                  <Button
                    variant="outlineDark"
                    size="sm"
                    onClick={() => openEdit(p.id)}
                  >
                    Editar prédica
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        eyebrow="Gestión de Prédicas"
        title={editingId ? 'Editar Prédica' : 'Cargar Nueva Prédica'}
        subtitle="Cargá el audio (desde tu computadora o Google Drive) y estructurá la enseñanza con títulos, contexto, ejemplos y práctica."
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSave} className="space-y-5">
          {/* 1. METADATOS */}
          <div className="bg-[#FAF7F1] border border-[#E3DACB] rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[#241A13]">
              1. Datos de la Prédica
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Título de la prédica *">
                <Input
                  required
                  minLength={4}
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej. La suficiencia de la gracia"
                />
              </FormField>
              <FormField label="Pasaje bíblico base *">
                <Input
                  required
                  minLength={3}
                  value={pasajeBiblico}
                  onChange={(e) => setPasaje(e.target.value)}
                  placeholder="Ej. 2 Corintios 12:7-10"
                />
              </FormField>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Predicador *">
                <Input
                  required
                  minLength={3}
                  value={predicador}
                  onChange={(e) => setPredicador(e.target.value)}
                  placeholder="Ej. Pr. Marcos Herrera"
                />
              </FormField>
              <FormField label="Fecha de prédica *">
                <Input
                  type="date"
                  required
                  value={fechaPredica}
                  onChange={(e) => setFechaPredica(e.target.value)}
                />
              </FormField>
            </div>
          </div>

          {/* 2. AUDIO: SUBIR DESDE PC O ENLACE GOOGLE DRIVE / MP3 */}
          <div className="bg-[#FAF7F1] border border-[#E3DACB] rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[#241A13]">
                2. Audio de la Prédica
              </div>
              <div className="inline-flex rounded-full bg-white border border-[#D6CBB8] p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setAudioMode('upload')}
                  className={`px-3 py-1 rounded-full font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    audioMode === 'upload'
                      ? 'bg-[#241A13] text-white'
                      : 'text-[#66584B] hover:text-[#241A13]'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir archivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAudioMode('link')}
                  className={`px-3 py-1 rounded-full font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    audioMode === 'link'
                      ? 'bg-[#241A13] text-white'
                      : 'text-[#66584B] hover:text-[#241A13]'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Google Drive / URL</span>
                </button>
              </div>
            </div>

            {audioMode === 'upload' ? (
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,.mp3,.ogg,.wav,.m4a"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#D6CBB8] hover:border-[#A46B29] bg-white rounded-xl p-5 text-center cursor-pointer transition-colors space-y-2"
                >
                  <div className="w-10 h-10 rounded-full bg-[#F8EFE2] text-[#A46B29] flex items-center justify-center mx-auto">
                    <FileAudio className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-semibold text-[#241A13]">
                    {uploadedFileName
                      ? uploadedFileName
                      : 'Hacé clic para elegir un audio de tu computadora'}
                  </div>
                  <p className="text-xs text-[#66584B]">
                    Formatos .mp3, .ogg, .wav o .m4a (hasta 3 MB). Para prédicas
                    más largas, subí el MP3 a Google Drive y pegá el enlace en la
                    pestaña «Google Drive / URL».
                  </p>
                  {uploadedFileSize && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
                      {(uploadedFileSize / (1024 * 1024)).toFixed(2)} MB listo
                    </span>
                  )}
                </div>

                {urlArchivoAudio.startsWith('data:audio/') && (
                  <div className="flex items-center justify-between gap-2 bg-white border border-[#E3DACB] rounded-xl p-3">
                    <audio controls src={urlArchivoAudio} className="w-full h-9" />
                    <button
                      type="button"
                      onClick={() => {
                        setUrlAudio('');
                        setUploadedFileName(null);
                        setUploadedFileSize(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="p-2 rounded-full text-red-700 hover:bg-red-50 cursor-pointer shrink-0"
                      title="Quitar audio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <FormField
                  label="Enlace de Google Drive (público) o URL directa (.mp3 / .ogg) *"
                  hint='En Google Drive: Compartir → "Cualquier persona con el enlace" → Copiar enlace y pegalo tal cual aquí.'
                >
                  <Input
                    value={
                      urlArchivoAudio.startsWith('data:audio/')
                        ? ''
                        : urlArchivoAudio
                    }
                    onChange={(e) => {
                      setUrlAudio(e.target.value);
                      setUploadedFileName(null);
                      setUploadedFileSize(null);
                    }}
                    className="font-mono"
                    placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                  />
                </FormField>

                {parsedAudio?.kind === 'google-drive' && (
                  <div className="space-y-2 bg-white border border-emerald-200 rounded-xl p-3">
                    <div className="text-xs font-semibold text-emerald-800">
                      ✓ Enlace de Google Drive detectado · Vista previa del
                      reproductor:
                    </div>
                    <iframe
                      src={parsedAudio.embedUrl}
                      allow="autoplay"
                      className="w-full h-[84px] border-0 rounded-lg"
                      title="Vista previa de audio de Google Drive"
                    />
                  </div>
                )}

                {parsedAudio?.kind === 'native' &&
                  !parsedAudio.isUploadedDataUrl &&
                  parsedAudio.src.length > 8 && (
                    <div className="bg-white border border-[#E3DACB] rounded-xl p-3 space-y-1.5">
                      <div className="text-xs font-medium text-[#66584B]">
                        Vista previa del audio:
                      </div>
                      <audio controls src={parsedAudio.src} className="w-full h-9" />
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* 3. DESARROLLO ESTRUCTURADO DE LA ENSEÑANZA */}
          <div className="bg-[#FAF7F1] border border-[#E3DACB] rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#241A13]">
                <FileText className="w-4 h-4 text-[#A46B29]" />
                <span>3. Desarrollo de la Enseñanza</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTranscripcion((prev) =>
                      prev.trim()
                        ? `${prev.trim()}\n\n${PLANTILLA_PREDICA}`
                        : PLANTILLA_PREDICA
                    );
                    setEditorTab('edit');
                    toast.success('Plantilla de estructura insertada.');
                  }}
                  className="px-2.5 py-1 rounded-full bg-white border border-[#D6CBB8] text-[11px] font-semibold text-[#7C4F1D] hover:border-[#A46B29] inline-flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Usar plantilla</span>
                </button>
                <div className="inline-flex rounded-full bg-white border border-[#D6CBB8] p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setEditorTab('edit')}
                    className={`px-3 py-1 rounded-full font-semibold flex items-center gap-1 cursor-pointer ${
                      editorTab === 'edit'
                        ? 'bg-[#241A13] text-white'
                        : 'text-[#66584B]'
                    }`}
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Editar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorTab('preview')}
                    className={`px-3 py-1 rounded-full font-semibold flex items-center gap-1 cursor-pointer ${
                      editorTab === 'preview'
                        ? 'bg-[#241A13] text-white'
                        : 'text-[#66584B]'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Vista previa</span>
                  </button>
                </div>
              </div>
            </div>

            {editorTab === 'edit' ? (
              <>
                <div className="flex flex-wrap gap-1.5 bg-white border border-[#E3DACB] rounded-xl p-2">
                  <button
                    type="button"
                    onClick={() => insertSnippet('# ', 'Título de sección')}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#241A13] hover:bg-[#FAF7F1] border border-transparent hover:border-[#E3DACB] inline-flex items-center gap-1 cursor-pointer"
                    title="Insertar título principal"
                  >
                    <Heading1 className="w-3.5 h-3.5 text-[#A46B29]" />
                    <span>Título</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet('## ', 'Subtítulo del punto')}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#241A13] hover:bg-[#FAF7F1] border border-transparent hover:border-[#E3DACB] inline-flex items-center gap-1 cursor-pointer"
                    title="Insertar subtítulo"
                  >
                    <Heading2 className="w-3.5 h-3.5 text-[#A46B29]" />
                    <span>Subtítulo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertSnippet(
                        '[CONTEXTO]\n',
                        'Contexto histórico y bíblico del pasaje...'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#7C4F1D] bg-[#F8F3EA] hover:bg-[#F0E6D6] inline-flex items-center gap-1 cursor-pointer"
                    title="Insertar bloque de Contexto"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Contexto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertSnippet(
                        '[EJEMPLO]\n',
                        'Ilustración o ejemplo práctico...'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#A46B29] bg-[#FCF9F3] border border-[#E4D6BF] hover:bg-[#F7EFE0] inline-flex items-center gap-1 cursor-pointer"
                    title="Insertar bloque de Ejemplo"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Ejemplo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertSnippet(
                        '[PRACTICA]\n',
                        'Aplicación práctica para la vida diaria...'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#2B5A3E] bg-[#F3F7F2] border border-[#CFE0CC] hover:bg-[#E7F0E5] inline-flex items-center gap-1 cursor-pointer"
                    title="Insertar bloque de Práctica"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Práctica</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertSnippet('> ', '«Cita bíblica destacada» — Referencia')
                    }
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#241A13] hover:bg-[#FAF7F1] border border-transparent hover:border-[#E3DACB] inline-flex items-center gap-1 cursor-pointer"
                    title="Insertar cita bíblica"
                  >
                    <Quote className="w-3.5 h-3.5 text-[#A46B29]" />
                    <span>Cita</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet('- ', 'Elemento de lista')}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#241A13] hover:bg-[#FAF7F1] border border-transparent hover:border-[#E3DACB] inline-flex items-center gap-1 cursor-pointer"
                    title="Insertar lista"
                  >
                    <List className="w-3.5 h-3.5 text-[#A46B29]" />
                    <span>Lista</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet('**', 'texto destacado', '**')}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#241A13] hover:bg-[#FAF7F1] border border-transparent hover:border-[#E3DACB] inline-flex items-center gap-1 cursor-pointer"
                    title="Negrita"
                  >
                    <Bold className="w-3.5 h-3.5 text-[#A46B29]" />
                    <span>Negrita</span>
                  </button>
                </div>

                <Textarea
                  ref={textareaRef}
                  required
                  minLength={20}
                  rows={9}
                  value={textoTranscripcion}
                  onChange={(e) => setTranscripcion(e.target.value)}
                  className="font-serif-editorial leading-relaxed bg-white"
                  placeholder="Usá los botones de arriba para agregar Títulos, Subtítulos, Contexto, Ejemplos, Práctica o Citas bíblicas..."
                />
              </>
            ) : (
              <div className="bg-white border border-[#E3DACB] rounded-xl p-5 max-h-[380px] overflow-y-auto">
                <PredicaTranscript text={textoTranscripcion} />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-xs text-[#66584B]">
              Solo Profesor/Pastor y Administrador pueden gestionar prédicas.
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar prédica'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
