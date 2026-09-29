# propuesta de diseño: caudal

caudal = flujo y también capital. la app responde 4 preguntas en cada pantalla: qué pasó, por qué pasó, qué puede pasar y qué conviene hacer ahora.

base: [referencias-diseño-finanzas-personales.md](./referencias-diseño-finanzas-personales.md). nada de esto sale de memoria. cada decisión cita la referencia que la origina.

---

## 1. principios

1. **una respuesta por pantalla, no una pared de números.** inicio arranca con un párrafo que resume el mes, después el capital, después 4 kpis y recién ahí los módulos (fey, midday).
2. **real vs estimado siempre distinguible.** sólido = dato cargado. punteado + etiqueta "estimado" = proyección. nunca mezclados sin leyenda.
3. **la ia calcula con código y explica con palabras.** los montos de impacto los calcula el motor de análisis. la ia (si está activa) solo redacta y prioriza. así no inventa números.
4. **editar sin perder contexto.** detalle de movimiento, categoría y presupuesto en panel lateral (copilot, midday).
5. **cada estado vacío enseña y tiene salida.** ícono, qué va a aparecer ahí, una acción (quicken, midday).
6. **permisos a la vista.** scopes literales de google, qué se guarda, qué se manda a la ia, cómo borrarlo (midday settings).

## 2. sistema visual

### color
| token | light | dark | uso |
|---|---|---|---|
| `--bg` | `#f6f5f2` | `#0f0f0e` | plano de página (gris cálido, monarch/origin) |
| `--surface` | `#ffffff` | `#181817` | cards, paneles |
| `--surface-2` | `#f1f0ec` | `#20201e` | hover, filas alternas, inputs |
| `--border` | `#e6e4de` | `#2c2c2a` | bordes 1px |
| `--text` | `#0b0b0b` | `#f5f5f3` | texto primario |
| `--text-2` | `#52514e` | `#c3c2b7` | secundario |
| `--muted` | `#898781` | `#898781` | ejes, labels |
| `--accent` | `#2a78d6` | `#3987e5` | único acento: foco, activo, serie protagonista |
| `--positive` | `#006300` | `#0ca30c` | ingresos, deltas buenos (texto) |
| `--warning` | `#fab219` | `#fab219` | cerca del límite (siempre con ícono + texto) |
| `--critical` | `#d03b3b` | `#e66767` | excedido, anomalía (siempre con ícono + texto) |

- botón primario: tinta (`--text` de fondo). el acento azul no compite con la acción principal.
- gastos en tinta neutra, no en rojo. gastar no es un error. rojo solo para "excedido" o "anomalía".
- categorías de gráficos: paleta categórica de 8 slots en orden fijo, validada con el script de dataviz sobre `#ffffff` y `#181817` (cvd y visión normal pasan en ambos modos). 3 slots en light quedan bajo 3:1 de contraste, por eso todo gráfico por categoría va acompañado de lista con montos visibles.
- cada categoría tiene su slot fijo. el color sigue a la categoría, no al ranking. las que no tienen slot van a "otros" en gris.

### tipografía
- geist sans para todo. geist mono solo para labels de sección en mayúscula con tracking (origin) y atajos de teclado.
- cifra protagonista: 40-48px, semibold, dígitos proporcionales.
- tablas y columnas de montos: `tabular-nums`.
- escala: 12 / 13 / 14 (base) / 16 / 20 / 24 / 32 / 44.

### espaciado y forma
- grilla de 4px. padding de card 20px (16px en mobile). gap entre cards 16px.
- radio: 10px cards, 8px inputs y botones, pill para chips y selectores de período.
- sombras casi nulas. separa el borde de 1px, no la sombra.
- sin gradientes, sin glass. movimiento: 150-200ms ease-out en hover, paneles y toasts. respeta `prefers-reduced-motion`.

### gráficos
- barras ≤ 24px de ancho, extremo redondeado 4px, 2px de separación.
- líneas 2px. área con relleno al 10%.
- grilla en hairline sólida. nunca doble eje.
- tooltip con crosshair en líneas y por barra en columnas.
- leyenda siempre con ≥ 2 series. etiqueta directa solo en el punto que importa.
- toda serie estimada: línea punteada + leyenda "estimado".

## 3. navegación

sidebar fija (desktop) agrupada:

- **general**: inicio · movimientos · presupuestos · objetivos
- **análisis**: estadísticas · fugas de dinero · proyección · ia financiera
- **agenda**: calendario · alertas
- **cuenta**: integraciones · privacidad · configuración

header: buscador y comandos (⌘k), modo privacidad (ocultar montos, origin), tema, campana de alertas, menú de usuario.

mobile: bottom nav con inicio · movimientos · [+] · ia · más. "más" abre sheet con el resto.

botón "nuevo" global (atajo `n`): movimiento, importar csv, conectar integración (midday).

## 4. pantallas

| pantalla | qué pasó | por qué | qué puede pasar | qué hacer |
|---|---|---|---|---|
| inicio | capital, ingresos, gastos, ahorro, % ahorro vs período anterior | categorías que más movieron | próximos gastos, saldo estimado a fin de mes | resumen ia + top 3 alertas |
| movimientos | tabla filtrable, búsqueda, orden | categoría y etiquetas | recurrentes marcados | quick add, edición en panel |
| presupuestos | asignado, gastado, restante, % | categorías que empujan | ritmo proyectado ("al ritmo actual lo pasás el día 22") | ajustar o mover plata |
| objetivos | acumulado, % | aportes vs plan | fecha estimada de llegada | aporte mensual recomendado |
| estadísticas | capital, ingresos vs gastos, ahorro, categorías, microgastos, recurrentes | comparación entre períodos | | |
| fugas de dinero | microgastos, suscripciones, anomalías | patrones y frecuencia | costo anual estimado | cuánto ahorrás reduciéndolos |
| proyección | datos reales del mes | ingresos y gastos previstos | saldo a fin de mes, capital a 6 meses | simulador 1/3/5/10 años |
| ia financiera | resumen | problema + explicación | impacto estimado | acción + prioridad |
| calendario | eventos y correos detectados | cruce gmail + calendar | gastos potenciales próximas 2 semanas | registrar lo que falta |
| alertas | centro priorizado, sin spam | | | posponer, descartar, ir al detalle |

## 5. arquitectura

stack: next.js (app router) + typescript + tailwind + radix + recharts. base de datos postgres vía drizzle. en local usa pglite (postgres en wasm, cero instalación). en producción basta con `DATABASE_URL`.

```
src/
  app/                 rutas (auth, app privada, api)
  modules/
    auth/              contraseñas (scrypt), sesiones, tokens de recuperación
    finance/           movimientos, categorías, presupuestos, objetivos (repositorios)
    analytics/         funciones puras: resumen, microgastos, recurrentes, anomalías, predicción, simulador, presupuestos, objetivos
    alerts/            motor de alertas: prioridad, deduplicación, estado (descartada/pospuesta)
    integrations/      oauth de google, gmail, calendar, cifrado de tokens, modo demo
    insights/          análisis combinado gmail + calendar + finanzas
    ai/                proveedores gratuitos (gemini, groq) + motor de reglas como fallback
    settings/          preferencias de usuario
  db/                  esquema, cliente, migraciones, seed
  components/          ui (primitivas), charts, layout, dominio
```

reglas:
- `analytics` no toca la base ni la red. recibe datos, devuelve datos. se testea solo.
- `integrations` escribe en su propia tabla (`integration_items`). desconectar borra tokens e ítems de esa integración. los movimientos manuales nunca se tocan.
- `ai` recibe hallazgos ya calculados. nunca ve emails ni contenido de eventos: solo título corto, fecha, monto detectado y tipo.
- permisos: gmail `gmail.readonly`, calendar `calendar.readonly`. nada de escritura.

## 6. ia gratuita

orden de proveedores: gemini (free tier de google ai studio) → groq (free tier) → motor de reglas local. si no hay clave o el usuario apaga la ia externa en privacidad, funciona igual con reglas. la pantalla dice qué motor generó cada recomendación.

cada recomendación trae: problema, explicación, acción, impacto estimado (mensual y anual, calculado por código) y prioridad.
