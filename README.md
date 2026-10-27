# Banderas del mundo

**App en vivo: https://trivia-olive-two.vercel.app**

Flash cards para aprenderse las banderas y capitales del mundo. De frente ves solo la bandera; al tocarla, la tarjeta se voltea y muestra el país y su capital. Tú decides si lo sabías o no, y la app se encarga de repetirte más seguido las que te cuestan.

## Qué incluye

- **249 tarjetas**: todos los países y territorios ISO 3166-1 de [flagcdn.com](https://flagcdn.com), Kosovo y las cuatro naciones del Reino Unido (Inglaterra, Escocia, Gales e Irlanda del Norte). Se excluyen los territorios cuya bandera es idéntica a la de su país (Bouvet, Svalbard, Heard y McDonald, San Martín francés e Islas Ultramarinas de EE. UU.), porque no se pueden distinguir solo con la bandera.
- **Todo en español**: nombres de países y capitales.
- **Etiquetas**: en el frente, arriba a la derecha, el continente y si es país soberano, de reconocimiento limitado o no soberano. En el reverso, el detalle (por ejemplo, "Territorio de Francia" o "Nación del Reino Unido").
- **Zoom**: con el mouse sobre la bandera se amplía para ver los detalles (escudos, estrellas, etc.).
- **Repetición espaciada (sistema Leitner)**: marcas **Lo sabía** o **No lo sabía**. Los botones aparecen al voltear la tarjeta, pero con el teclado (`1`/`2`) puedes responder sin voltearla, para despachar rápido las que ya te sabes. Las que fallas vuelven a los 5 minutos; las que sabes tardan cada vez más (10 min, 1 día, 3 días, 7 días, 21 días). Una tarjeta cuenta como dominada desde la caja 4.
- **Filtros por continente y por tipo** (Todos · Soberanos · No soberanos), combinables, para estudiar por partes. Kosovo, Taiwán y Palestina cuentan como soberanos.
- **Progreso guardado en el navegador** (localStorage), sin cuentas ni servidor.
- Funciona en computador y celular, con modo claro y oscuro.

Teclado: `Espacio` voltea, `1` no lo sabía, `2` lo sabía.

## Desarrollo

Requiere [Bun](https://bun.sh).

```bash
bun install
bun run dev      # servidor de desarrollo
bun run check    # tipos + tests
bun run build    # sitio estático en dist/
```

Stack: Vite + React + TypeScript.

- `src/countries.ts`: nombres, capitales, continente y estatus de cada bandera.
- `src/srs.ts`: repetición espaciada (cajas, intervalos, qué tarjeta sigue).
- `src/App.tsx`: la interfaz.

## Despliegue

Desplegado en Vercel y conectado a este repo: cada push a `main` publica una nueva versión.
