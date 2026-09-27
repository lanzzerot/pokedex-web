<p align="center">
  <img src="public/brand/pokeball.svg" alt="Logo de Pokédex" width="88" height="88">
</p>

<h1 align="center">Pokédex</h1>

<p align="center">
  Catálogo interactivo en español con 1026 Pokémon de nueve generaciones.
</p>

## Funcionalidades

- **Catálogo:** explora Pokémon en tarjetas, con paginación y opciones para ordenar por número, nombre, altura, peso, experiencia base o suma de estadísticas.
- **Filtros combinables:** busca por nombre, tipo, generación, región, habilidad, grupo de huevo, hábitat, rareza y estadísticas. Los valores del mismo filtro se combinan con OR y los filtros distintos con AND.
- **Búsqueda rápida:** abre la paleta desde cualquier página con `Ctrl+K` o `Cmd+K`. Busca por nombre, tipo y región; acepta navegación por teclado y carga el índice una sola vez para filtrar en el navegador.
- **Ficha de Pokémon:** consulta descripción, tipos, datos de captura y crianza, habilidades, estadísticas base, sprites, ilustraciones normales y shiny, y cadena evolutiva.
- **Equipo personal:** guarda favoritos desde las fichas y consúltalos en «Mi equipo». Se almacenan en `localStorage` del navegador; no requiere cuenta.
- **Páginas de referencia:** consulta tipos, generaciones, regiones, habilidades, hábitats y grupos de huevo, y accede desde ellas al catálogo ya filtrado.
- **Diseño adaptable:** navegación para escritorio y móvil, metadatos para compartir y controles accesibles por teclado.

## Secciones

| Ruta | Contenido |
| --- | --- |
| `/` | Catálogo, filtros, orden y paginación |
| `/pokemon/[name]` | Ficha detallada de un Pokémon |
| `/tipos` | Tipos y recuentos |
| `/generaciones` | Nueve generaciones y sus regiones |
| `/regiones` | Regiones y recuentos |
| `/habilidades` | Búsqueda de habilidades por nombre o efecto |
| `/habitats` | Hábitats y recuentos |
| `/grupos-huevo` | Grupos de huevo |
| `/equipo` | Favoritos guardados en este navegador |

## Tecnologías

- [Next.js](https://nextjs.org/) 16 con App Router y Route Handlers
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) 4
- API de Pokémon del proyecto, generada a partir de [PokeAPI](https://pokeapi.co/)

## Requisitos

- Node.js 20.9 o posterior
- npm

## Puesta en marcha

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

La API ya tiene una URL predeterminada. Para apuntar a otra instancia, crea un archivo `.env.local` en la raíz:

```env
NEXT_PUBLIC_POKEMON_API_URL=https://tu-api.example.com
```

La aplicación añade el prefijo `/api/v1` a esa URL. No incluyas `/api/v1` en el valor de la variable.

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Genera la versión de producción |
| `npm run start` | Sirve la compilación de producción |
| `npm run lint` | Ejecuta ESLint |
| `npm run typecheck` | Comprueba los tipos con TypeScript |
| `npm run check:requests` | Ejecuta comprobaciones de navegación y filtros |

## Estructura del proyecto

```text
public/brand/       Logo de la Poké Ball
src/app/            Páginas y endpoints internos de Next.js
src/components/     Navegación, catálogo, filtros y componentes de interfaz
src/lib/api/        Cliente HTTP y tipos de la API
src/lib/            Datos de presentación, filtros, metadatos e índice de búsqueda
scripts/            Comprobaciones del proyecto
```

Los endpoints internos `/api/indice` y `/api/team` agrupan las solicitudes de búsqueda y equipo, respectivamente, para aprovechar la caché del servidor.

## Datos y marca

Los datos se sirven desde la API de Pokémon configurada para el proyecto y se generan a partir de PokeAPI. Los sprites se obtienen del repositorio [PokeAPI/sprites](https://github.com/PokeAPI/sprites).

Pokémon® es una marca registrada de Nintendo, The Pokémon Company y Game Freak. Este proyecto no oficial no está afiliado ni respaldado por dichas compañías.