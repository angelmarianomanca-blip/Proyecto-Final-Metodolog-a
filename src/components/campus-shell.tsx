'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  Building2,
  GraduationCap,
  Headphones,
  HelpCircle,
  Landmark,
  LogOut,
  Menu,
  MessageSquare,
  Shield,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import type { SessionUser } from '@/lib/auth/session';
import { LABELS_ROL, SESSION_LAST_ACTIVITY_KEY } from '@/lib/constants';
import { BrandLogo } from './brand-logo';
import { BotGuiaWidget } from './bot-guia-widget';
import { SessionInactivityGuard } from './session-inactivity-guard';

export function CampusShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [botOpen, setBotOpen] = React.useState(false);

  const sections = [
    {
      title: 'Aprendizaje y Comunidad',
      show: true,
      links: [
        { href: '/mi-aprendizaje', label: 'Mis Cursos', icon: GraduationCap },
        { href: '/foros', label: 'Foros Temáticos', icon: MessageSquare },
        { href: '/asistente', label: 'Asistente IA (RAG)', icon: Sparkles },
        { href: '/perfil', label: 'Mi Perfil e Historial', icon: User },
      ],
    },
    {
      title: 'Gestión Académica',
      show: user.rol === 'profesor' || user.rol === 'admin',
      links: [
        { href: '/gestion/cursos', label: 'Cursos y Lecciones', icon: BookOpen },
        {
          href: '/gestion/predicas',
          label: 'Prédicas y Transcripción',
          icon: Headphones,
        },
        { href: '/gestion/foros', label: 'Moderación de Foros', icon: Shield },
        { href: '/panel', label: 'Tablero Estadístico', icon: BarChart3 },
      ],
    },
    {
      title: 'Administración',
      show: user.rol === 'admin',
      links: [
        { href: '/admin/usuarios', label: 'Usuarios y Roles', icon: Users },
        {
          href: '/admin/congregaciones',
          label: 'Congregaciones',
          icon: Building2,
        },
        {
          href: '/admin/institucional',
          label: 'Editor Doctrinas',
          icon: Landmark,
        },
        { href: '/admin/soporte', label: 'Base Bot Guía', icon: HelpCircle },
      ],
    },
  ];

  const handleLogout = async () => {
    try {
      window.localStorage.removeItem(SESSION_LAST_ACTIVITY_KEY);
    } catch {
      // Ignorar
    }
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.success('Sesión cerrada correctamente.');
    router.push('/login');
    router.refresh();
  };

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <BrandLogo href="/" compact />
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          className="lg:hidden p-1.5 rounded-full border border-white/25 text-white"
          aria-label="Cerrar menú"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 space-y-4 overflow-y-auto flex-1">
        {sections
          .filter((s) => s.show)
          .map((sec, idx) => (
            <div key={sec.title} className="space-y-1">
              {idx > 0 && <div className="my-3 border-t border-white/10" />}
              <div className="px-3 text-xs font-semibold uppercase tracking-wider text-[#B3A593]">
                {sec.title}
              </div>
              {sec.links.map((l) => {
                const Icon = l.icon;
                const active =
                  pathname === l.href ||
                  (l.href === '/mi-aprendizaje' &&
                    pathname.startsWith('/aula')) ||
                  (l.href === '/foros' && pathname.startsWith('/foros/')) ||
                  (l.href === '/gestion/cursos' &&
                    pathname.startsWith('/gestion/cursos/'));
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                      active
                        ? 'bg-[#A46B29] text-white'
                        : 'text-[#E3DACB] hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{l.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
      </div>

      <div className="p-3.5 border-t border-white/10 bg-[#1C140E] space-y-2">
        <div className="text-xs font-medium text-white truncate">
          {user.nombre} {user.apellido}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs bg-white/10 text-[#E9D5B5]">
            {LABELS_ROL[user.rol]}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs text-[#B3A593] hover:text-[#D4A366] flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-[#FAF7F1] text-[#241A13]">
      <aside className="hidden lg:flex w-64 shrink-0 bg-[#241A13] text-white flex-col sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <aside className="w-64 bg-[#241A13] text-white flex flex-col shadow-2xl z-50">
            {sidebarContent}
          </aside>
          <div
            onClick={() => setDrawerOpen(false)}
            className="flex-1 bg-black/50"
          />
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 bg-white border-b border-[#E3DACB] px-4 flex items-center justify-between gap-2 sticky top-0 z-20">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden p-1.5 rounded-full border border-[#D6CBB8] shrink-0"
              aria-label="Abrir menú lateral"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="text-xs text-[#66584B] truncate">
              Campus ·{' '}
              <strong className="text-[#241A13]">
                {user.nombre} {user.apellido}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/asistente"
              className="px-3 py-1.5 rounded-full bg-[#F8EFE2] text-[#7C4F1D] border border-[#E4CCA8] text-xs font-semibold flex items-center gap-1.5 hover:bg-[#F1E2CA]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Asistente IA</span>
              <span className="sm:hidden">IA</span>
            </Link>
            <button
              type="button"
              onClick={() => setBotOpen(true)}
              className="px-3 py-1.5 rounded-full border border-[#D6CBB8] text-xs font-medium text-[#241A13] flex items-center gap-1 hover:bg-[#FAF7F1] cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bot Guía</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>

      <BotGuiaWidget
        externalOpen={botOpen}
        onExternalClose={() => setBotOpen(false)}
      />
      <SessionInactivityGuard />
    </div>
  );
}
