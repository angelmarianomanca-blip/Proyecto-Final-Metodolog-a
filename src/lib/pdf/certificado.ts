import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { formatFecha } from '@/lib/format';

export interface CertificadoData {
  nombreCompleto: string;
  tituloCurso: string;
  fechaFinalizacion: string;
  codigoCertificado: string;
  profesor: string;
}

/**
 * RF-22 (CR-01): Genera un certificado PDF vectorizado con pdf-lib
 * sin dependencias nativas pesadas.
 */
export async function generarCertificadoPdf(
  data: CertificadoData
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]); // A4 horizontal
  const { width, height } = page.getSize();

  const fontSerifBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontSerif = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontSerifItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const fontSansBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await pdfDoc.embedFont(StandardFonts.CourierBold);

  // Fondo pergamino cálido (#FAF7F1)
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(0.98, 0.968, 0.945),
  });

  // Marco doble Ámbar Dorado (#A46B29) y Nogal (#241A13)
  page.drawRectangle({
    x: 28,
    y: 28,
    width: width - 56,
    height: height - 56,
    borderColor: rgb(0.643, 0.42, 0.161),
    borderWidth: 3,
  });

  page.drawRectangle({
    x: 38,
    y: 38,
    width: width - 76,
    height: height - 76,
    borderColor: rgb(0.141, 0.102, 0.075),
    borderWidth: 1,
  });

  const drawCentered = (
    text: string,
    y: number,
    size: number,
    font: typeof fontSerif,
    color = rgb(0.141, 0.102, 0.075)
  ) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y,
      size,
      font,
      color,
    });
  };

  drawCentered(
    'IGLESIA DE CRISTO · FORMACION TEOLOGICA AUTODIDACTA',
    height - 95,
    12,
    fontSansBold,
    rgb(0.643, 0.42, 0.161)
  );

  drawCentered(
    'CERTIFICADO DE FINALIZACION',
    height - 150,
    34,
    fontSerifBold,
    rgb(0.141, 0.102, 0.075)
  );

  drawCentered(
    'Se certifica por el presente documento que',
    height - 205,
    15,
    fontSerifItalic,
    rgb(0.4, 0.345, 0.294)
  );

  const safeName = sanitizeLatin1(data.nombreCompleto);
  drawCentered(safeName, height - 260, 32, fontSerifBold, rgb(0.141, 0.102, 0.075));

  page.drawLine({
    start: { x: 200, y: height - 275 },
    end: { x: width - 200, y: height - 275 },
    thickness: 1.2,
    color: rgb(0.643, 0.42, 0.161),
  });

  drawCentered(
    'completo satisfactoriamente el 100% de las lecciones activas del curso',
    height - 315,
    14,
    fontSerif,
    rgb(0.4, 0.345, 0.294)
  );

  const safeCourse = sanitizeLatin1(data.tituloCurso);
  drawCentered(safeCourse, height - 355, 22, fontSerifBold, rgb(0.533, 0.337, 0.114));

  const safeProf = sanitizeLatin1(`Docente a cargo: ${data.profesor}`);
  drawCentered(safeProf, height - 390, 12, fontSerifItalic, rgb(0.4, 0.345, 0.294));

  // Pie con fecha y código único
  const fechaFmt = formatFecha(data.fechaFinalizacion);
  page.drawLine({
    start: { x: 80, y: 120 },
    end: { x: width - 80, y: 120 },
    thickness: 0.8,
    color: rgb(0.84, 0.8, 0.72),
  });

  page.drawText(`Fecha de finalizacion: ${fechaFmt}`, {
    x: 90,
    y: 92,
    size: 11,
    font: fontSerif,
    color: rgb(0.3, 0.25, 0.2),
  });

  const codeText = `Codigo unico: ${data.codigoCertificado}`;
  const codeWidth = fontMono.widthOfTextAtSize(codeText, 12);
  page.drawText(codeText, {
    x: width - 90 - codeWidth,
    y: 92,
    size: 12,
    font: fontMono,
    color: rgb(0.141, 0.102, 0.075),
  });

  return pdfDoc.save();
}

function sanitizeLatin1(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, ' ');
}
