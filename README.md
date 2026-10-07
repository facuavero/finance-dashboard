# Caudal

centro de inteligencia financiera personal. no es un tracker de gastos: responde qué pasó con tu plata, por qué pasó, qué puede pasar y qué conviene hacer ahora.

- registro de gastos e ingresos en segundos (tecla `N`, monto primero, enter guarda)
- detección de microgastos, suscripciones, pagos recurrentes y anomalías
- presupuestos por categoría, período u objetivo con ritmo proyectado
- objetivos con aporte mensual recomendado y aviso de atraso
- predicción de saldo a fin de mes y capital a 6 meses, siempre marcando qué es real y qué es estimado
- simulador a 1, 3, 5 y 10 años con escenario pesimista y optimista
- ia gratuita (gemini o groq) que explica y prioriza recomendaciones calculadas con tus datos
- gmail y google calendar vía oauth (solo lectura) cruzados con tus movimientos
- centro de alertas priorizado y sin spam
- privacidad explícita: qué se guarda, qué ve la ia, exportar y borrar todo
- oscuro por defecto con modo claro, responsive, modo privacidad para ocultar montos

diseño basado en referencias reales de mobbin: ver [docs/referencias-diseño-finanzas-personales.md](docs/referencias-diseño-finanzas-personales.md) y [docs/propuesta-diseño.md](docs/propuesta-diseño.md). la landing pública (`/` sin sesión) sale de [docs/referencias-diseño-landing-caudal.md](docs/referencias-diseño-landing-caudal.md) y [docs/propuesta-landing.md](docs/propuesta-landing.md). el sistema visual actual (v3: oscuro por defecto, navegación arriba, serif + mono, acento rubí) sale de [docs/referencias-diseño-caudal-v3.md](docs/referencias-diseño-caudal-v3.md).

## correrlo

requiere node 20.9 o superior.

```bash
npm install
cp .env.example .env.local
# generá la clave para cifrar tokens y pegala en ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
npm run dev
```

abrí http://localhost:3000 y tocá **probar la demo**: crea un usuario con 6 meses de movimientos, presupuestos, objetivos y gmail/calendar de ejemplo, todo relativo a la fecha de hoy.

sin `DATABASE_URL` usa pglite: postgres embebido en `.data/pglite`, cero instalación. para producción poné un `DATABASE_URL` de postgres (neon, supabase, railway, rds). con pglite o postgres por tcp las migraciones corren solas al arrancar. con neon se corren a mano con `npm run db:migrate`.

## ia gratuita

alcanza con una clave. sin ninguna, todo funciona con el motor de reglas local.

| proveedor | dónde sacar la clave | variable |
|---|---|---|
| google gemini (free tier) | https://aistudio.google.com/apikey | `GEMINI_API_KEY` (modelo en `GEMINI_MODEL`) |
| groq (free tier) | https://console.groq.com/keys | `GROQ_API_KEY` (modelo en `GROQ_MODEL`) |

cómo se usa: el motor de análisis calcula todos los montos (microgastos, recurrentes, anomalías, presupuestos, objetivos, predicción). la ia recibe esos resultados ya calculados, redacta la explicación y ordena prioridades. los montos de impacto, la evidencia y los links quedan siempre los calculados; si devuelve recomendaciones con ids inventados, se descartan. lo que se envía se puede ver tal cual en **privacidad → ia**, y el usuario puede apagar la ia externa.

## gmail y google calendar

1. en https://console.cloud.google.com creá un proyecto y habilitá **gmail api** y **google calendar api**
2. pantalla de consentimiento oauth: agregá los scopes `gmail.readonly` y `calendar.readonly`
3. credenciales → id de cliente oauth → aplicación web
4. uri de redirección autorizada: `{APP_URL}/api/integrations/google/callback`
5. poné `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `ENCRYPTION_KEY` en `.env.local`

sin esas variables, integraciones funciona en modo demo con correos y eventos de ejemplo que pasan por el mismo parser que los reales.

detalles:
- solo lectura. gmail guarda asunto, remitente, fecha, monto y tipo, nunca el cuerpo. calendar guarda título, fechas y tipo.
- los correos sin monto ni fecha, y las promociones, se descartan: no se asume que cualquier correo es un gasto.
- tokens cifrados con aes-256-gcm. al desconectar se revocan en google y se borran junto con los hallazgos. los movimientos manuales nunca se tocan.
- la cuenta demo no permite conectar una cuenta real de google (es compartida).

## recuperación de contraseña

con `RESEND_API_KEY` manda el email por resend. sin eso, en desarrollo el link aparece en la pantalla y en la consola del servidor. en producción sin proveedor de email no se muestra.

## subirlo a cloudflare workers

usa el adaptador opennext. la base tiene que ser neon (postgres por http). pglite no anda en workers porque no hay disco.

1. creá una base en https://neon.tech y copiá la connection string (`postgres://...neon.tech/...?sslmode=require`)
2. corré las migraciones una vez: `DATABASE_URL="<tu string>" npm run db:migrate`
3. `npx wrangler login`
4. cargá los secretos (uno por comando): `npx wrangler secret put DATABASE_URL`, `ENCRYPTION_KEY`, `APP_URL` y, si los usás, `GEMINI_API_KEY`, `GROQ_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`
5. `npm run deploy`

si lo conectás desde el dashboard de cloudflare (workers builds): build command `npx opennextjs-cloudflare build`, deploy command `npx wrangler deploy`, y las variables del paso 4 en variables y secretos.

`npm run preview` lo corre en local con el runtime de workers. cuando cambie el esquema, repetí el paso 2 antes de deployar.

## arquitectura

```
src/
  app/                 rutas: (auth) públicas, (app) privadas, api/ para oauth
  proxy.ts             filtro rápido de rutas privadas (la validación real es en el servidor)
  db/                  esquema drizzle y cliente (pglite o postgres)
  modules/
    auth/              scrypt, sesiones en base (cookie httpOnly), recuperación, rate limit
    finance/           repositorios y server actions de movimientos, presupuestos, objetivos
    analytics/         funciones puras: resumen, microgastos, recurrentes, anomalías,
                       predicción, simulador, presupuestos, objetivos, estadísticas
    insights/          análisis combinado gmail + calendar + movimientos
    alerts/            motor de alertas: prioridad, agrupado, descartar y posponer
    integrations/      oauth de google, sync, parser de correos y eventos, cifrado
    ai/                proveedores gratuitos + reglas + caché de reportes
    privacy/ settings/ acciones de datos y preferencias
    demo/              generador determinístico de datos de ejemplo
  components/          ui (primitivas radix), charts (recharts), bloques de la app
drizzle/               migraciones sql
```

- `analytics` no toca base ni red: recibe datos y devuelve datos. está cubierto por tests.
- las integraciones escriben en su propia tabla (`integration_items`). desconectar no afecta datos manuales.
- cada consulta filtra por usuario. las server actions validan con zod.

## scripts

```bash
npm run dev         # desarrollo
npm run build       # build de producción
npm start           # servir el build
npm test            # tests del motor de análisis (vitest)
npm run typecheck
npm run lint
npm run db:generate # nueva migración después de cambiar src/db/schema.ts
```

## límites conocidos

- el rate limit es en memoria: con varias instancias conviene moverlo a redis o postgres.
- movimientos filtra en el cliente. anda bien con miles de filas; con decenas de miles conviene paginar en el servidor.
- moneda única (ars). multi-moneda está en el esquema pero no en la interfaz.
- la detección de gmail usa reglas en español e inglés. correos muy atípicos pueden no detectarse.
