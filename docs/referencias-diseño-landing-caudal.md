# referencias de diseño: landing de caudal

fuente: mobbin.com, sección **sites** (landing pages reales cortadas por sección), navegado con chromium headless el 2026-10-07. sin login.
el patrón `/explore/web/screens/landing-page` ya no existe (404). lo que anda sin cuenta: `/explore/sites/categories/finance`, `/explore/sites/sections/<tipo>` y el detalle de cada sección (`/explore/sections/<id>`). las listas cortan el scroll con el muro de "log in or join for free", pero alcanza: la categoría finance muestra 60 secciones y cada tipo de sección unas 60 más.

se listaron unas 600 secciones, se abrieron 54 y se analizaron con captura 44. las imágenes no se suben al repo (son de mobbin). cada referencia tiene su link.

apps que más aportan: mercury, midday, origin, ramp, titan, fruitful, cash app, hex.

---

## 1. personal finance / fintech app landing pages

### origin · hero
- link: https://mobbin.com/explore/sections/8f04ae13-2a06-4368-8224-4c133eb6ba06
- visual: foto aérea de bosque a pantalla completa, titular centrado enorme en serif con la primera palabra en itálica ("*solve* your greatest..."). nav flotante translúcida con links en mono mayúscula y tracking. cta blanco "get a demo →" en mono. abajo, dos laureles de premios (forbes, fast company).
- patrón que resuelve: mono mayúscula para nav y botones da tono "herramienta seria" sin ser frío. el subtítulo dice exactamente qué cubre ("budgeting, taxes, equity comp") en una línea.
- ojo: la foto de stock no muestra el producto. para nosotros no sirve.

### titan · hero
- link: https://mobbin.com/explore/sections/5e0d4910-5a39-4fa3-ae69-df856ef207a9
- visual: blanco con líneas guía verticales finas que arman una grilla visible. izquierda: chip "new" naranja + link, titular grande en grotesca ("wealth managed from the palm of your hand"), botón pill negro "join titan →" en mono y link secundario "see why ▶". derecha: ilustración en grabado blanco y negro. abajo, fila de 3 datos en mono ($1.1b, 0.4%, 10) con label gris arriba.
- patrón que resuelve: hero partido en dos con una fila de datos duros abajo. los números en mono se leen como "hechos", no como marketing. un solo cta primario y uno secundario de texto.

### current · hero
- link: https://mobbin.com/explore/sections/763c860b-0eb9-48ef-950c-4d63bc3935bd
- visual: blanco total, nav con links a la izquierda, logo al centro, "get started" pill negro a la derecha. titular centrado de 2 líneas, subtítulo de una frase, foto grande de una persona con el teléfono.
- patrón que resuelve: titular de 4 palabras + subtítulo de 7. cero ruido. la nav separa "producto" (izquierda) de "acción" (derecha).

### jeton · hero
- link: https://mobbin.com/explore/sections/0b95529f-32e7-4a3a-a24d-33950e75b984
- visual: fondo rojo naranja saturado de marca, titular blanco gigante abajo a la izquierda ("clear fees, secure limits"), foto chica arriba a la derecha, bajada corta abajo a la derecha. selector de idioma y "log in" en outline, "sign up" blanco.
- patrón que resuelve: el titular promete transparencia ("clear fees") que es lo primero que pregunta alguien con plata en juego.
- ojo: el color de marca a sangre grita. caudal es sobrio, no copia esto.

### parker · hero
- link: https://mobbin.com/explore/sections/6b6ee642-ed8b-4109-9d8e-49e28a83a4a1
- visual: dos cards redondeadas lado a lado sobre gris cálido. izquierda blanca con chip negro "join +1000 scaling businesses", titular grotesca + itálica serif, texto que rota ("treasury" en gradiente) e input de email con botón azul "get started →". derecha: tarjeta física en 3d sobre gradiente azul a naranja.
- patrón que resuelve: input de email dentro del hero (registro en un paso). barra de anuncio arriba descartable.
- ojo: gradiente y glass, justo lo que nuestra propuesta descarta.

**qué adaptar a caudal:**
- hero sobrio sobre el fondo de la app (`--bg`), titular grande en geist con tracking negativo, sin foto de stock (origin y current venden con foto, caudal vende con producto).
- label chico en mono mayúscula arriba del titular (origin, titan). ya es el `label-caps` de la app.
- un cta primario negro y uno secundario (titan). en vez de "see why" el secundario es "crear cuenta gratis" y el primario es la demo (ver categoría 2).
- fila de hechos en mono debajo del hero (titan), pero con datos verificables del producto, nunca métricas de negocio inventadas.
- titular que promete lo que caudal hace distinto: no anota, explica (equivalente al "clear fees" de jeton).

---

## 2. hero section + signup cta (free trial, demo, waitlist)

### mercury · cta "powerful banking. simplified finances."
- link: https://mobbin.com/explore/sections/254b0eb2-65c8-440f-b3e3-a80cfd51012e
- visual: fondo lavanda muy claro, titular centrado de 2 líneas en grotesca fina, dos botones pill: "open account" relleno índigo y "explore demo" en outline. debajo, laptop con el dashboard real de la demo ("hi, george", saldo $2,128,967, gráfico de área, barra superior "welcome to the mercury demo").
- patrón que resuelve: **explorar la demo sin registrarse** como cta par del registro. el mockup muestra la misma demo a la que lleva el botón: lo que ves es lo que te llevás.

### mercury · cta "let banking power your financial operations"
- link: https://mobbin.com/explore/sections/16c55a93-735f-47d3-9b05-8fae754b1cac
- visual: izquierda titular + bajada + botón pill lavanda "explore demo ↗". derecha diagrama de líneas finas (círculos superpuestos numerados 01 a 07: banking, treasury, bill pay...) rotulado "figure a".
- patrón que resuelve: diagrama de módulos numerados en línea fina como alternativa a una ilustración. explica que todo gira alrededor de un centro.

### mercury · cta de cierre
- link: https://mobbin.com/explore/sections/c8611da2-7fcd-4182-bd63-1f233d5713e6
- visual: banda gris cálido, una frase centrada en 2 líneas y un solo botón pill índigo "open account". nada más.
- patrón que resuelve: el cierre más corto posible. una frase y una acción.

### parker · cta "ready to join the financial revolution?"
- link: https://mobbin.com/explore/sections/176f7b46-5b02-4559-8af0-377de853630d
- visual: card ancha con gradiente azul a naranja, titular blanco grotesca + itálica serif, dos párrafos, botón blanco "apply now →". tarjetas en 3d a la derecha.
- patrón que resuelve: repetir el cta dentro de una card que corta el ritmo de la página.
- ojo: el copy épico ("revolution") no va con caudal.

### fluz · cta "get started"
- link: https://mobbin.com/explore/sections/40a00b69-5908-4ff1-ae1f-054ad98ab002
- visual: ilustración pintada a pantalla completa con objetos 3d flotando, titular condensado blanco, una frase ("fluz is free to join and open to everyone") y botón pill blanco.
- patrón que resuelve: decir "gratis y abierto a todos" justo antes del botón. baja la fricción de la última decisión.

### public · cta "get a 1% match when you transfer"
- link: https://mobbin.com/explore/sections/f87d4ef0-8d48-41dd-89ed-d75c57898e1b
- visual: negro, titular serif blanco con segunda línea en azul, botón pill azul con glow, laptop + teléfono con el portafolio real (línea verde, tabla de activos).
- patrón que resuelve: el producto en desktop y mobile juntos en la misma imagen: avisa que anda en los dos sin decirlo.

**qué adaptar a caudal:**
- el cta principal es **"probar la demo"**: un click, sin formulario, entra a la cuenta demo con 6 meses de datos (mercury "explore demo"). el secundario es "crear cuenta gratis".
- debajo de los botones, una línea de fricción cero: "sin tarjeta, sin conectar el banco" (fluz).
- el preview del hero muestra exactamente lo que la demo va a mostrar (mercury). nada inventado que no exista en la app.
- cierre al final de la página: una frase + los mismos dos botones (mercury c8611da2). sin gradientes ni copy épico.

---

## 3. product showcase / dashboard preview on landing

### midday · hero con dashboard
- link: https://mobbin.com/explore/sections/f90385f7-2714-4775-a5ec-d2128e94d2cf
- visual: blanco, titular serif chico a la izquierda ("run your business finances without manual work"), botón negro rectangular a la derecha con nota gris "14-day free trial. cancel anytime." debajo, screenshot enorme del producto sobre un fondo de grano gris: "morning viktor", grilla de cards con resúmenes escritos en prosa ("your average profit during 6 months is $1,450.50"), y abajo un input con sugerencias "i want to know what changed in my cash flow this week".
- patrón que resuelve: el producto ocupa más pantalla que el texto. cada card del dashboard es una frase, no un número suelto. la ia aparece como input con preguntas sugeridas.

### mercury · features "speed without compromise"
- link: https://mobbin.com/explore/sections/10a4163f-942e-4c7f-8ed0-9b3e714f91d9
- visual: lavanda claro. arriba fila: texto + testimonio a la izquierda, componente real de transferencia (monto grande, selects de cuenta, botón) a la derecha. abajo dos cards con un fragmento de ui real arriba y título + bajada + chip-link abajo.
- patrón que resuelve: en vez de screenshots completos, **fragmentos de ui recortados** (un formulario, una tarjeta). cada feature se demuestra con el componente que la resuelve.

### mercury · features "just one part of mercury's full financial platform"
- link: https://mobbin.com/explore/sections/539c4090-e9d6-4bd2-9ff9-656e8d1ac13c
- visual: grilla 3x2 de cards lavanda. cada una con un mini mock arriba (lista de cuentas, donut 75/25, alertas "receipt required", monto $9.6m con barra), título, 2 líneas y botón circular de flecha.
- patrón que resuelve: mostrar 6 módulos con el mismo esqueleto. el mini mock es mínimo: 2 o 3 elementos, no una pantalla entera.

### ramp · product suite
- link: https://mobbin.com/explore/sections/bc483029-6ba0-43c1-b8b8-902ad8297853
- visual: blanco, label gris mayúscula "ramp product suite", titular grande, bajada. grilla 4x2 de filas: ícono en cuadrado gris + nombre chico gris + beneficio en negro de 2 líneas + flecha.
- patrón que resuelve: índice del producto escaneable en 5 segundos. nombre del módulo chico, beneficio grande ("expenses that submit themselves").

### ramp · how it works "in just 30 days"
- link: https://mobbin.com/explore/sections/9087cbfc-878f-4d76-9bfb-627ccfe536d6
- visual: línea de tiempo horizontal con 3 hitos en chips (today, day 5, day 30), debajo 3 cards con checklist de 3 ítems cada una. la última card tiene sombra (es el resultado).
- patrón que resuelve: baja la ansiedad de "cuánto laburo me va a dar". cada paso dice qué hacés y cuánto tarda.

### fruitful · how it works "your guide gets you on"
- link: https://mobbin.com/explore/sections/b6807166-b6b4-44f5-9040-1bfdf61ceb43
- visual: misma línea de tiempo (today, day 1, day 7, life), 4 cards con checks verdes, la primera rellena en verde. botón verde "get started" y nota en itálica "example onboarding journey, exact timing varies".
- patrón que resuelve: la nota de "los tiempos varían" es honesta y evita prometer de más.

### klarna · get started
- link: https://mobbin.com/explore/sections/d3b6543d-b83d-40e3-a72f-60caa7b86cc7
- visual: fondo crema, titular condensado negro, 3 cards blancas con ícono de línea, título en bold y 2 líneas.
- patrón que resuelve: 3 pasos, uno por card, verbos en imperativo.

### elevenlabs · dos plataformas
- link: https://mobbin.com/explore/sections/912fd71b-c79a-4f1e-8a6d-80946bb73de7
- visual: grilla con líneas guía, dos columnas de texto arriba, abajo una card gris con dos screenshots del producto superpuestos ("good morning, nev").
- patrón que resuelve: screenshots reales dentro de un marco gris con radio grande. el marco ordena aunque las pantallas sean densas.

**qué adaptar a caudal:**
- preview del hero = el inicio de la app (resumen en prosa + 4 kpis + gráfico real vs estimado + alertas), hecho con los mismos componentes y tokens, no una imagen. así respeta dark mode y no se desactualiza (midday + mercury).
- features con fragmentos de ui recortados: quick add con el monto primero, una fuga detectada, un presupuesto con ritmo, la proyección punteada (mercury 10a4163f + 539c4090).
- índice de módulos con ícono + nombre chico + beneficio grande (ramp suite).
- "cómo arranca" en línea de tiempo de 3 pasos con nota honesta de que depende de cuánto cargues (ramp + fruitful).
- en mobile el preview se simplifica: sin sidebar, cards apiladas.

---

## 4. ai features section

### hex · "a connected set of ai data workflows"
- link: https://mobbin.com/explore/sections/47d0fb2b-68ba-41dd-8df3-d26005c741f6
- visual: gris muy claro, titular negro + itálica serif. bloques alternados texto / screenshot. el segundo muestra un hilo de chat donde la respuesta trae: frase de resumen, lista de resultados con montos, y un gráfico de barras debajo. cita de un usuario con logo al lado de cada bloque.
- patrón que resuelve: la respuesta de la ia se muestra **con dato + lista + gráfico**, no como texto suelto. se ve que se apoya en números.

### dovetail · "see the platform in action"
- link: https://mobbin.com/explore/sections/563a9e2d-8159-402f-adb7-0b6869d9c1ae
- visual: negro, titular blanco grande, grilla de 3 columnas con íconos de línea blanca finos, título y 2 líneas grises. los títulos arman una progresión: "end-to-end intelligence", "from signals to strategy", "from insight to action".
- patrón que resuelve: contar la ia como **cadena: datos → análisis → acción**. justo las 4 preguntas de caudal.

### midday · input "i want to…"
- link: https://mobbin.com/explore/sections/f90385f7-2714-4775-a5ec-d2128e94d2cf
- visual: dentro del screenshot del hero, chips de atajos (revenue, expenses, time track) y tres sugerencias que completan "i want to know what changed in my cash flow this week / see which customers haven't paid yet / understand where we spent more than usual this month".
- patrón que resuelve: preguntas sugeridas en lenguaje natural enseñan qué puede hacer la ia sin explicarlo.

### cursor · "stay on the frontier"
- link: https://mobbin.com/explore/sections/e0720ea6-1a1a-4ae5-8f3e-826a10f8b9ae
- visual: crema cálido, 3 cards gris claro con título negro, bajada gris, link naranja con flecha y debajo una imagen de ui: selector de modelo (auto, gpt-5, gemini 2.5 pro, claude...), una pregunta con pasos de búsqueda en gris, una foto.
- patrón que resuelve: mostrar **qué modelo se usa** y los pasos que hizo la ia. transparencia como feature.

### clickup · "everything you need in one converged ai platform"
- link: https://mobbin.com/explore/sections/edaded65-c9b9-42df-8e5d-dc12d802c6e3
- visual: grilla de celdas con ícono + nombre que se desvanece hacia los bordes, 4 celdas centrales grandes con mini ui (projects, docs, brain, chat).
- patrón que resuelve: muestra amplitud (100+ features) sin listar 100 cosas. el fade lateral dice "y hay más".
- ojo: para caudal es demasiado. sirve la idea del fade, no la grilla.

### wispr flow · features
- link: https://mobbin.com/explore/sections/57b66fab-f7e0-4ea1-bec6-9f6ad9b91a59
- visual: gris oscuro, 4 cards con borde redondeado, ícono de línea de color, título serif centrado, 2 líneas. una de ellas "command mode with ai".
- patrón que resuelve: beneficios de ia en 3 palabras + una frase. sin jerga.

**qué adaptar a caudal:**
- sección ia como cadena de 3 pasos: el motor calcula con tus datos → la ia explica y prioriza → vos decidís (dovetail).
- mostrar una recomendación real con estructura fija: problema, explicación, acción, impacto en $ mensual y anual, prioridad. con el impacto marcado como "calculado por el motor, no por la ia" (hex: respuesta apoyada en números).
- chips de preguntas sugeridas ("¿en qué gasté más que el mes pasado?") como en midday.
- decir qué motor se usa (gemini, groq o reglas locales) y que se puede apagar (cursor muestra el modelo).
- tono sin humo: "ia que explica", no "ia que piensa por vos".

---

## 5. trust & security / privacy, faq y footer

### cohere · "safe. flexible. built for business."
- link: https://mobbin.com/explore/sections/34577db3-2a65-4847-9f63-07b6a95d5d31
- visual: blanco, titular de 3 frases cortas con punto. 3 columnas con ilustración geométrica de línea negra, título, 2 líneas y "learn more →".
- patrón que resuelve: seguridad contada en 3 bloques concretos (seguridad, dónde vive el dato, control). frases cortas con punto dan sensación de firmeza.

### lightdash · "what you can expect"
- link: https://mobbin.com/explore/sections/4322edbd-96a1-4373-911e-018857173e5d
- visual: grilla con bordes punteados, celdas con ícono pixel art, título y descripción. la celda de seguridad lleva los sellos soc2 y hipaa.
- patrón que resuelve: seguridad como una celda más de la grilla, con evidencia concreta (el sello).
- ojo: caudal no tiene certificaciones. la evidencia acá son los scopes literales y el cifrado, no sellos.

### titan · "our difference"
- link: https://mobbin.com/explore/sections/fc62a855-acf0-4977-ab82-73fc008daa8d
- visual: label mono chico, titular grande a la izquierda, lista a la derecha con separadores finos, ícono en círculo gris y una frase por ítem.
- patrón que resuelve: lista de diferenciales con separadores, escaneable. funciona igual en mobile.

### mercury · faq
- link: https://mobbin.com/explore/sections/46026716-c738-4271-9477-e80463e90f8d
- visual: lavanda claro, título centrado, chip "help center", acordeón angosto (600px) con separadores finos y chevron. la pregunta abierta tiene la línea de arriba más oscura.
- patrón que resuelve: acordeón angosto y centrado. la respuesta dice también qué **no** aceptan (honestidad sobre límites).

### origin · faq
- link: https://mobbin.com/explore/sections/1f1caf97-2f02-4668-bc84-05c7f760d6d2
- visual: card gris muy oscuro sobre negro. izquierda "*answers* to your questions" en serif con itálica. derecha, preguntas en cajitas con fondo apenas más claro, "+" que pasa a "×". una pregunta es "is my money secure with origin?".
- patrón que resuelve: faq en 2 columnas (título fijo a la izquierda, lista a la derecha). la pregunta de seguridad está en el faq, no escondida.

### slash · faq
- link: https://mobbin.com/explore/sections/47253673-e861-4941-8c05-e9cfae39fefb
- visual: negro, título serif centrado, subtítulo "don't see the answer you're looking for? get in touch.", grupo "general" y preguntas con chevron. respuestas con listas.
- patrón que resuelve: incluye "how does slash make money?". responder de qué vive el producto genera más confianza que cualquier sello.

### cash app · common questions
- link: https://mobbin.com/explore/sections/13a1b5d5-0446-4220-b05d-d7a94c61ad8f
- visual: blanco, preguntas en tipografía grande (28px) gris que se oscurece al abrir, "+" y "−" finos. 2 de 5 preguntas son de seguridad ("how does cash app keep my money safe?").
- patrón que resuelve: preguntas grandes, faq como sección de lectura y no como letra chica.

### titan · faqs y ramp · faq
- links:
  - https://mobbin.com/explore/sections/8345f01a-ff50-42af-898e-2c062d4f325c
  - https://mobbin.com/explore/sections/27bbba12-f19e-4d64-a4ae-d38eb4204f25
- visual: blanco, acordeón ancho con separadores, chevron en botón circular gris (titan) o cuadrado con borde (ramp). ramp agrupa por producto con un subtítulo y línea negra.
- patrón que resuelve: preguntas de costo, retiro y seguridad en lenguaje llano ("where are my funds stored?").

### fruitful · social proof
- link: https://mobbin.com/explore/sections/982b1525-0bb0-4133-891f-27a888d261e4
- visual: verde agua, badge trustpilot arriba, titular "join 3,000+ members", 4 cards de video con una frase de cada persona, botón "start your journey" y **disclaimer debajo: "these are current members we paid in cash for participating"**.
- patrón que resuelve: aclara que los testimonios son pagos. honestidad incluso en la prueba social.

### cash app · stats y ramp · stats
- links:
  - https://mobbin.com/explore/sections/d652d72b-1ecc-4c98-99dd-6b291657eca0
  - https://mobbin.com/explore/sections/13557a98-696e-456b-87af-a02a906d3e29
- visual: cash app: cita grande + 3 cajas con borde negro fino y un número gigante (4.8★, 9.9m+, 4.4★) con su fuente debajo. ramp: mosaico de cards con número grande + unidad chica + qué significa.
- patrón que resuelve: cada número tiene **fuente** debajo. un número sin fuente no se publica.

### ramp · footer
- link: https://mobbin.com/explore/sections/0addfde9-71dd-4ed4-b744-c5a713e64161
- visual: gris claro, 5 columnas de links chicos, banda con "join the 45,000+ businesses" + input de email + botón lima, luego legal largo en gris y badges de stores.
- patrón que resuelve: el footer repite el cta. el legal aclara qué es y qué no es ramp ("ramp is not a bank").

### mercury, cash app y varo · footer
- links:
  - https://mobbin.com/explore/sections/814ae25f-73e9-4b0d-91b4-af0267665c58
  - https://mobbin.com/explore/sections/6a949fdc-0731-45dd-b8ae-ecd5c4a4386d
  - https://mobbin.com/explore/sections/cd8689ac-0e23-4e17-93b5-983c1ee840b3
- visual: mercury y varo en oscuro con columnas de links muy chicos y bloque de disclaimers numerados. cash app en verde de marca con "control your cash", qr de descarga, links legales y "cash app is a financial services platform, not a bank".
- patrón que resuelve: los tres dicen **qué no son** en el footer. links a "security" y "privacy notice" siempre presentes.

**qué adaptar a caudal:**
- sección privacidad propia, no escondida: 3 bloques concretos (cohere) con evidencia real en vez de sellos que no tenemos: scopes literales `gmail.readonly` y `calendar.readonly`, cuerpo de los correos nunca guardado, tokens cifrados aes-256-gcm, qué ve la ia, exportar y borrar todo.
- lista de diferenciales con separadores e ícono en círculo (titan) para "qué no hace caudal": no pide la clave del banco, no mueve plata, no vende datos.
- faq en 2 columnas (origin) con acordeón nativo. incluye las preguntas incómodas: cuánto cuesta, de qué vive, es un banco, qué ve la ia, qué pasa si borro la cuenta (slash, cash app).
- **cero testimonios, logos de prensa ni métricas de usuarios**: caudal no los tiene y no se inventan (fruitful y cash app enseñan que cada número va con fuente). la prueba es la demo.
- footer chico: logo, links, y disclaimer de qué no es ("no es un banco ni un asesor financiero. las proyecciones son estimaciones") como mercury, ramp y cash app.

---

## conclusiones para la landing

1. **el producto es la prueba.** sin testimonios ni números inventados. el hero muestra el inicio de la app y el cta principal abre la demo en un click (mercury, midday).
2. **mismo sistema visual que la app**: grises, cards blancas con borde de 1px, un solo color (rojo rubí desde la v2 del sistema), botón primario en tinta, geist + geist mono para labels. la landing no puede prometer una estética que la app no tiene.
3. **titular que explica la diferencia**: caudal no anota gastos, responde 4 preguntas. esa estructura ordena la página (titan "our difference", dovetail).
4. **fragmentos de ui en vez de ilustraciones** para cada feature (mercury).
5. **ia contada como cadena con números calculados**: motor → explicación → acción (dovetail + hex). decir qué motor y que se apaga (cursor).
6. **privacidad con evidencia literal** (scopes, cifrado, qué se guarda) y faq con preguntas incómodas (cohere, slash, origin).
7. **real vs estimado** también en la landing: proyección punteada con leyenda.
8. **mobile first**: hero apilado, preview sin sidebar, cta full width, faq de una columna.
9. **dark mode** heredado de la app (clase `.dark`), sin imágenes que se rompan.

## componentes (21st.dev)

el catálogo carga sin cuenta (faqs: 191, heroes: 1152, features: 318, ctas: 501). pero el registro de shadcn de 21st.dev (`/r/<autor>/<componente>`) responde **403 "authentication required"** para cada componente probado (ln-dev7/faqs-01, ln-dev7/faqs-02, shadcnblockscom/faq-5). no se pudo bajar ninguno.

se usa lo que ya tiene el repo: primitivas propias con patrón shadcn (`button`, `card`, `badge`) y, para el faq, `<details>`/`<summary>` nativo (accesible sin javascript, mismo resultado que el "two-column faq" de ln-dev7 descrito en el registro).
