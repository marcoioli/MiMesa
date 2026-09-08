# MiMesa

Armador de distribución de mesas para eventos. El organizador crea un evento, elige una plantilla de mesas, pega la lista de invitados y los arrastra a las sillas. Al terminar comparte un link: cada invitado lo abre, busca su nombre y ve su mesa y con quién se sienta.

Proyecto académico de tres personas, sin backend, en cinco días. Todo el estado vive en el navegador y en el link.

- Diseño de pantallas: https://claude.ai/code/artifact/2bc9eff9-9f3b-4a34-97c0-d0a9c6bbb50e
- Stack: Vite + React 19 + TypeScript (estricto), Tailwind CSS v4, Zustand, @dnd-kit/core, React Router, lz-string, qrcode.react, html-to-image. Deploy estático en Vercel.

## Arranque

Requisitos: Node 22 o superior y npm.

```bash
git clone https://github.com/marcoioli/MiMesa.git
cd MiMesa
npm install
npm run dev
```

Comandos:

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en http://localhost:5173 |
| `npx tsc --noEmit -p tsconfig.app.json` | Chequeo de tipos. Tiene que pasar antes de cada commit. |
| `npm run build` | Build de producción. Tiene que pasar antes de cada PR. |
| `npm run preview` | Sirve el build para probarlo |

No hay tests automatizados por decisión del equipo. La verificación es manual: cada tarea dice qué mirar en el navegador.

## Mapa del repo

| Ruta | Qué es | Cuándo leerlo |
|---|---|---|
| `docs/requirements.md` | Especificación de requerimientos: los 35 requerimientos (RF-01 a RF-35), lo que queda afuera, modelo de datos, stack, reparto. | Primero. Es la fuente de verdad del producto. |
| `DESIGN.md` | Sistema de diseño: tokens de color, tipografía, radios, alturas, componentes y estados. | Antes de escribir cualquier componente visual. |
| `docs/design/*.dc.html` | Las seis pantallas diseñadas (editor, crear evento, menús, compartir, vista del invitado). Son HTML, se abren en el navegador o en el link de arriba. | Para copiar la estructura y el estilo de tu pantalla. |
| `PRODUCT.md` | Contexto de producto para agentes de IA: usuarios, propósito, principios. | Si usás un agente, ya lo lee solo. |
| `openspec/changes/mimesa-mvp/proposal.md` | Propuesta: intención, alcance, enfoque, flujo de trabajo del equipo. | Para entender el porqué de las decisiones. |
| `openspec/changes/mimesa-mvp/specs/*/spec.md` | Especificaciones por dominio (evento, mesas, invitados, ubicación, persistencia, compartir, vista del invitado, exportación) con escenarios Given/When/Then. | Antes de implementar cada requerimiento: te dice exactamente qué comportamiento se espera. |
| `openspec/changes/mimesa-mvp/design.md` | Diseño técnico: tipos, contrato del store (16 acciones), drag and drop, geometría de las sillas, codificación del link, exportación PNG, decisiones de arquitectura, dueño de cada archivo. | Antes de tocar código. Es el contrato entre los tres tracks. |
| `openspec/changes/mimesa-mvp/tasks.md` | Las tareas, divididas en Fase 0 (base, ya hecha) y tracks A, B y C. Cada tarea dice requerimientos, archivos, tamaño y cómo verificarla. | Es tu lista de trabajo. Marcás `[x]` cuando terminás una. |
| `openspec/changes/mimesa-mvp/apply-progress.md` | Registro de lo hecho y desvíos respecto del diseño. | Para saber qué cambió respecto de `design.md`. |
| `AGENTS.md` y `CLAUDE.md` | Protocolo para agentes de IA: qué leer, qué no tocar, cómo verificar. | Si usás Claude Code, Cursor, Codex u otro agente, lo carga solo. |
| `src/` | El código. Ver la sección de dueños más abajo. | |

## Cómo trabajamos

### Los tres tracks

La base común ya está en `main` (Fase 0). Cada persona toma un track. Los tracks no comparten archivos, así que se puede trabajar y mergear en cualquier orden sin conflictos.

| Track | Rama | Qué construye | Requerimientos | Carpetas propias |
|---|---|---|---|---|
| A | `feat/track-a-event-guests` | Formulario de evento, barra superior con contadores y autoubicar, panel de invitados con carga masiva y buscador | RF-01 a RF-05, RF-13 a RF-19, RF-26 | `src/features/event/**`, `src/features/guests/**` |
| B | `feat/track-b-canvas-dnd` | Plano, mesas, sillas, drag and drop, menús de mesa y de silla, mover mesas | RF-06 a RF-12, RF-20 a RF-25 | `src/features/tables/**` (menos `TableView.tsx`) |
| C | `feat/track-c-share-guestview-export` | Compartir con link y QR, vista del invitado, exportar PNG | RF-27 a RF-35 | `src/features/share/**`, `src/features/guest-view/**`, `src/features/export/**` |

### Archivos congelados

Todo lo que está en `src/app/**`, `src/store/**`, `src/lib/**`, `src/features/tables/TableView.tsx`, `src/index.css`, `src/main.tsx`, `index.html`, `vite.config.ts`, `tsconfig*.json`, `vercel.json` y `package.json` es la base compartida. No se toca desde una rama de track. Si necesitás cambiar algo ahí, avisá al grupo: se decide entre los tres y se hace en un commit aparte en `main`.

El store (`src/store/useEventStore.ts`) ya tiene las 16 acciones que necesitan los tres tracks. Cada track solo agrega componentes que las llaman.

### Flujo por tarea

1. Actualizá `main` y creá o actualizá tu rama: `git checkout -b feat/track-a-event-guests main` (o la tuya).
2. Abrí `openspec/changes/mimesa-mvp/tasks.md`, buscá tu track y tomá la primera tarea sin marcar. Están en orden: primero lo que se ve en la demo.
3. Leé el requerimiento en `docs/requirements.md`, el escenario en `specs/<dominio>/spec.md`, la sección correspondiente de `design.md` y la pantalla en `docs/design/`.
4. Implementá solo esa tarea, en tus carpetas. Textos de la interfaz en español, tal cual los fija `design.md` (tabla "Exact Spanish strings"). Código, nombres y comentarios en inglés.
5. Verificá: `npx tsc --noEmit -p tsconfig.app.json`, y el chequeo manual que dice la tarea en "Done when".
6. Marcá la tarea `[x]` en `tasks.md` (solo las de tu track).
7. Commit con formato convencional: `feat(track-a): bulk guest input (RF-14)`. Sin firmas de IA en los commits.
8. Push y, cuando el track tenga algo mostrable, PR a `main` con la plantilla que aparece sola.

Mergeá `main` en tu rama seguido para no alejarte de la base.

### Reglas de código

- TypeScript estricto. No usar `any`.
- Estilos con clases de Tailwind y los tokens de `DESIGN.md` (`bg-ground`, `text-ink-3`, `border-line-2`, `bg-accent`...). No inventar colores.
- Nunca `window.confirm`: usar `ConfirmDialog` de `src/app`.
- Avisos con `toast()` de `src/app/useToastStore.ts`.
- Íconos como SVG inline, sin emojis.
- No agregar dependencias sin acordarlo con el grupo.

### Trampas conocidas

- **Drag and drop**: un solo `DndContext` (ya está en `AppLayout`). El sensor lleva `activationConstraint: { distance: 5 }` para que click y doble click convivan con el arrastre. Las mesas se arrastran desde su etiqueta central, no desde toda la mesa.
- **Link del invitado**: el payload comprimido con lz-string se escribe y se lee crudo en el fragmento (`/invitado#...`). Nunca pasarlo por `encodeURIComponent` ni `URLSearchParams`: rompe el link en silencio.
- **QR**: si el link supera 1.200 caracteres, mostrar solo el botón de copiar. `qrcode.react` lanza una excepción al renderizar si se pasa del límite.
- **Vista del invitado**: nunca importar el store en `/invitado`. Esa ruta lee solo el fragmento de la URL.
- **Exportar PNG**: capturar el nodo `#mimesa-canvas` (el interior fijo de 1600x1200), con `skipFonts: true` y `await document.fonts.ready` antes de llamar a `toPng`.

## Usar agentes de IA

El repo está preparado para que un agente lo lea y siga el protocolo solo: `AGENTS.md` (y `CLAUDE.md`, que lo importa) le dice qué documentos leer en qué orden, qué archivos no tocar, cómo verificar y cómo commitear. Un pedido típico:

> Estoy en el track B. Leé AGENTS.md, tomá la siguiente tarea sin marcar de mi track en tasks.md e implementala.

Si tenés `gentle-ai` instalado, los artefactos de `openspec/` son el cambio `mimesa-mvp` y podés ver el estado con `gentle-ai sdd-status mimesa-mvp --cwd .`. No es obligatorio.

## Deploy

Vercel conectado a este repo: `main` se publica automáticamente y cada rama tiene su preview. `vercel.json` ya tiene el rewrite para que `/invitado` funcione al recargar.
