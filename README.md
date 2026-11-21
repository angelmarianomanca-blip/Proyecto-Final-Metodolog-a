# Iglesia de Cristo · Plataforma Web de Formación Teológica Autodidacta

Aplicación web full stack para formación teológica y estudio bíblico continuo, gratuito y asincrónico, desarrollada para la cátedra de Metodología de Sistemas (UTN - FRT · TUP).

**Equipo:** Manca Angel Mariano · Rojas Gael Mauricio · Valentin Patti.

---

## Stack Tecnológico

- **Framework:** Next.js 15 (App Router y Route Handlers REST bajo `/api`)
- **Lenguaje:** TypeScript estricto
- **Interfaz y estilos:** React 19, Tailwind CSS v4 y componentes estilo shadcn/ui
- **Gráficos:** Chart.js (`react-chartjs-2`)
- **Base de datos y ORM:** Drizzle ORM + SQLite local (`file:local.db`) en desarrollo / Turso (`@libsql/client`) en producción — **16 tablas normalizadas**
- **Validación:** Zod (`z.strictObject` en esquemas de edición)
- **Autenticación y RBAC:** Cookie `httpOnly` (`SameSite=Lax`) firmada con `jose` (HS256) + `bcryptjs`, validada en servidor contra la base de datos en cada request
- **Certificados PDF (CR-01):** `pdf-lib` vectorizado en servidor
- **Asistente Pedagógico IA (RAG):** Integración vía `fetch` (Gemini u OpenAI, `temperature = 0.2`) acotada estrictamente al corpus local (`lecciones` y `transcripciones`) con contingencia ante fallas (RNF-12)
- **Gestor de paquetes:** `pnpm`

---

## Arquitectura en Capas

```text
src/
├── db/             # Esquema de 16 tablas (schema.ts), conexión libSQL, migrate.ts y seed.ts
├── lib/            # Constantes, ApiError, format.ts, auth/session.ts, schemas Zod, apiHandler, actionHandler, pdf-lib
├── services/       # ÚNICA capa con reglas de negocio (auth, usuarios, congregaciones, cursos, inscripciones, predicas, foros, ia, soporte, institucional, tablero)
├── components/     # Primitivas, shadcn/ui, layouts (PublicShell, CampusShell), Bot Guía, gráficos y clientes interactivos
└── app/            # Páginas Server Components y Route Handlers finos (/api/**)
```

---

## Puesta en Marcha Local

```bash
pnpm install
cp .env.example .env
pnpm run db:migrate
pnpm run db:seed
pnpm run dev
```

Abrir en el navegador: `http://localhost:3000`

### Variables de Entorno (`.env.example`)

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | `file:local.db` en local o URL `libsql://...` de Turso en producción |
| `DATABASE_AUTH_TOKEN` | Token de Turso (vacío en local) |
| `SESSION_SECRET` | Secreto HS256 de al menos 32 caracteres |
| `AI_PROVIDER` | `gemini` (defecto) u `openai` |
| `AI_API_KEY` | Clave opcional del LLM (si está vacía, el servicio RAG opera con fallback controlado sobre el corpus local) |
| `AI_MODEL` | Modelo LLM (ej. `gemini-2.5-flash`) |

---

## Credenciales de Prueba (`db:seed`)

| Rol | Correo electrónico | Contraseña |
| --- | --- | --- |
| **Administrador** | `admin@iglesiadecristo.org` | `Admin1234!` |
| **Profesor / Pastor** | `profesor@iglesiadecristo.org` | `Profesor1234!` |
| **Profesora** | `laura.benitez@iglesiadecristo.org` | `Profesor1234!` |
| **Alumno (miembro)** | `alumno@iglesiadecristo.org` | `Alumno1234!` |
| **Alumno (externo)** | `tomas.villalba@gmail.com` | `Alumno1234!` |

---

## Scripts Disponibles

- `pnpm run dev` — servidor de desarrollo
- `pnpm run build` — compilación de producción Next.js
- `pnpm run typecheck` — verificación estricta `tsc --noEmit`
- `pnpm run db:generate` — genera migraciones Drizzle
- `pnpm run db:migrate` — aplica migraciones sobre SQLite / Turso
- `pnpm run db:seed` — carga datos de prueba completos usando los servicios de la app
