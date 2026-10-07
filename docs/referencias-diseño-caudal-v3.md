# referencias de diseño: caudal v3 (rediseño completo)

fuente: mobbin.com, navegado con chromium headless el 2026-10-07. sin login.
patrones usados: `/explore/web/app-categories/finance` y `/explore/web/screens/<patrón>` (personal-finance-dashboard, banking-dashboard, finance-dashboard, investment-dashboard, login, signup, dashboard-layout, charts, add-create, empty-state, wallet-balance, dark-mode). las listas cortan el scroll con el muro de login, pero cada una muestra unas 60 pantallas y el detalle de cada pantalla abre sin cuenta.

se listaron unas 750 pantallas, se capturaron 141 candidatas de apps con estética monocromo y se eligieron 31. las imágenes no se suben al repo (son de mobbin). cada referencia tiene su link.

pedido: otro diseño en general, no solo colores. paleta: grises, blancos, negros y un acento rojo adiamantado.

apps que más aportan: fey, gemini, cosmos, midday, uniswap, mercury, v0.

---

## 1. finance & banking apps con estética monocromo

### fey · home
- links:
  - https://mobbin.com/explore/screens/0b5a5f7f-0420-4e48-9cb7-f51cc6e74737
  - https://mobbin.com/explore/screens/35b2c386-c5d3-42a7-bcf3-d17798f8c34c
- visual: negro casi puro (#0b0b0c), cards un punto más claras sin borde visible, radio grande. saludo chico arriba a la izquierda ("hello, sam"). dos columnas: a la izquierda una card con fecha chica gris, titular en prosa ("the markets are **neutral**", con la palabra clave en gris), línea blanca fina sin relleno y debajo una lista de sectores con variación y una mini barra de ticks. a la derecha un feed vertical de cards: "daily recap" en prosa con fondo apenas iluminado, y después noticias cortas con chip del ticker y variación en pill verde o roja. navegación: un dock flotante de íconos centrado abajo, con la búsqueda separada en un círculo.
- patrón que resuelve: el inicio se lee como un diario. una frase dice el estado, el gráfico lo prueba, el feed cuenta qué pasó. no hay sidebar: el contenido ocupa todo.

### fey · analysis
- link: https://mobbin.com/explore/screens/0556201a-e5d0-4322-9d11-e29a297bda99
- visual: título grande "analysis" con la fecha en gris debajo. tabs con ícono subrayadas en azul fino. dos cards: lista de transacciones grandes (ticker en negrita + nombre en gris + monto alineado) y un gráfico de 2 líneas (blanca y roja) sobre negro. abajo una tabla ancha sin bordes verticales, una fila resaltada con borde completo, pills de tipo ("purchase").
- patrón que resuelve: tabla oscura densa que igual respira: filas altas, separadores casi invisibles, cifras alineadas a la derecha, la fila activa con borde en vez de fondo.

### gemini · portfolio
- link: https://mobbin.com/explore/screens/1dd86c53-bb53-4bd0-abaf-d47133474c32
- visual: barra superior negra a todo el ancho con logo, selector de cuenta en pill con borde y navegación en tabs pill (home, trade, stake, portfolio), el activo con fondo gris. a la derecha acciones de texto con ícono. contenido blanco con cards de radio 16-20 y borde gris claro. botones pill grises. formulario "make a trade" con segmented buy/sell/convert, input grande con prefijo $ y montos rápidos en pills ($50, $100, $500).
- patrón que resuelve: navegación arriba en vez de sidebar: más ancho para los datos y una sola línea que dice dónde estás. montos rápidos en pills para cargar sin tipear.

### uniswap · analytics
- link: https://mobbin.com/explore/screens/f7ce2fb3-503a-4274-b3d6-95a857be83b1
- visual: gris muy oscuro con un brillo rosa rojizo que baja desde arriba (radial). buscador ancho en pill oscuro. fila de datos en texto ("eth price: us$2.267 · transactions (24h): 189.574"). dos cards de gráfico: label chico, cifra grande, variación en verde, área con línea de color y una etiqueta con el valor actual pegada al eje derecho.
- patrón que resuelve: el brillo de color arriba le da identidad a una interfaz monocroma sin pintar ningún componente. el valor actual vive en el eje, no en una leyenda.

### revolut · detalle de acción
- link: https://mobbin.com/explore/screens/90050756-0bf5-4b8c-9bb7-dc8906e7fec0
- visual: gris claro. izquierda: nombre grande, botones pill (buy relleno, sell en gris), tabs pill, lista de stats en card blanca con label a la izquierda y valor a la derecha. derecha: card blanca con precio enorme, variación chica debajo y un selector de rango en pill segmentado de ancho completo (1d, 1w, 1m...).
- patrón que resuelve: lista de pares label/valor como alternativa a la grilla de kpis. más fácil de leer en mobile y no compite con el número principal.

### coinbase · home logueado
- link: https://mobbin.com/explore/screens/199ff7a4-9300-4089-8557-8bcc3158b45f
- visual: negro, sidebar angosta de íconos con label, tabs de texto arriba, una card destacada enorme con imagen y botón pill de color de marca a todo el ancho.
- patrón que resuelve: un solo color de marca usado en un solo botón por pantalla. el resto es blanco sobre negro.

**qué adaptar a caudal:**
- **dark primero.** el tema por defecto es oscuro, casi negro, con cards apenas más claras y bordes casi invisibles (fey, coinbase). el claro sigue disponible.
- inicio en dos columnas como fey: a la izquierda el capital con su gráfico de línea fina y la lista de kpis; a la derecha un feed con el resumen en prosa, las alertas y lo que viene.
- titular en prosa con una palabra clave resaltada ("tu mes viene **bien**").
- el rojo como brillo de identidad arriba de la página, igual que el rosa de uniswap. es lo "adiamantado": un destello, no una pintura.
- listas label/valor (revolut) en vez de grillas de cards donde haya pocos datos.

---

## 2. onboarding, signup y login

### cosmos · sign in
- link: https://mobbin.com/explore/screens/0683f8ea-c110-417d-a5e0-bf3ab1199213
- visual: negro con grano. split: a la izquierda objetos 3d oscuros flotando en círculo, a la derecha el formulario. título "sign in" en serif fina, inputs pill altos gris oscuro con el label chico adentro, botón "enter" pill blanco a todo el ancho, "forgot password?" gris.
- patrón que resuelve: un login que parece producto premium con solo tres elementos. el label adentro del input ahorra altura y se ve más limpio.

### cosmos · crear cuenta
- link: https://mobbin.com/explore/screens/11db64a7-3386-4b3a-889a-b2fa9bf27b76
- visual: mismo sistema: inputs pill oscuros con label interno, checkbox de términos dentro de un pill.
- patrón que resuelve: consistencia total entre login y registro.

### fey · login y signup
- links:
  - https://mobbin.com/explore/screens/de7ce1e1-8591-461d-aa1a-422701161ca2
  - https://mobbin.com/explore/screens/90b57a25-ccac-413f-a9be-413e52ab652c
- visual: negro con un brillo difuso detrás del formulario. título chico con el nombre de marca en color. un solo input pill con botón de flecha integrado, google debajo.
- patrón que resuelve: el brillo detrás del formulario concentra la mirada sin agregar elementos.

### runway · login
- link: https://mobbin.com/explore/screens/c4e21a53-644b-4eb2-90da-f6b7fb132d4e
- visual: split con foto a sangre a la izquierda y frase grande encima. formulario blanco angosto, botón negro pill.
- patrón que resuelve: la mitad visual cuenta la promesa con una frase. el formulario no tiene que explicar nada.

### origin · login
- link: https://mobbin.com/explore/screens/5841a084-64ba-4351-a46f-f5ed6d868469
- visual: dos cards: formulario con botones en mono mayúscula y titular serif "welcome back"; a la derecha card de color con checklist de beneficios.
- patrón que resuelve: serif para el saludo, mono para las acciones. dos voces tipográficas bien separadas.

### midday · setup del equipo
- link: https://mobbin.com/explore/screens/709f787f-acda-41a9-acf3-0e28e1204a9d
- visual: blanco, título serif centrado, subtítulo gris, inputs rectos con label arriba, botón negro a todo el ancho.
- patrón que resuelve: un paso, un título, un botón. el serif hace que el onboarding se sienta cuidado.

**qué adaptar a caudal:**
- login y registro en split oscuro (cosmos): a la izquierda una pieza visual propia, un rubí facetado en svg con su brillo rojo (lo adiamantado), y una frase. a la derecha el formulario.
- títulos de auth en serif (cosmos, origin, midday).
- inputs altos y redondeados con el label chico arriba dentro del mismo bloque visual. botón principal pill a todo el ancho.
- brillo difuso detrás del formulario en mobile, donde no entra el split (fey).

---

## 3. dashboard, layout y navegación

### gemini · barra superior
- link: https://mobbin.com/explore/screens/1dd86c53-bb53-4bd0-abaf-d47133474c32
- visual: ver categoría 1. barra negra de 44px, tabs pill, acciones a la derecha, campana con contador rojo.
- patrón que resuelve: navegación principal arriba. el contenido gana todo el ancho.

### fey · dock flotante
- link: https://mobbin.com/explore/screens/35b2c386-c5d3-42a7-bcf3-d17798f8c34c
- visual: cápsula oscura flotante centrada abajo con 7 íconos, el activo con fondo gris. tooltip con atajo de teclado ("earnings g then c").
- patrón que resuelve: navegación al alcance del pulgar en mobile y atajos visibles en desktop.

### v0 · dark
- link: https://mobbin.com/explore/screens/b7a2fd36-b9ff-4cf7-965f-8b3ecb4e8810
- visual: negro, título enorme centrado "what can i help you build?", input grande con acciones adentro, chips de sugerencia con ícono debajo. el contenido principal en un panel con borde redondeado que se separa del fondo.
- patrón que resuelve: una pantalla, una pregunta. la ia se presenta como un input protagonista.

### workos · settings dark
- link: https://mobbin.com/explore/screens/e9052988-8cd2-4d8d-b16b-949a6f12b57c
- visual: gris muy oscuro, cards con borde fino, cada método con ícono, título, descripción gris y estado "enabled" en verde chico a la derecha.
- patrón que resuelve: configuración como lista de cards con estado, sin formularios largos.

### superhuman · inbox dark
- link: https://mobbin.com/explore/screens/bcd6318b-cf9d-4f34-88f9-8f63da988c85
- visual: lista densa a todo el ancho, filas de una línea con remitente en negrita y asunto gris, separadores por fecha, panel derecho de contexto.
- patrón que resuelve: densidad sin ruido. cada fila es una línea.

### midday · marketplace dark
- link: https://mobbin.com/explore/screens/5d868223-a644-4752-8d3a-b68cda14339d
- visual: grilla de cards negras con borde gris, logo blanco, descripción gris, dos botones chicos (details, install).
- patrón que resuelve: integraciones como catálogo uniforme.

**qué adaptar a caudal:**
- **chau sidebar.** barra superior con logo, tabs pill para las 4 secciones de uso diario (inicio, movimientos, presupuestos, objetivos), un menú "análisis" y otro "agenda", y a la derecha búsqueda ⌘k, botón nuevo, privacidad, tema, campana y cuenta (gemini).
- en mobile, dock flotante abajo con 5 accesos y el + al centro (fey).
- contenido centrado de 1200px máximo. sin paneles laterales fijos.
- ia financiera con el input como protagonista arriba, título grande centrado y chips (v0).
- configuración, integraciones y privacidad como listas de cards con estado (workos, midday).

---

## 4. tabla de movimientos y gráficos

### mercury · transactions
- link: https://mobbin.com/explore/screens/38664478-d88e-4575-a0b0-78ec6c218ce9
- visual: arriba de la tabla un resumen: "net change this month −$6.41" con los centavos en superíndice, "money in / money out" con una rayita de color, y al lado un gráfico de área. filtros como botones con borde y chevron. filas con fecha, avatar redondo con inicial o logo, nombre, monto alineado, cuenta y método con ícono.
- patrón que resuelve: la tabla arranca con su propio resumen. ves el total del filtro antes que las filas.

### fey · tabla de insider
- link: https://mobbin.com/explore/screens/0556201a-e5d0-4322-9d11-e29a297bda99
- visual: ver categoría 1.
- patrón que resuelve: tabla oscura con fila activa marcada por borde.

### uniswap · gráfico con valor en el eje
- link: https://mobbin.com/explore/screens/f7ce2fb3-503a-4274-b3d6-95a857be83b1
- visual: ver categoría 1. línea de referencia punteada horizontal hasta una etiqueta con el valor actual sobre el eje derecho.
- patrón que resuelve: el número de hoy se lee pegado al gráfico.

### revolut · selector de rango
- link: https://mobbin.com/explore/screens/90050756-0bf5-4b8c-9bb7-dc8906e7fec0
- visual: ver categoría 1. segmented control de ancho completo debajo del gráfico.
- patrón que resuelve: el rango se elige donde se mira.

### midday · revenue
- link: https://mobbin.com/explore/screens/fa47d11e-0857-4ddc-a515-c837358b7c68
- visual: blanco, cifra principal en monospace ("$11,135.04") con "vs $7,669 last period" gris debajo, barras negras contra barras gris claro del período anterior.
- patrón que resuelve: la cifra en mono se ve "de sistema", precisa. negro contra gris compara sin color.

### whop · actividad
- link: https://mobbin.com/explore/screens/c37c9a34-5783-4589-b102-646884177463
- visual: blanco, total grande arriba con barra de progreso, alerta en caja roja suave, tabs, tabla con pills de tipo (rojo suave y verde suave).
- patrón que resuelve: el estado de cada fila en un pill chico, el resto de la fila en tinta.

### origin · cash flow
- link: https://mobbin.com/explore/screens/13455ab0-51d3-4f93-ae86-bd108c3dc9c9
- visual: tabs subrayadas, gráfico de barras positivas y negativas con línea punteada de tendencia, tabla mes por mes debajo.
- patrón que resuelve: gráfico y tabla del mismo dato, uno arriba del otro.

**qué adaptar a caudal:**
- **cifras en mono.** todo monto protagonista y toda columna de montos en geist mono (midday). los decimales no se muestran, así que no hace falta el superíndice de mercury.
- movimientos arranca con un resumen del filtro: neto del período, entró, salió (mercury).
- filas con avatar redondo con la inicial del comercio o el ícono de la categoría (mercury).
- tabla oscura con separadores casi invisibles, fila seleccionada con borde (fey).
- gráficos: línea fina en tinta (blanca en oscuro) sin relleno fuerte, y el valor actual en una etiqueta pegada al eje (fey + uniswap). comparación contra el período anterior en gris (midday).
- selector de rango en pill segmentado debajo o arriba del gráfico (revolut).

---

## 5. formularios, carga rápida y estados vacíos

### chronicle · generar desde prompt
- link: https://mobbin.com/explore/screens/3f7f32a0-3cb9-4d04-ab67-d1d3ae740a75
- visual: negro, título centrado, input oscuro grande con brillo suave alrededor, "try these out…" con chips grises. barra inferior flotante con opciones y botón "continue →" blanco.
- patrón que resuelve: el input con brillo se siente vivo. las sugerencias enseñan qué escribir.

### v0 · prompt
- link: https://mobbin.com/explore/screens/b7a2fd36-b9ff-4cf7-965f-8b3ecb4e8810
- visual: ver categoría 3. chips con ícono debajo del input.
- patrón que resuelve: atajos de las tareas más comunes como chips.

### gemini · make a trade
- link: https://mobbin.com/explore/screens/1dd86c53-bb53-4bd0-abaf-d47133474c32
- visual: segmented buy/sell/convert en pill gris, input de monto grande con prefijo $ y moneda a la derecha, montos rápidos en pills, filas de selección con chevron, botones pill grandes.
- patrón que resuelve: el formulario de dinero más rápido: tipo, monto, sugerencias de monto.

### midday · sin resultados
- link: https://mobbin.com/explore/screens/764b3128-3a79-43ca-8815-9a9024832473
- visual: ícono lineal chico, "no results", una línea gris, botón "clear filters" con borde.
- patrón que resuelve: estado vacío mínimo con salida.

### wise · balance vacío
- link: https://mobbin.com/explore/screens/b4dbadff-6eab-40c4-9603-8bdc8b287545
- visual: "0 SGD" grande arriba, acciones en círculos (add, convert, send), y abajo "transactions" con ilustración y texto "you don't have any transactions yet".
- patrón que resuelve: aunque esté vacío, el número y las acciones están en su lugar.

### clerk · detalle vacío
- link: https://mobbin.com/explore/screens/f13bce3f-3476-4662-aafb-02b2bcecffc9
- visual: tabla con encabezados y una sola fila centrada en mayúscula chica "this endpoint has not received any messages".
- patrón que resuelve: el vacío dentro de la tabla mantiene la estructura visible.

**qué adaptar a caudal:**
- carga rápida (quick add) como gemini: segmented gasto/ingreso en pill, monto enorme en mono con prefijo $, montos y categorías rápidas en pills, botón pill.
- ia financiera: input grande con brillo rojo muy suave alrededor y chips de preguntas (chronicle + v0).
- estados vacíos mínimos: ícono lineal en círculo, una frase, una salida (midday). dentro de tablas, la fila vacía centrada (clerk).
- en vacío, los números siguen en su lugar en $0 (wise).

---

## conclusiones para el sistema v3

1. **dark primero, casi negro**, cards apenas más claras y bordes casi invisibles. el claro es blanco puro con bordes grises (gemini).
2. **un brillo rubí** arriba de la página y detrás de los momentos clave (login, input de ia). ese es el toque adiamantado. el rojo pleno queda para el botón nuevo, lo activo y la atención.
3. **tres voces tipográficas**: serif para títulos de página y momentos (cosmos, origin, midday), geist sans para la interfaz, geist mono para cifras y labels.
4. **navegación arriba** con tabs pill y dock flotante en mobile (gemini, fey). sin sidebar.
5. **forma pill**: botones, inputs, tabs, chips y selectores redondeados al máximo. cards de radio grande (16-20px).
6. **inicio como diario**: prosa + capital + feed en dos columnas (fey).
7. **tablas oscuras densas** con resumen arriba y avatar por fila (mercury, fey).
8. **gráficos de línea fina** con el valor actual en el eje (fey, uniswap).

## componentes (21st.dev)

igual que en la v2: el catálogo carga sin cuenta, pero el registro de shadcn de 21st.dev (`/r/<autor>/<componente>`) responde 403 "authentication required". se siguen usando las primitivas propias del repo (radix + tailwind, patrón shadcn), rediseñadas.
