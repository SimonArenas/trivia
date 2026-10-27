# Banderas del mundo

Flash cards para aprender las banderas y capitales de 249 países y territorios de [flagcdn.com](https://flagcdn.com): los códigos ISO 3166-1, Kosovo y las cuatro naciones del Reino Unido. Se excluyen los territorios cuya bandera es idéntica a la de su país (Bouvet, Svalbard, Heard y McDonald, San Martín francés e Islas Ultramarinas de EE. UU.).

De frente solo se ve la bandera; al tocarla se voltea y muestra el país, su capital y dos etiquetas: el continente y el estatus (país soberano, reconocimiento limitado, territorio o nación del Reino Unido). Después marcas **Lo sabía** o **No lo sabía**, y la repetición espaciada (sistema Leitner) decide cuándo vuelve cada tarjeta: las que fallas regresan en un minuto, y las que sabes cada vez tardan más (10 min, 1 día, 3 días, 7 días, 21 días). Una tarjeta cuenta como dominada desde la caja 4.

El progreso se guarda en el navegador (localStorage), sin cuentas ni servidor.

## Uso

```bash
bun install
bun run dev      # servidor de desarrollo
bun run check    # tipos + tests
bun run build    # sitio estático en dist/
```

Teclado: `Espacio` voltea, `1` no lo sabía, `2` lo sabía.

## Estructura

- `src/countries.ts`: nombres, capitales (en español), continente y estatus de cada bandera.
- `src/srs.ts`: repetición espaciada (cajas, intervalos, qué tarjeta sigue).
- `src/App.tsx`: la interfaz.

## Desplegar en Vercel

Importa el repo en Vercel: detecta Vite solo (build `bun run build`, salida `dist`).
