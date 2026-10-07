# propuesta de diseño: caudal

caudal = flujo y también capital. la app responde 4 preguntas en cada pantalla: qué pasó, por qué pasó, qué puede pasar y qué conviene hacer ahora.

base: [referencias-diseño-finanzas-personales.md](./referencias-diseño-finanzas-personales.md) (v1) y [referencias-diseño-caudal-v3.md](./referencias-diseño-caudal-v3.md) (v3, sistema visual y navegación actuales). nada de esto sale de memoria. cada decisión cita la referencia que la origina.

---

## 1. principios

1. **una respuesta por pantalla, no una pared de números.** inicio arranca con un párrafo que resume el mes, después el capital, después 4 kpis y recién ahí los módulos (fey, midday).
2. **real vs estimado siempre distinguible.** sólido = dato cargado. punteado + etiqueta "estimado" = proyección. nunca mezclados sin leyenda.
3. **la ia calcula con código y explica con palabras.** los montos de impacto los calcula el motor de análisis. la ia (si está activa) solo redacta y prioriza. así no inventa números.
4. **editar sin perder contexto.** detalle de movimiento, categoría y presupuesto en panel lateral (copilot, midday).
5. **cada estado vacío enseña y tiene salida.** ícono, qué va a aparecer ahí, una acción (quicken, midday).
6. **permisos a la vista.** scopes literales de google, qué se guarda, qué se manda a la ia, cómo borrarlo (midday settings).

## 2. sistema visual (v3)

**v3 (2026-10): terminal financiera oscura.** reemplaza el sidebar claro de la v1 y la paleta gris de la v2. otro layout, otra navegación, otra tipografía, otra forma. paleta pedida: grises, blancos, negros y un acento rojo adiamantado.

### tema
- **oscuro por defecto** (fey, coinbase, cosmos). casi negro, cards apenas más claras, bordes casi invisibles. el claro sigue disponible con el botón de tema y se recuerda.
- **brillo rubí**: un resplandor rojo muy suave baja desde arriba de cada pantalla (uniswap) y aparece detrás del login y del input de la ia (fey, chronicle). es lo "adiamantado": un destello, no una pintura.

### color
| token | oscuro | claro | uso |
|---|---|---|---|
| `--bg` | `#09090a` | `#f7f7f8` | plano de página |
| `--surface` | `#111113` | `#ffffff` | cards |
| `--surface-2` | `#18181b` | `#f2f2f4` | hover, pistas, inputs |
| `--surface-3` | `#232327` | `#e7e7ea` | pista de progreso, switch apagado |
| `--border` | `#1d1d21` | `#e6e6e9` | bordes 1px, casi invisibles en oscuro |
| `--text` | `#f4f4f5` | `#0a0a0b` | texto primario |
| `--text-2` | `#a1a1aa` | `#52525b` | secundario |
| `--muted` | `#7c7c85` | `#6b6b74` | labels, ejes |
| `--accent` | `#ff4d6d` | `#d0103a` | rubí para texto y trazos (≥4,5:1 en ambos) |
| `--accent-solid` | `#e0123d` | `#d0103a` | rellenos rubí con texto blanco |
| `--accent-soft` | `#2b0d14` | `#fdedf0` | fondo de atención suave |
| `--glow` | rubí al 16% | rubí al 7% | resplandor de identidad |

- el rubí pleno marca: botón "nuevo", tab activa (punto), lo que pide atención (excedido, anomalía, prioridad alta). nada más.
- lo bueno va en tinta con flecha. sin verde.
- severidad por intensidad: gris → rubí suave → rubí pleno.
- botón primario: tinta invertida (blanco en oscuro, negro en claro), como el "enter" de cosmos.

### tipografía: tres voces
- **instrument serif** para títulos de página, saludos y momentos (cosmos, origin, midday). siempre grande, nunca en la interfaz chica.
- **geist sans** para toda la interfaz.
- **geist mono** para cifras (montos protagonistas, columnas de montos) y labels de sección en mayúscula (midday).
- escala: 12 / 13 / 14 (base) / 16 / 20 / 28 / 40 / 56. título de página en serif 40px (32px en mobile).

### forma
- **pill**: botones, inputs de búsqueda, tabs, chips, selectores de rango y badges redondeados al máximo (cosmos, gemini, revolut).
- inputs altos (44px) con radio 12px.
- cards con radio 18px, sin sombra. en oscuro la card se separa del fondo por luminosidad, no por borde.
- grilla de 4px. padding de card 20-24px.

### gráficos
- **línea fina en tinta** (blanca en oscuro), relleno mínimo, valor actual en una etiqueta pegada al eje (fey, uniswap).
- serie secundaria en gris. el rubí solo en valores negativos.
- categorías sin color propio: se leen por nombre e ícono. gasto por categoría = barras horizontales en tinta. evolución de categorías = small multiples.
- toda serie estimada: línea punteada + leyenda "estimado".
- barras ≤ 24px, extremo redondeado 4px. grilla hairline. nunca doble eje.

## 3. navegación (v3)

- **sin sidebar.** barra superior fija (gemini): logo, tabs pill para inicio · movimientos · presupuestos · objetivos, menú **análisis** (estadísticas, fugas, proyección, ia financiera) y menú **agenda** (calendario, alertas). a la derecha: búsqueda ⌘k, botón **nuevo** en rubí, privacidad, tema, campana y menú de cuenta (integraciones, privacidad, configuración, salir).
- contenido centrado de 1200px máximo.
- **mobile**: barra superior con logo y acciones, y un **dock flotante** abajo (fey) con inicio · movimientos · [+] · ia · más. "más" abre un sheet con todas las secciones.
- atajos: `n` nuevo movimiento, `⌘k` buscar.

### inicio (v3)
dos columnas como fey. izquierda: saludo en serif, capital en mono gigante, gráfico de línea fina con real y estimado, lista label/valor de los 4 kpis (revolut). derecha: feed de cards: resumen del mes en prosa con brillo, alertas, próximos gastos, objetivos. debajo, gasto por categoría.

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
