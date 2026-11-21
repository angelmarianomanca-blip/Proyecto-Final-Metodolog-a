import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { listarCongregaciones } from '@/services/congregaciones';
import { RegistroForm } from '@/components/registro-form';

export default async function RegistroPage() {
  const { data: congregaciones } = await listarCongregaciones(null);

  return (
    <div className="min-h-screen bg-[#241A13] flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-md w-full mx-auto flex items-center justify-between text-white">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#E9D5B5] hover:text-white"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Volver al inicio</span>
        </Link>
        <span className="px-3 py-1 rounded-full bg-[#A46B29] text-white text-xs font-semibold">
          Registro Gratuito
        </span>
      </div>

      <div className="max-w-md w-full mx-auto my-6 bg-white border border-[#E3DACB] rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[#241A13]">
            Crear cuenta de Alumno
          </h1>
          <p className="text-xs text-[#66584B]">
            Alta pública para miembros de congregaciones o estudiantes externos.
          </p>
        </div>
        <RegistroForm congregaciones={congregaciones} />
      </div>

      <div className="text-center text-xs text-[#B3A593]">
        Iglesia de Cristo · Plataforma Web de Formación Teológica Autodidacta
      </div>
    </div>
  );
}
