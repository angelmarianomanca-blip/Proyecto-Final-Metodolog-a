'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { loginSchema } from '@/lib/schemas';
import { SESSION_LAST_ACTIVITY_KEY } from '@/lib/constants';
import { BrandEmblem } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/primitives';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      correoElectronico: email,
      contrasenia: password,
    };

    const parsed = loginSchema.safeParse(payload);
    if (!parsed.success) {
      const nextErr: Record<string, string> = {};
      for (const i of parsed.error.issues) {
        nextErr[String(i.path[0] ?? 'general')] = i.message;
      }
      setErrors(nextErr);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error?.message ?? 'Credenciales inválidas.');
        return;
      }
      try {
        window.localStorage.setItem(
          SESSION_LAST_ACTIVITY_KEY,
          String(Date.now())
        );
      } catch {
        // Ignorar
      }
      toast.success(`¡Bienvenido/a, ${data.user.nombre}!`);
      const dest =
        data.user.rol === 'admin'
          ? '/panel'
          : data.user.rol === 'profesor'
            ? '/gestion/cursos'
            : '/mi-aprendizaje';
      router.push(dest);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#241A13] flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-md w-full mx-auto flex items-center text-white">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#E9D5B5] hover:text-white"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Volver al inicio</span>
        </Link>
      </div>

      <div className="max-w-md w-full mx-auto my-6 bg-white border border-[#E3DACB] rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl">
        <div className="text-center space-y-1.5">
          <div className="flex justify-center mb-3">
            <BrandEmblem size="lg" tone="dark" />
          </div>
          <h1 className="text-2xl font-bold text-[#241A13]">
            Ingresá a tu Campus
          </h1>
          <p className="text-xs text-[#66584B]">
            Iglesia de Cristo · Formación Teológica Autodidacta
          </p>
        </div>

        <form onSubmit={submitLogin} className="space-y-4">
          <FormField
            label="Correo electrónico"
            error={errors.correoElectronico}
          >
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
            />
          </FormField>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-[#241A13]">
                Contraseña
              </label>
              <Link
                href="/recuperar-password"
                className="text-xs text-[#A46B29] font-medium hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            {errors.contrasenia && (
              <p className="text-xs text-red-700 font-medium">
                {errors.contrasenia}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 uppercase tracking-wider"
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </Button>
        </form>

        <p className="text-xs text-center text-[#66584B]">
          ¿Todavía no tenés cuenta?{' '}
          <Link
            href="/registro"
            className="text-[#A46B29] font-semibold hover:underline"
          >
            Registrate gratis
          </Link>
        </p>
      </div>

      <div className="text-center text-xs text-[#B3A593]">
        Iglesia de Cristo · Plataforma Web de Formación Teológica Autodidacta
      </div>
    </div>
  );
}
