# MiMesa

Armador de distribución de mesas para eventos. El organizador crea un evento, elige una plantilla de mesas, pega la lista de invitados y los arrastra a las sillas. Al terminar comparte un link: cada invitado lo abre, busca su nombre y ve su mesa y con quién se sienta.

Proyecto académico de tres personas, sin backend, en cinco días. Todo el estado vive en el navegador y en el link.

- Repo: https://github.com/marcoioli/MiMesa
- Diseño de pantallas (mockups): https://claude.ai/code/artifact/2bc9eff9-9f3b-4a34-97c0-d0a9c6bbb50e
- Stack: Vite + React 19 + TypeScript estricto, Tailwind CSS v4, Zustand, @dnd-kit/core, React Router, lz-string, qrcode.react, html-to-image. Deploy estático en Vercel.

---

## Si sos un agente de IA: leé esto primero

Este README es tu punto de entrada. Si el usuario te dice "leé el README y decime qué hacer", seguí este protocolo al pie de la letra.

### 1. Leé estos archivos, en este orden

| # | Archivo | Para qué |
|---|---|---|
| 1 | `AGENTS.md` | Reglas completas: qué podés editar, qué está congelado, cómo verificar, cómo commitear. Obligatorio. |
| 2 | `openspec/changes/mimesa-mvp/tasks.md` | La lista de tareas por track. Tu trabajo sale de acá. Buscá la sección de tu track (A o C) y la primera tarea sin marcar `[ ]`. |
| 3 | `docs/tracks/track-a.md` o `docs/tracks/track-c.md` | La guía del track: alcance, archivos, contratos, orden, checklist de pruebas, criterio de terminado. |
| 4 | `docs/requirements.md` | Los requerimientos RF-01 a RF-37. Cada tarea cita los suyos. |
| 5 | `openspec/changes/mimesa-mvp/specs/<dominio>/spec.md` | Escenarios Given/When/Then del requerimiento que vas a implementar. Son el criterio de aceptación. |
| 6 | `openspec/changes/mimesa-mvp/design.md` | Diseño técnico: tipos, acciones del store, drag and drop, geometría, link, exportación, dueño de cada archivo, **textos exactos en español**. |
| 7 | `openspec/changes/mimesa-mvp/apply-progress.md` | Qué se hizo ya y en qué se desvió del diseño. Donde `design.md` y esto se contradigan, gana esto y el código en `src/`. |
| 8 | `DESIGN.md` | Tokens, tipografía, tamaños, componentes y estados. Todo lo visual sale de acá. |
| 9 | `docs/design/<Pantalla>.dc.html` | El mockup de la pantalla que vas a construir (la guía del track dice cuál). Copiá su estructura y estilo. |

`PRODUCT.md` tiene el contexto de producto (usuarios, propósito, principios). Leelo si tenés que tomar una decisión de comportamiento que ningún documento cierra.

### 2. Determiná el track

Preguntale al usuario en qué track está si no te lo dijo. También se infiere del nombre de la rama: `feat/track-a-event-guests` es A, `feat/track-c-share-guestview-export` es C. El track B ya está hecho y mergeado en `main`; no se trabaja más ahí.

### 3. Decile al usuario qué hacer

Tomá la primera tarea sin marcar del track. Explicásela en dos o tres frases: qué requerimientos cubre, qué archivos vas a crear o editar, qué contratos del store o de la base vas a usar, y cuál es el chequeo "Done when". **Esperá su OK antes de escribir código.**

### 4. Implementá una sola tarea

Solo dentro de las carpetas del track. Textos de interfaz en español tal cual los fija `design.md`. Código, nombres y comentarios en inglés. Clases de Tailwind con los tokens de `DESIGN.md`. Nada de dependencias nuevas, nada de archivos congelados, nada de carpetas de otro track. Si la tarea te obliga a romper una de esas reglas, pará y explicáselo al usuario para que hable con Marco.

### 5. Verificá y decile al usuario qué probar

Corré `npx tsc --noEmit -p tsconfig.app.json`. Después decile al usuario, en pasos concretos, qué probar en `npm run dev` según el "Done when" de la tarea. No digas que algo funciona si no lo verificaste: los chequeos de navegador los hace el usuario.

### 6. Cerrá la tarea

Cuando el usuario confirme que el chequeo pasó: marcá la tarea `[x]` en `tasks.md`, hacé el commit con formato convencional y alcance del track (por ejemplo `feat(track-a): bulk guest input (RF-14)`), sin firmas de IA, y seguí con la próxima tarea. Cuando el track esté completo, guiá al usuario por la sección "Terminar el track y abrir el PR" de abajo.

---

## Estado actual

| Parte | Estado | Quién |
|---|---|---|
| Fase 0, base congelada (scaffold, tokens, store, geometría, layout, `TableView`) | **Hecha y en `main`** | Marco |
| Track B, plano, mesas, drag and drop, zoom, tamaño de mesa | **Hecho y mergeado en `main`** | Marco |
| Track A, evento e invitados | **Pendiente, listo para arrancar** | Compañero 1 |
| Track C, compartir, vista del invitado, exportar PNG | **Pendiente, listo para arrancar** | Compañero 2 |
| Fase 4, integración y pruebas en el deploy | Después de mergear A y C | Los tres |

---

## Empezá acá (compañeros)

1. Pedile a Marco que te agregue como colaborador del repo (Settings, Collaborators). Sin eso no vas a poder subir tu rama.
2. Cloná e instalá:

   ```bash
   git clone https://github.com/marcoioli/MiMesa.git
   cd MiMesa
   npm install
   npm run dev
   ```

   Abrí http://localhost:5173. Vas a ver un formulario placeholder con un botón que crea un evento demo. Tocalo: aparece la barra superior, el panel lateral y el plano con seis mesas. Eso es la base sobre la que trabajás. Click en una silla vacía te deja sentar a alguien, y arrastrar entre sillas ya funciona.

3. Creá tu rama desde `main`, con este nombre exacto:

   ```bash
   git checkout -b feat/track-a-event-guests main            # track A
   git checkout -b feat/track-c-share-guestview-export main  # track C
   ```

4. Leé tu guía en `docs/tracks/` y la lista de lectura de la sección de arriba (te sirve a vos igual que al agente).
5. Trabajá tarea por tarea siguiendo `openspec/changes/mimesa-mvp/tasks.md`, sección de tu track. Están en orden: primero lo que se ve en la demo.
6. Cuando el track esté completo y probado en local, abrí el PR a `main` y avisale a Marco. Detalle más abajo.

Si usás un agente de IA (Claude Code, Cursor, Codex u otro), decile:

> Leé el README y decime qué hacer. Estoy en el track A.

---

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en http://localhost:5173 |
| `npx tsc --noEmit -p tsconfig.app.json` | Chequeo de tipos. Tiene que pasar antes de cada commit. |
| `npm run build` | Build de producción. Tiene que pasar antes de abrir el PR. |
| `npm run lint` | Lint. Sin errores antes del PR. |
| `npm run preview` | Sirve el build para probarlo |

No hay tests automatizados por decisión del equipo. La verificación es manual: cada tarea dice qué mirar en el navegador y cada guía de track tiene una checklist final.

---

## Mapa del repo

| Ruta | Qué es |
|---|---|
| `README.md` | Este archivo: protocolo, estado, cómo empezar, flujo de trabajo. |
| `AGENTS.md`, `CLAUDE.md` | Reglas para agentes de IA. `CLAUDE.md` importa `AGENTS.md`. |
| `docs/tracks/track-a.md`, `docs/tracks/track-c.md` | Guía de cada track pendiente. |
| `docs/requirements.md` | Especificación de requerimientos RF-01 a RF-37. |
| `docs/design/*.dc.html` | Las seis pantallas diseñadas. |
| `DESIGN.md` | Sistema de diseño. |
| `PRODUCT.md` | Contexto de producto. |
| `openspec/changes/mimesa-mvp/tasks.md` | Tareas por track. Se marcan `[x]` al terminar. |
| `openspec/changes/mimesa-mvp/specs/*/spec.md` | Escenarios de aceptación por dominio. |
| `openspec/changes/mimesa-mvp/design.md` | Diseño técnico y contratos. |
| `openspec/changes/mimesa-mvp/apply-progress.md` | Avance real y desvíos. |
| `openspec/changes/mimesa-mvp/proposal.md` | Propuesta original. |
| `src/` | El código. `src/features/<track>/` es de cada track; el resto está congelado. |

---

## Cómo trabajamos

### Tracks y dueños de archivos

Cada track es dueño de sus carpetas y de nada más. Como no comparten archivos, se puede trabajar y mergear en cualquier orden sin conflictos.

| Track | Rama | Carpetas propias | Requerimientos |
|---|---|---|---|
| A | `feat/track-a-event-guests` | `src/features/event/**`, `src/features/guests/**` | RF-01 a RF-05, RF-13 a RF-19, RF-26 |
| B (hecho) | `feat/track-b-canvas-dnd` | `src/features/tables/**` menos `TableView.tsx` | RF-06 a RF-12, RF-20 a RF-25, RF-36, RF-37 |
| C | `feat/track-c-share-guestview-export` | `src/features/share/**`, `src/features/guest-view/**`, `src/features/export/**` | RF-27 a RF-35 |

### Archivos congelados

Todo lo que está en `src/app/**`, `src/store/**`, `src/lib/**`, `src/features/tables/**`, `src/index.css`, `src/main.tsx`, `index.html`, `vite.config.ts`, `tsconfig*.json`, `vercel.json` y `package.json` es la base compartida o el track B ya terminado. **No se toca desde una rama de track.** Tampoco se agregan dependencias.

Si una tarea te obliga a cambiar algo de ahí, no lo cambies: escribile a Marco explicando qué necesitás y por qué. Se decide entre los tres y se hace en un commit aparte en `main`, y después vos mergeás `main` en tu rama.

El store (`src/store/useEventStore.ts`) ya tiene las 17 acciones que necesitan todos los tracks. Tu track solo agrega componentes que las llaman.

### Ramas, commits y sincronización

1. **Una rama por track**, creada desde `main` con el nombre exacto de la tabla. Nunca trabajes en `main`.
2. **Una tarea por commit** cuando se pueda. Mensaje en inglés con formato convencional y el alcance del track:

   ```
   feat(track-a): bulk guest input (RF-14)
   fix(track-c): guard QR above 1200 chars (RF-29)
   ```

   Sin firmas de IA en los commits (nada de "Co-Authored-By" ni "Generated with").
3. **Antes de cada commit**: `npx tsc --noEmit -p tsconfig.app.json` tiene que pasar y tenés que haber hecho el chequeo "Done when" de la tarea en el navegador.
4. **Mantenete al día con `main`** al menos una vez por día, y siempre antes de abrir el PR:

   ```bash
   git fetch origin
   git merge origin/main
   ```

   Como los tracks no comparten archivos, no debería haber conflictos. Si hay uno, se tocó algo que no correspondía: avisá.
5. **Subí tu rama seguido**: `git push -u origin feat/track-a-event-guests`. Marco ve el avance y Vercel genera un preview por rama.

### Probar en local

- Todo se prueba con `npm run dev` en Chrome, Firefox o Edge. La vista del invitado también en el celular o con la emulación de dispositivo de DevTools (360x640).
- Para tener datos: creá el evento demo (botón del placeholder, o el formulario cuando A lo haga) y sentá gente desde el selector de silla vacía. Cuando A esté, pegá una lista de nombres.
- Cada tarea tiene su "Done when". Es literal: hacé exactamente eso y mirá que pase.
- Al terminar el track, pasá la checklist completa de tu guía de punta a punta y además probá que lo que ya existe siga funcionando: crear evento, arrastrar invitados a sillas, menús de mesa, zoom, recargar la página.
- Si algo del track B o de la base te parece que falla, no lo arregles en tu rama: reportalo a Marco con los pasos para reproducirlo.

### Terminar el track y abrir el PR

1. Todas las tareas del track marcadas `[x]` en `tasks.md`.
2. `npx tsc --noEmit -p tsconfig.app.json`, `npm run build` y `npm run lint` sin errores.
3. Checklist final de tu guía (`docs/tracks/track-x.md`, sección "Checklist final") pasada completa en local, con datos de verdad (20 o más invitados).
4. `git fetch origin && git merge origin/main`, y volver a probar lo básico después del merge.
5. Push de la rama y **abrir el PR a `main`** desde GitHub. La plantilla aparece sola: completá track, requerimientos hechos, tareas marcadas, chequeos manuales que realmente hiciste y desvíos respecto del diseño, si los hubo.
6. **Avisale a Marco por el grupo con el link del PR. No mergees vos.** Marco revisa, prueba en su máquina y mergea. Si pide cambios, los hacés en la misma rama y volvés a avisar.
7. Después del merge, borrá la rama local y la remota.

Si el track es grande, podés abrir un primer PR con las tareas M (las imprescindibles) y un segundo con las S. Mejor dos PR chicos que uno gigante.

### Reglas de código

- TypeScript estricto. Nada de `any` ni `@ts-ignore`.
- Estilos con clases de Tailwind y los tokens de `DESIGN.md` (`bg-ground`, `text-ink-3`, `border-line-2`, `bg-accent`...). No inventar colores.
- Los textos de la interfaz son los que fija `design.md` en la tabla "Exact Spanish strings". Copialos tal cual, con acentos y voseo.
- Nunca `window.confirm`: usar `ConfirmDialog` de `src/app`. Avisos con `toast()` de `src/app/useToastStore.ts`.
- Íconos como SVG inline, sin emojis. Objetivos táctiles de 44 px en la vista del invitado.
- Un componente por archivo, chico y con un solo propósito. Estado de interfaz (búsqueda, menús abiertos) en el componente, nunca en el store.

### Trampas conocidas

- **Drag and drop**: hay un solo `DndContext` (en `AppLayout`). Para hacer arrastrable una tarjeta del panel se usa `GuestDraggable` de `src/app/dnd/` con `from: null`. El sensor tiene `activationConstraint: { distance: 5 }` para que click y doble click convivan con el arrastre.
- **Link del invitado**: el payload comprimido con lz-string se escribe y se lee crudo en el fragmento (`/invitado#...`). Nunca pasarlo por `encodeURIComponent` ni `URLSearchParams`: rompe el link en silencio.
- **QR**: si el link supera 1.200 caracteres, mostrar solo el botón de copiar. `qrcode.react` lanza una excepción al renderizar si se pasa del límite; un `try/catch` no lo salva.
- **Vista del invitado**: nunca importar el store en `/invitado`. Esa ruta lee solo el fragmento de la URL.
- **Exportar PNG**: capturar el nodo `#mimesa-canvas` (el interior fijo de 1600x1200, no el contenedor con scroll). Ese nodo tiene `transform: scale(zoom)`; hay que anular la transformación durante la captura. Usar `skipFonts: true` y `await document.fonts.ready` antes de `toPng`.

---

## Herramientas opcionales

- Si tenés `codegraph` instalado, corré `codegraph init` una vez en tu clon: tu agente va a responder preguntas de estructura con el grafo en vez de leer archivos a mano.
- Si tenés `gentle-ai`, `openspec/` es el cambio `mimesa-mvp` y `gentle-ai sdd-status mimesa-mvp --cwd .` muestra el estado.

Ninguna es obligatoria.

---

## Para Marco (dueño del repo)

- Agregar a los dos compañeros como colaboradores del repo.
- Conectar Vercel al repo: `main` se publica automáticamente y cada rama tiene su preview.
- Revisar y mergear los PR de A y C. Cambios en archivos congelados: solo en `main`, en commit aparte, avisando al grupo.
- Cuando A y C estén mergeados, correr la Fase 4 de `tasks.md` sobre el deploy.
