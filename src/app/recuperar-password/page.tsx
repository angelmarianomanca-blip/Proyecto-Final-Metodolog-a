'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/primitives';

export default function RecuperarPasswordPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<1 | 2>(1);
  const [email, setEmail] = React.useState('');
  const [token, setToken] = React.useState('');
  const [tokenDev, setTokenDev] = React.useState<string | null>(null);
  const [nueva, setNueva] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSolicitar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/recuperar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correoElectronico: email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? 'Verificá el correo ingresado.');
        return;
      }
      toast.success(data.mensaje);
      if (data.tokenDev) {
        setTokenDev(data.tokenDev);
        setToken(data.tokenDev);
      }
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleRestablecer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/restablecer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, contraseniaNueva: nueva }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? 'Token inválido o expirado.');
        return;
      }
      toast.success('Contraseña restablecida. Ya podés iniciar sesión.');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#241A13] flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-md w-full mx-auto flex items-center justify-between text-white">
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#E9D5B5] hover:text-white"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Volver a ingresar</span>
        </Link>
        <span className="px-3 py-1 rounded-full bg-[#A46B29] text-white text-xs font-semibold">
          RF-21 · 30 min
        </span>
      </div>

      <div className="max-w-md w-full mx-auto my-6 bg-white border border-[#E3DACB] rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl">
        <div className="space-y-1">
          <span className="text-xs font-bold text-[#A46B29]">
            Token temporal de un solo uso (RN-12)
          </span>
          <h1 className="text-2xl font-bold text-[#241A13]">
            Recuperar contraseña
          </h1>
        </div>

        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex-1 py-1.5 rounded-full font-semibold cursor-pointer ${
              step === 1
                ? 'bg-[#241A13] text-white'
                : 'bg-[#FAF7F1] text-[#66584B]'
            }`}
          >
            1. Solicitar token
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`flex-1 py-1.5 rounded-full font-semibold cursor-pointer ${
              step === 2
                ? 'bg-[#241A13] text-white'
                : 'bg-[#FAF7F1] text-[#66584B]'
            }`}
          >
            2. Nueva contraseña
          </button>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSolicitar} className="space-y-4">
            <p className="text-sm text-[#66584B]">
              Ingresá tu correo electrónico registrado para generar un token
              temporal con vigencia de 30 minutos.
            </p>
            <FormField label="Correo electrónico">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
              />
            </FormField>
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 uppercase tracking-wider"
            >
              {loading ? 'Generando...' : 'Solicitar token de recuperación'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRestablecer} className="space-y-4">
            {tokenDev && (
              <div className="p-3 rounded-xl bg-[#F8EFE2] border border-[#E4CCA8] text-xs text-[#7C4F1D] space-y-1">
                <div className="font-semibold">
                  Modo desarrollo (sin SMTP configurado):
                </div>
                <div>
                  Token generado:{' '}
                  <code className="font-mono font-bold">{tokenDev}</code>
                </div>
              </div>
            )}
            <FormField label="Token temporal">
              <Input
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="font-mono"
                placeholder="rec_..."
              />
            </FormField>
            <FormField label="Nueva contraseña (mín. 8 caracteres)">
              <Input
                type="password"
                required
                minLength={8}
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
                placeholder="••••••••"
              />
            </FormField>
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 uppercase tracking-wider"
            >
              {loading ? 'Guardando...' : 'Restablecer contraseña'}
            </Button>
          </form>
        )}
      </div>

      <div className="text-center text-xs text-[#B3A593]">
        Iglesia de Cristo · Plataforma Web de Formación Teológica Autodidacta
      </div>
    </div>
  );
}
