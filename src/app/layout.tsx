import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'Iglesia de Cristo · Plataforma de Formación Teológica Autodidacta',
  description:
    'Formación bíblica y teológica gratuita, continua y asincrónica. Cursos estructurados, prédicas con transcripción 1:1, foros moderados y asistente pedagógico de IA.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#FAF7F1] text-[#241A13] antialiased">
        {children}
        <Toaster position="bottom-center" richColors />
      </body>
    </html>
  );
}
