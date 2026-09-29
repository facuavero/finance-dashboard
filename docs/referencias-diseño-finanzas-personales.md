# referencias de diseño: dashboard de finanzas personales con ia

fuente: mobbin.com, navegado con chromium headless el 2026-09-29. sin login.
mobbin corta el scroll con un muro de "log in or join for free", pero las páginas de patrón (`/explore/web/screens/<patrón>`) y el detalle de cada screen (`/explore/screens/<id>`) cargan sin cuenta. de ahí salió todo.

se revisaron más de 200 screens candidatas y se abrieron y analizaron 36. las imágenes no se suben al repo (son de mobbin). cada referencia tiene su link.

apps que más aportan: monarch, copilot money, ynab, rocket money, origin, quicken, midday, fey, wise.

---

## 1. personal finance / budgeting apps

### monarch · cash flow report
- link: https://mobbin.com/explore/screens/92c2b32c-20a0-4487-9b6c-3f32cb464893
- visual: fondo gris cálido muy claro (#f6f5f3 aprox), cards blancas con borde de 1px y radio chico. sans neutra, números grandes en verde (ingreso), rojo (gasto) y negro (neto). sidebar fija de 220px con íconos de línea. tabs de reporte (cash flow, spending, income) subrayadas en naranja de marca.
- patrón que resuelve: 4 kpis arriba (ingreso, gasto, neto, tasa de ahorro) y abajo un sankey ingreso → grupo → categoría con monto y % en cada nodo. se entiende de un vistazo a dónde se va la plata.
- ojo: el sankey es precioso pero pesado. para usuarios no expertos conviene como vista secundaria.

### monarch · spending analysis
- link: https://mobbin.com/explore/screens/a2e2ed59-e4fb-4911-9a80-4906440f42b1
- visual: donut con total en el centro, leyenda en grilla de 3 columnas con monto y %. debajo, lista de transacciones agrupada por día con subtotal por día, y a la derecha un panel "summary" (cantidad, mayor transacción, promedio, total, primera y última fecha) con "download csv".
- patrón que resuelve: toggle "totals / change" arriba del gráfico. el mismo gráfico sirve para ver distribución o variación contra otro período. filtros y "saved" en la barra superior del reporte.

### copilot money · categorías con presupuesto
- links:
  - https://mobbin.com/explore/screens/0ab062b4-f57e-4f9c-bd42-51275b846857
  - https://mobbin.com/explore/screens/786ed8a5-597e-4f2b-b5e8-a215e86cb1cf
  - https://mobbin.com/explore/screens/f9852ce6-2bba-46cc-a8c5-4f7ca8317074
- visual: layout de 3 columnas (nav + lista + panel de detalle). fondo blanco, mucho aire, emojis como ícono de categoría. barras de progreso finitas: verde en rango, naranja cerca del límite, rojo pasado. números con el signo $ en superíndice chico.
- patrón que resuelve: resumen "gastado vs presupuesto total" con donut chiquito arriba. click en categoría abre panel lateral con historial mensual (barras + línea punteada del presupuesto), métricas clave (gastado por año, promedio mensual) y las transacciones de esa categoría. editar el presupuesto se hace ahí mismo, sin cambiar de pantalla. categorías "excluidas" separadas.

### ynab · plan mensual
- links:
  - https://mobbin.com/explore/screens/4478d3c1-0d65-4ddc-b876-d9d8bca64ca8
  - https://mobbin.com/explore/screens/7500cdb6-1ea1-4b41-9cca-4c1ec419edca
- visual: sidebar azul oscuro saturado, tabla densa con grupos colapsables (savings, bills, needs, wants). montos disponibles en pills: verde si hay plata, rojo si está sobregirado, gris si es cero. chips de filtro arriba ("1 overspent", "underfunded", "next bills").
- patrón que resuelve: el chip "1 overspent" en rojo es una alerta integrada al filtro: un click y ves el problema. panel derecho con "target" (meta mensual por categoría) y confirmación visual "you've met your target". tips de teclado discretos.
- ojo: muy denso. sirve para usuarios metódicos, no para el público general.

### rocket money · dashboard
- link: https://mobbin.com/explore/screens/a747c477-0008-44a0-b887-81dc4e75b44e
- visual: blanco, rojo de marca solo en el logo y el ítem activo. saludo grande ("good evening, sam"). card principal con "current spend this month" enorme y línea acumulada del mes. badge naranja "you've spent $361 more than last month".
- patrón que resuelve: la comparación contra el mes anterior en lenguaje natural, al lado del número. tooltip "net cash" que explica el concepto en 3 líneas sin jerga. cuentas con "sync now" y hace cuánto se sincronizó.

**qué adaptar a nuestro dashboard:**
- sidebar fija clara, íconos de línea, un único color de acento para el estado activo (monarch, rocket money).
- barras de presupuesto finas con 3 estados (ok, cerca, excedido) como copilot. el estado se comunica también con texto, no solo color.
- panel lateral de detalle para categorías y movimientos: editar sin salir de contexto (copilot).
- comparación con el período anterior escrita en lenguaje natural al lado del número (rocket money).
- chips de filtro que funcionan como alertas ("2 presupuestos excedidos") como ynab.
- sankey queda como vista secundaria en estadísticas. el default es barras y donut simples.

---

## 2. onboarding / signup / login

### monarch · sign up
- link: https://mobbin.com/explore/screens/122f9a5d-4fa9-416d-b1cc-2de1d07f5bc9
- visual: split 50/50. izquierda: formulario centrado angosto (apple, google, o email). derecha: fondo gris azulado con testimonio grande en serif y preview del producto real.
- patrón que resuelve: mostrar el producto real al lado del formulario vende más que un hero abstracto. legal en una línea debajo del botón.

### monarch · reset password
- link: https://mobbin.com/explore/screens/98cc5509-237a-470f-8f68-420c9691f7d9
- visual: card blanca chica centrada sobre fondo cálido, logo arriba. un solo campo, botón naranja full width. link "wait, i remember my password".
- patrón que resuelve: un paso por pantalla, cero distracciones, salida explícita para volver.

### origin · create account
- link: https://mobbin.com/explore/screens/a446a2a3-40ed-494b-b85c-3d1aebf0d37e
- visual: dos cards redondeadas. izquierda formulario con labels flotantes y botones pill (back en outline, next en negro). derecha: verde claro con titular en serif y checklist de beneficios.
- patrón que resuelve: validación de contraseña en vivo: barra de fuerza + checklist de requisitos que se tildan en verde mientras escribís. el usuario sabe qué falta antes de enviar.

### midday · login
- link: https://mobbin.com/explore/screens/27366277-4985-4614-88fb-fac39a958e9e
- visual: blanco y negro total. imagen texturada a la izquierda, formulario a la derecha. titular en serif chico, botones rectos negros, legal en monospace.
- patrón que resuelve: un solo flujo para "nuevo o volvés": pedís el email y después decidís. "other options" colapsado para no saturar.

### fey · login
- link: https://mobbin.com/explore/screens/de7ce1e1-8591-461d-aa1a-422701161ca2
- visual: dark mode absoluto, título con gradiente suave, input pill con botón de flecha integrado.
- patrón que resuelve: prueba de que un login oscuro puede verse premium. para nosotros el gradiente sobra, pero el input con acción integrada es buena idea.

### wise · reset password
- link: https://mobbin.com/explore/screens/6284ebba-5511-4085-9c12-cdcb21aa8092
- visual: ilustración 3d arriba, título grande, texto que explica qué va a pasar ("te mandamos un link"), botón verde lima pill, link a ayuda.
- patrón que resuelve: explicar el próximo paso antes de pedir el dato.

### midday · conectar cuenta bancaria
- link: https://mobbin.com/explore/screens/25a9893b-6f14-4f6d-a0d7-7b8293d58375
- visual: modal blanco con buscador + selector de país. lista con logo, nombre, proveedor ("via plaid") y botón "connect".
- patrón que resuelve: dice de entrada cuál es la alternativa si no encontrás tu banco ("manual import"). transparencia sobre el intermediario.

**qué adaptar a nuestro dashboard:**
- auth en split: formulario angosto a la izquierda, a la derecha preview del producto y 3 beneficios concretos (monarch + origin). en mobile solo el formulario.
- checklist de contraseña en vivo con barra de fuerza (origin).
- recuperar contraseña en card chica, un campo, texto que explica el próximo paso (monarch + wise).
- estados de carga en el botón, error inline debajo del campo, mensaje de éxito en la misma card.
- conectar gmail y calendar con modal que explica el proveedor, los permisos exactos y la alternativa manual (midday).

---

## 3. finance dashboard / home

### monarch · dashboard
- link: https://mobbin.com/explore/screens/a2852c69-d3f2-45cb-b3fd-c6fadfc47977
- visual: grilla de 2 columnas con cards de igual peso: presupuesto (fijo, flexible, no mensual con barras), gasto del mes vs mes anterior (línea naranja sobre gris), patrimonio con línea, transacciones recientes, recurrentes, objetivos. botón "customize" arriba a la derecha.
- patrón que resuelve: cada card tiene título + subtítulo gris + selector de período propio. estados vacíos dentro de la card ("no upcoming transactions for this time period").
- ojo: todas las cards pesan igual. no hay jerarquía clara de qué mirar primero.

### origin · home
- links:
  - https://mobbin.com/explore/screens/234ff833-b48c-430c-92bb-7b71ecea52af
  - https://mobbin.com/explore/screens/50653ef9-29f7-4a21-b265-104debf86a6e
- visual: fondo crema, labels en monospace mayúscula con tracking ("NET WORTH", "SPENDING"), número grande en sans. columna derecha angosta con progreso de setup (1/6) y gasto del mes con línea punteada de proyección.
- patrón que resuelve: menú de la card de patrimonio con "turn on privacy" (oculta montos), "hide graph", "filter accounts". modo privacidad a un click. selector 1w/1m/3m/ytd/all en pills. "building wealth takes time. your net worth graph takes a week to populate" como estado vacío del gráfico.

### midday · overview
- links:
  - https://mobbin.com/explore/screens/2d595b0c-48f1-455c-ba67-822cd342c073
  - https://mobbin.com/explore/screens/f6de71e5-ed44-4d0e-84d6-afd2f060be83
- visual: monocromo. número principal enorme en monospace ("$11,056.82"), abajo "vs $7,669 last period". barras negras (período actual) contra grises (anterior). tres cards abajo: asistente, gasto, facturas. sidebar de íconos que se expande con labels.
- patrón que resuelve: un kpi protagonista con selector de métrica (revenue, burn rate, profit) en vez de 6 kpis compitiendo. comparación con período anterior en el mismo gráfico. buscador global con ⌘k.

### quicken · dashboard sin datos
- link: https://mobbin.com/explore/screens/d65d0197-7ea0-4dc3-bcc4-435c961d2d60
- visual: cards grandes redondeadas, ilustraciones con acento verde y rojo, copy amable ("kudos! you haven't spent anything this month").
- patrón que resuelve: cada módulo del dashboard tiene su propio estado vacío con explicación y un cta. el usuario nuevo entiende para qué sirve cada cosa.
- ojo: el tono "kudos" con gasto cero puede sonar raro cuando en realidad no hay datos. hay que distinguir "no gastaste" de "no cargaste nada".

### rocket money · dashboard con cuentas
- link: https://mobbin.com/explore/screens/c36ea480-12c5-4673-955b-fb1a38d86e39
- visual: igual que la referencia de la categoría 1. columna derecha con cuentas y "add" en rojo para las que faltan.
- patrón que resuelve: "you've had 110 transactions so far this month" como contexto chico arriba de la tabla.

### fey · home (dark)
- link: https://mobbin.com/explore/screens/412e1f9f-6b32-4837-8abe-286569b8628a
- visual: negro con cards gris muy oscuro, verde y rojo desaturados para variaciones, sparklines finas. barra de navegación flotante abajo. "daily recap" escrito en prosa arriba de todo.
- patrón que resuelve: un resumen en texto generado ("the markets are neutral") antes de los números. referencia fuerte para nuestro dark mode y para el "resumen de ia" del inicio.

**qué adaptar a nuestro dashboard:**
- jerarquía de 3 niveles, no una grilla pareja: (1) resumen de ia en prosa + capital disponible protagonista, (2) ingresos, gastos, ahorro y % de ahorro con comparación, (3) módulos: evolución, categorías, próximos gastos, objetivos, alertas.
- número principal en fuente mono tabular, comparación "vs período anterior" debajo (midday).
- modo privacidad para ocultar montos (origin).
- cada card con su estado vacío y cta, distinguiendo "sin datos" de "cero" (quicken, pero bien resuelto).
- labels de sección chicos en mayúscula con tracking (origin) para ordenar sin sumar peso.
- dark mode con grises profundos, no negro puro, y verde/rojo desaturados (fey).

---

## 4. charts & spending insights (analytics, ia)

### midday · explicación de métrica
- link: https://mobbin.com/explore/screens/564f6067-f18b-4990-b3a4-0c82e52c98e7
- visual: popover desde el ícono (i) al lado de "vs last period". título en negrita, explicación en gris, link a configuración.
- patrón que resuelve: explica qué significa el número y por qué puede estar mal ("si parece alto, puede haber transferencias internas marcadas como ingreso. excluilas"). explicación + acción concreta. es exactamente el tono que queremos para la ia.

### midday · asistente con gráfico
- link: https://mobbin.com/explore/screens/03e2a08c-6fdb-4ed4-9bb6-70ba9dd07767
- visual: modal centrado, respuesta con mini gráfico de área rayada + párrafo en monospace. input abajo "ask midday a question…".
- patrón que resuelve: la ia responde con dato + gráfico + interpretación ("tu burn rate promedio es 878.70 por mes. te quedan 0 meses de runway"). y ofrece seguir ("si querés te doy más detalle").

### midday · burn rate
- link: https://mobbin.com/explore/screens/d2263de9-429a-47fd-89e4-272c3ba70faf
- visual: curva suavizada con relleno rayado diagonal en vez de color sólido. monocromo.
- patrón que resuelve: el rayado diferencia sin sumar colores. lo usamos para marcar valores estimados contra reales.

### origin · invest con ia
- link: https://mobbin.com/explore/screens/3a516cce-bf0f-4eb8-90d7-1625e5d49c32
- visual: línea del portafolio contra benchmark punteado, tooltip con fecha y dos valores. botón ✦ (sparkle) en la esquina de cada card para preguntarle a la ia sobre ese bloque. "ask anything" fijo abajo del sidebar.
- patrón que resuelve: la ia contextual. cada card tiene su entrada a la ia, no hay que ir a un chat aparte.

### monarch (ios) · cash flow y plan
- links:
  - https://mobbin.com/explore/screens/fe000d23-c8dd-412a-984b-81f9cb99048d
  - https://mobbin.com/explore/screens/794a4ea9-9d5c-4475-977c-e5652352af28
  - https://mobbin.com/explore/screens/3d951da4-8f9f-44d6-93af-ac3ddef8c85f
- visual: mobile. lista ingreso / gasto / ahorro con puntos de color. "plan summary" con barras planeado vs real y mensaje ("estás ganando más de lo planeado este mes"). tabs de período en pills. bottom nav de 5 íconos.
- patrón que resuelve: resultado del período escrito como frase, no solo como número. referencia para el layout mobile.

### fey · analysis (dark)
- link: https://mobbin.com/explore/screens/0556201a-e5d0-4322-9d11-e29a297bda99
- visual: tabs con ícono, dos cards de gráfico lado a lado, tabla ancha abajo con pills de tipo. selector de rango 1m/3m/6m/ytd/all.
- patrón que resuelve: "chart updated daily" como nota de frescura del dato. tabla y gráfico conviven sin competir.

### copilot money · historial por categoría
- link: https://mobbin.com/explore/screens/0ab062b4-f57e-4f9c-bd42-51275b846857
- visual: barras mensuales con una línea horizontal punteada para el presupuesto y etiqueta del límite a la derecha.
- patrón que resuelve: ves de inmediato qué meses pasaste el límite. ideal para detección de anomalías por categoría.

**qué adaptar a nuestro dashboard:**
- cada métrica con (i) que explica qué es y qué hacer si se ve rara (midday).
- valores estimados con trazo punteado o relleno rayado. valores reales en sólido. leyenda "real / estimado" siempre visible (midday + origin).
- ia contextual: botón ✦ en las cards clave que abre la explicación de ese bloque (origin). además una sección "ia financiera" completa.
- respuestas de ia con estructura fija: dato, explicación, acción, impacto en $, prioridad.
- barras mensuales con línea de promedio o presupuesto para anomalías (copilot).
- selector de período en pills: semana, mes, trimestre, año.
- frescura del dato ("actualizado hace 5 min") en integraciones y en el análisis.

---

## 5. add transaction forms & empty states

### midday · menú de agregar
- link: https://mobbin.com/explore/screens/11a588ca-d160-4536-9ebd-8825453a515e
- visual: botón "+" arriba a la derecha que abre dropdown: connect account, import/backfill, create transaction. tabla de transacciones con bordes finos, ingresos en verde, categoría con cuadrado de color.
- patrón que resuelve: un solo punto de entrada para las 3 formas de cargar datos.

### midday · detalle de transacción
- link: https://mobbin.com/explore/screens/9348603e-d57e-4a7a-99a0-c8f71e914464
- visual: panel lateral derecho (sheet) sobre la tabla atenuada. monto grande en mono, campos categoría + asignado, tags como chips removibles, adjuntos con drop zone, secciones colapsables. atajos abajo: ↑ ↓ para navegar, esc para cerrar, ⌘m para marcar.
- patrón que resuelve: editar sin perder la lista. navegación con teclado entre movimientos.

### midday · filtros
- link: https://mobbin.com/explore/screens/cd13411a-9fd2-4c61-9be0-035f948fbf16
- visual: menú de filtros anidado (fecha, monto, estado, adjuntos, categorías, tags, cuentas, recurrente). submenú de monto con min/max + slider de rango y botón "show 5 transactions". barra flotante abajo con el total filtrado ("-SGD 7 (6 transactions)").
- patrón que resuelve: el botón dice cuántos resultados vas a ver antes de aplicar. el total del filtro siempre visible.

### midday · sin resultados
- link: https://mobbin.com/explore/screens/764b3128-3a79-43ca-8815-9a9024832473
- visual: ícono lineal chico, título "no results", subtítulo "try another search, or adjusting the filters", botón "clear filters".
- patrón que resuelve: el estado vacío tiene salida inmediata.

### midday · notificaciones vacías y asistente vacío
- links:
  - https://mobbin.com/explore/screens/a821151f-c6a6-4eb8-93c4-5da99f15d686
  - https://mobbin.com/explore/screens/cceb07e3-fe40-42ad-a910-65c2ca0ec054
- visual: inbox con tabs inbox / archive y "no new notifications". asistente con saludo y chips de preguntas sugeridas ("what's my burn rate", "show transactions without receipts").
- patrón que resuelve: las preguntas sugeridas enseñan qué puede hacer la ia sin tutorial.

### midday · mapeo de importación csv
- link: https://mobbin.com/explore/screens/9c2334de-b8b8-4495-830b-ebd05d2a936e
- visual: modal "confirm import" con dos columnas (columna del csv → columna de midday), flechas, selector de cuenta, botón deshabilitado hasta completar.
- patrón que resuelve: "mapeamos cada columna con lo que creemos correcto, pero revisalo". la app propone, el usuario confirma.

### copilot money (ios) · editar presupuesto
- link: https://mobbin.com/explore/screens/c0fe9506-6aca-403b-850c-b1d0ebe3f0ae
- visual: bottom sheet con nombre de la categoría grande, monto editable, mini historial de barras y teclado numérico propio.
- patrón que resuelve: en mobile el monto es lo primero y el teclado numérico aparece solo. referencia directa para el "agregar gasto en segundos".

**qué adaptar a nuestro dashboard:**
- un botón "nuevo" global (y atajo `n`) con 3 opciones: movimiento, importar csv, conectar integración (midday).
- quick add: monto primero con foco automático, tipo gasto/ingreso en toggle, categoría con chips de las más usadas, fecha default hoy. todo lo demás (subcategoría, método de pago, recurrente, etiquetas, descripción) en "más detalles" colapsado. enter guarda (copilot + midday).
- detalle y edición en sheet lateral sobre la tabla (midday).
- filtros con conteo antes de aplicar y total filtrado visible (midday).
- cada estado vacío: ícono lineal, qué pasa, y una acción (midday).
- importación csv con mapeo propuesto y confirmación (midday).

---

## extra: integraciones, permisos y privacidad

### midday · directorio de apps
- link: https://mobbin.com/explore/screens/fe71b12c-1f88-47b0-b3d0-931451bccbba
- visual: grilla de cards con logo, nombre, badge de estado ("installed", "coming soon"), descripción de qué hace la integración y botones details / disconnect.
- patrón que resuelve: cada integración explica qué hace en una frase y se desconecta desde la misma card.

### midday · conexiones bancarias en settings
- link: https://mobbin.com/explore/screens/8653d2d1-4618-463a-8c5b-713f60457af2
- visual: tabs de settings (general, billing, bank connections, members, notifications, developer). cada conexión con "updated about 2 hours ago via plaid", íconos de reconectar, refrescar y borrar. switch por subcuenta para incluir o excluir.
- patrón que resuelve: control granular y frescura del dato visible.

### origin · modo privacidad
- link: https://mobbin.com/explore/screens/50653ef9-29f7-4a21-b265-104debf86a6e
- visual: menú contextual con "turn on privacy" al lado de refresh y manage accounts.
- patrón que resuelve: ocultar montos en pantallas compartidas.

**qué adaptar a nuestro dashboard:**
- página integraciones con cards: estado, última sincronización, permisos exactos (scope literal de google + qué significa), qué datos se guardan, botones sincronizar y desconectar.
- desconectar borra tokens y hallazgos derivados de esa integración. nunca toca movimientos cargados a mano. se dice explícitamente en el diálogo de confirmación.
- página privacidad con tabla "dato → para qué se usa → dónde se guarda → cómo borrarlo". sin textos ambiguos.
- modo privacidad global (ocultar montos) en el header.

---

## conclusiones para el sistema visual

1. **base neutra cálida** (monarch, origin): fondo gris cálido muy claro, cards blancas con borde de 1px, sombra casi nula.
2. **un solo acento**. los colores semánticos (verde ingreso, rojo gasto o excedido, ámbar advertencia) se usan solo cuando significan algo.
3. **números**: cifras tabulares en columnas y tablas para que alineen. la cifra protagonista va en la misma sans, grande, con dígitos proporcionales (midday usa mono, pero a tamaño display se ve flojo).
4. **labels chicos en mayúscula con tracking** en mono para encabezados de sección (origin).
5. **estimado ≠ real**: línea punteada y más clara para estimaciones, sólida para datos reales, con leyenda "real / estimado" (midday + origin).
6. **ia contextual + ia central**: ✦ en cada card y una sección completa (origin + midday).
7. **edición en panel lateral** para no perder contexto (copilot, midday).
8. **estados vacíos con acción** en todos los módulos (quicken, midday).
9. **dark mode con grises profundos** y semánticos desaturados (fey).
10. **mobile**: bottom nav de 5 ítems, quick add como bottom sheet con monto primero (monarch ios, copilot ios).

## componentes (21st.dev)

se intentó sacar componentes de 21st.dev. el catálogo carga (stats & kpis: 153, ai chats: 248, alerts: 240, etc.), pero las páginas de componente fallan en chromium headless con "something went wrong / the page failed to render". no se pudo bajar ninguno.

como los componentes de 21st.dev son registros de shadcn/ui (radix + tailwind), se usa la misma base: primitivas de radix con estilos propios siguiendo el patrón shadcn. además evita mezclar componentes de autores distintos con estéticas distintas.
