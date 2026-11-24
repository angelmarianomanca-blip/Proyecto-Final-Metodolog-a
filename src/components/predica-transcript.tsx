'use client';

import * as React from 'react';
import {
  BookmarkCheck,
  BookOpen,
  CheckCircle2,
  Compass,
  Heart,
  Lightbulb,
  Quote,
  Sparkles,
} from 'lucide-react';

type SemanticKind =
  | 'introduccion'
  | 'oracion'
  | 'contexto'
  | 'ejemplo'
  | 'practica'
  | 'conclusion';

type Block =
  | { type: 'h1'; text: string }
  | { type: 'h2'; text: string }
  | { type: SemanticKind; title: string; lines: string[] }
  | { type: 'cita'; lines: string[] }
  | { type: 'lista'; items: string[] }
  | { type: 'parrafo'; text: string };

function parseTranscriptBlocks(raw: string): Block[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }

    // Título principal (# )
    if (/^#\s+/.test(line)) {
      blocks.push({ type: 'h1', text: line.replace(/^#\s+/, '').trim() });
      i++;
      continue;
    }

    // Subtítulo (## o ### )
    if (/^#{2,3}\s+/.test(line)) {
      blocks.push({ type: 'h2', text: line.replace(/^#{2,3}\s+/, '').trim() });
      i++;
      continue;
    }

    // Bloques semánticos: [INTRODUCCION], [ORACION], [CONTEXTO], [EJEMPLO], [PRACTICA], [CONCLUSION]
    const tagMatch = line.match(
      /^\[(INTRODUCCI[ÓO]N|ORACI[ÓO]N|CONTEXTO|EJEMPLO|PR[ÁA]CTICA|APLICACI[ÓO]N|CONCLUSI[ÓO]N)\]\s*(.*)$/i
    );
    const naturalMatch = tagMatch
      ? null
      : line.match(
          /^(Introducci[óo]n|Oraci[óo]n(?:\s+(?:inicial|final))?|Contexto(?:\s+(?:hist[óo]rico|b[íi]blico))?|Ejemplo|Ilustraci[óo]n|Pr[áa]ctica|Aplicaci[óo]n(?:\s+pr[áa]ctica)?|Conclusi[óo]n)\s*:\s*(.*)$/i
        );

    if (tagMatch || naturalMatch) {
      const rawKind = (tagMatch?.[1] ?? naturalMatch?.[1] ?? '').toLowerCase();
      const firstLine = (tagMatch?.[2] ?? naturalMatch?.[2] ?? '').trim();

      let kind: SemanticKind = 'contexto';
      let defaultTitle = 'Contexto Bíblico e Histórico';
      if (rawKind.startsWith('intro')) {
        kind = 'introduccion';
        defaultTitle = 'Introducción';
      } else if (rawKind.startsWith('orac')) {
        kind = 'oracion';
        defaultTitle = 'Oración';
      } else if (rawKind.startsWith('ej') || rawKind.startsWith('ilust')) {
        kind = 'ejemplo';
        defaultTitle = 'Ejemplo e Ilustración';
      } else if (rawKind.startsWith('pr') || rawKind.startsWith('aplic')) {
        kind = 'practica';
        defaultTitle = 'Aplicación Práctica';
      } else if (rawKind.startsWith('concl')) {
        kind = 'conclusion';
        defaultTitle = 'Conclusión';
      }

      const collected: string[] = [];
      if (firstLine) collected.push(firstLine);
      i++;
      // Recoger líneas contiguas hasta línea en blanco o nuevo marcador
      while (i < lines.length) {
        const next = lines[i].trim();
        if (
          !next ||
          /^#{1,3}\s+/.test(next) ||
          /^\[(INTRODUCCI[ÓO]N|ORACI[ÓO]N|CONTEXTO|EJEMPLO|PR[ÁA]CTICA|APLICACI[ÓO]N|CONCLUSI[ÓO]N)\]/i.test(
            next
          ) ||
          /^>\s*/.test(next)
        ) {
          break;
        }
        collected.push(next);
        i++;
      }

      blocks.push({
        type: kind,
        title: defaultTitle,
        lines: collected.length > 0 ? collected : [''],
      });
      continue;
    }

    // Citas bíblicas (> )
    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, '').trim());
        i++;
      }
      blocks.push({ type: 'cita', lines: quoteLines });
      continue;
    }

    // Listas (- o • o *)
    if (/^[-•*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-•*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-•*]\s+/, '').trim());
        i++;
      }
      blocks.push({ type: 'lista', items });
      continue;
    }

    // Párrafo normal
    blocks.push({ type: 'parrafo', text: line });
    i++;
  }

  return blocks;
}

function renderInlineFormatting(
  text: string,
  highlightQuery?: string
): React.ReactNode {
  const highlightText = (segment: string, keyPrefix: string) => {
    const q = highlightQuery?.trim();
    if (!q) return segment;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = segment.split(new RegExp(`(${escaped})`, 'gi'));
    return parts.map((part, idx) =>
      part.toLowerCase() === q.toLowerCase() ? (
        <mark
          key={`${keyPrefix}-m-${idx}`}
          className="bg-[#E9D5B5] text-[#241A13] px-0.5 rounded"
        >
          {part}
        </mark>
      ) : (
        <React.Fragment key={`${keyPrefix}-t-${idx}`}>{part}</React.Fragment>
      )
    );
  };

  // Soporta **negrita** y *cursiva*
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return tokens.map((tok, idx) => {
    if (tok.startsWith('**') && tok.endsWith('**') && tok.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-[#241A13]">
          {highlightText(tok.slice(2, -2), `b-${idx}`)}
        </strong>
      );
    }
    if (tok.startsWith('*') && tok.endsWith('*') && tok.length > 2) {
      return (
        <em key={idx} className="italic">
          {highlightText(tok.slice(1, -1), `i-${idx}`)}
        </em>
      );
    }
    return (
      <React.Fragment key={idx}>
        {highlightText(tok, `p-${idx}`)}
      </React.Fragment>
    );
  });
}

export function estimateReadingMinutes(text: string): number {
  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

export function PredicaTranscript({
  text,
  highlightQuery,
}: {
  text: string;
  highlightQuery?: string;
}) {
  const blocks = React.useMemo(() => parseTranscriptBlocks(text), [text]);

  if (blocks.length === 0) {
    return (
      <div className="text-sm text-[#66584B] italic py-4">
        Todavía no hay contenido escrito para esta prédica.
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'h1':
            return (
              <div
                key={idx}
                className="pt-3 first:pt-0 pb-2 border-b border-[#E3DACB]"
              >
                <h3 className="font-serif-editorial text-2xl sm:text-[1.65rem] font-bold text-[#241A13] tracking-tight leading-snug">
                  {renderInlineFormatting(block.text, highlightQuery)}
                </h3>
              </div>
            );

          case 'h2':
            return (
              <div key={idx} className="pt-2 flex items-center gap-2.5">
                <span
                  className="w-1.5 h-5 rounded-full bg-[#A46B29] shrink-0"
                  aria-hidden="true"
                />
                <h4 className="text-lg font-bold text-[#241A13] leading-snug">
                  {renderInlineFormatting(block.text, highlightQuery)}
                </h4>
              </div>
            );

          case 'introduccion':
            return (
              <aside
                key={idx}
                className="rounded-2xl bg-[#FAF6EE] border border-[#E6D9C3] p-5 space-y-2.5"
              >
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8C5A21]">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>{block.title}</span>
                </div>
                <div className="font-serif-editorial text-[1rem] leading-relaxed text-[#2D221A] space-y-2">
                  {block.lines.map((l, j) => (
                    <p key={j}>{renderInlineFormatting(l, highlightQuery)}</p>
                  ))}
                </div>
              </aside>
            );

          case 'oracion':
            return (
              <aside
                key={idx}
                className="rounded-2xl bg-[#F6F4FA] border border-[#DDD6EB] p-5 space-y-2.5"
              >
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#5B467A]">
                  <Heart className="w-4 h-4 shrink-0" />
                  <span>{block.title}</span>
                </div>
                <div className="font-serif-editorial italic text-[0.98rem] leading-relaxed text-[#2E253B] space-y-2">
                  {block.lines.map((l, j) => (
                    <p key={j}>{renderInlineFormatting(l, highlightQuery)}</p>
                  ))}
                </div>
              </aside>
            );

          case 'contexto':
            return (
              <aside
                key={idx}
                className="rounded-2xl bg-[#F8F3EA] border border-[#E4D6BF] p-5 space-y-2.5"
              >
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#7C4F1D]">
                  <Compass className="w-4 h-4 shrink-0" />
                  <span>{block.title}</span>
                </div>
                <div className="font-serif-editorial text-[0.98rem] leading-relaxed text-[#34261B] space-y-2">
                  {block.lines.map((l, j) => (
                    <p key={j}>{renderInlineFormatting(l, highlightQuery)}</p>
                  ))}
                </div>
              </aside>
            );

          case 'ejemplo':
            return (
              <aside
                key={idx}
                className="rounded-2xl bg-[#FCF9F3] border-l-4 border-[#A46B29] border-y border-r border-y-[#EAE0D0] border-r-[#EAE0D0] p-5 space-y-2.5"
              >
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#A46B29]">
                  <Lightbulb className="w-4 h-4 shrink-0" />
                  <span>{block.title}</span>
                </div>
                <div className="font-serif-editorial text-[0.98rem] leading-relaxed text-[#2D221A] space-y-2">
                  {block.lines.map((l, j) => (
                    <p key={j}>{renderInlineFormatting(l, highlightQuery)}</p>
                  ))}
                </div>
              </aside>
            );

          case 'practica':
            return (
              <aside
                key={idx}
                className="rounded-2xl bg-[#F3F7F2] border border-[#CFE0CC] p-5 space-y-2.5"
              >
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#2B5A3E]">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{block.title}</span>
                </div>
                <div className="text-[0.95rem] leading-relaxed text-[#243328] space-y-2">
                  {block.lines.map((l, j) => (
                    <p key={j}>{renderInlineFormatting(l, highlightQuery)}</p>
                  ))}
                </div>
              </aside>
            );

          case 'conclusion':
            return (
              <aside
                key={idx}
                className="rounded-2xl bg-[#241A13]/[0.04] border border-[#D4C3AA] p-5 space-y-2.5"
              >
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#241A13]">
                  <BookmarkCheck className="w-4 h-4 text-[#A46B29] shrink-0" />
                  <span>{block.title}</span>
                </div>
                <div className="font-serif-editorial text-[1rem] leading-relaxed text-[#241A13] space-y-2">
                  {block.lines.map((l, j) => (
                    <p key={j}>{renderInlineFormatting(l, highlightQuery)}</p>
                  ))}
                </div>
              </aside>
            );

          case 'cita':
            return (
              <blockquote
                key={idx}
                className="relative rounded-2xl bg-[#241A13] text-[#FAF7F1] px-6 py-5 space-y-2"
              >
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D4A366]">
                  <Quote className="w-3.5 h-3.5" />
                  <span>Cita Bíblica</span>
                </div>
                <div className="font-serif-editorial italic text-base sm:text-lg leading-relaxed text-[#FAF7F1] space-y-1.5">
                  {block.lines.map((l, j) => (
                    <p key={j}>{renderInlineFormatting(l, highlightQuery)}</p>
                  ))}
                </div>
              </blockquote>
            );

          case 'lista':
            return (
              <ul key={idx} className="space-y-2 pl-1">
                {block.items.map((item, j) => (
                  <li
                    key={j}
                    className="flex items-start gap-2.5 font-serif-editorial text-base leading-relaxed text-[#2D221A]"
                  >
                    <BookOpen className="w-4 h-4 text-[#A46B29] mt-1.5 shrink-0" />
                    <span>{renderInlineFormatting(item, highlightQuery)}</span>
                  </li>
                ))}
              </ul>
            );

          case 'parrafo':
          default:
            return (
              <p
                key={idx}
                className="font-serif-editorial text-[1.03rem] leading-[1.85] text-[#2D221A]"
              >
                {renderInlineFormatting(block.text, highlightQuery)}
              </p>
            );
        }
      })}
    </div>
  );
}
