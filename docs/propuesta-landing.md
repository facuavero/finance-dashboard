# propuesta de diseño: landing de caudal

base: [referencias-diseño-landing-caudal.md](./referencias-diseño-landing-caudal.md). cada decisión cita la referencia que la origina. el sistema visual es el de la app ([propuesta-diseño.md](./propuesta-diseño.md)): mismos tokens, misma tipografía, mismo dark mode.

## objetivo

que alguien que nunca vio caudal entienda en 10 segundos que **no es un tracker de gastos** y entre a la demo en un click.

## reglas

1. **el producto es la prueba.** nada de testimonios, logos de prensa ni métricas de usuarios: no existen y no se inventan (fruitful y cash app ponen fuente a cada número). los números del preview y de los fragmentos salen de la cuenta demo.
2. **cta principal = demo.** "probar la demo" entra directo a la cuenta demo (mercury "explore demo"). secundario: "crear cuenta gratis". si `DEMO_MODE=false`, el principal pasa a ser crear cuenta.
3. **mismos componentes que la app.** el preview se arma con `Card`, `Badge` y los tokens, no con una imagen: respeta dark mode y no se desactualiza (midday, mercury).
4. **estimado ≠ real** también acá: línea punteada y etiqueta "estimado".
5. **sin gradientes, sin glass, sin fotos de stock.**

## estructura

| # | sección | qué resuelve | referencia |
|---|---|---|---|
| 1 | header fijo | logo, anclas, entrar, crear cuenta | current, titan |
| 2 | hero | label mono, titular, 2 ctas, nota "sin tarjeta, sin banco", preview del inicio | titan, midday, mercury, fluz |
| 3 | fila de hechos | 4 datos verificables del producto en mono | titan |
| 4 | las 4 preguntas | qué pasó, por qué, qué puede pasar, qué hacer. numeradas 01 a 04 | dovetail, mercury figure a |
| 5 | funciones | 5 cards con fragmento de ui real: carga rápida, fugas, presupuestos, proyección, gmail y calendar | mercury features, ramp suite |
| 6 | ia | cadena motor → ia → vos + recomendación real con impacto calculado + preguntas sugeridas | dovetail, hex, midday, cursor |
| 7 | cómo arranca | línea de tiempo hoy / primera semana / primer mes con nota honesta | ramp, fruitful |
| 8 | privacidad | 3 bloques con evidencia literal + lista "lo que caudal no hace" | cohere, titan, lightdash |
| 9 | preguntas | faq en 2 columnas con acordeón nativo, incluye las incómodas | origin, slash, cash app |
| 10 | cierre | una frase + los 2 ctas | mercury |
| 11 | footer | links + qué no es caudal | ramp, mercury, cash app |

## mobile

hero apilado, ctas full width, preview sin sidebar y con 2 kpis, funciones en una columna, faq en una columna, links del header escondidos (quedan entrar y crear cuenta).

## ruta

`/` muestra la landing a quien no tiene sesión. con sesión sigue redirigiendo a `/inicio`. el proxy ya deja pasar `/`.
