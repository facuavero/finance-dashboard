import Link from 'next/link'
import { Ban, Check, Eye, KeyRound, ListChecks, Lock, Plus, Search, Sparkles, TrendingUp, type LucideIcon } from 'lucide-react'
import { Gem, Logo } from '@/components/app/logo'
import { EstimateTag } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DemoButton } from './demo-button'
import { Features, Recommendation, SUGGESTED_QUESTIONS } from './features'
import { HeroGem } from './hero-gem'
import { ProductPreview } from './preview'
import { Reveal } from './reveal'

// landing pública. base: docs/propuesta-landing.md y docs/referencias-diseño-landing-caudal.md

const NAV = [
  { href: '#funciones', label: 'Funciones' },
  { href: '#ia', label: 'IA' },
  { href: '#privacidad', label: 'Privacidad' },
  { href: '#preguntas', label: 'Preguntas' },
]

// hechos verificables del producto, nunca métricas de uso (titan: fila de datos en mono)
const FACTS = [
  { label: 'Precio', value: '$0' },
  { label: 'Claves bancarias que pedimos', value: '0' },
  { label: 'Gmail y Calendar', value: 'solo lectura' },
  { label: 'Simulador', value: 'hasta 10 años' },
]

const QUESTIONS: { n: string; icon: LucideIcon; title: string; body: string; estimate?: boolean }[] = [
  { n: '01', icon: Eye, title: 'Qué pasó', body: 'Capital, ingresos, gastos y ahorro del mes, comparados con el mes pasado a la misma altura.' },
  { n: '02', icon: Search, title: 'Por qué pasó', body: 'Las categorías que más movieron, los microgastos que se repiten y los gastos fuera de lo normal.' },
  { n: '03', icon: TrendingUp, title: 'Qué puede pasar', body: 'Saldo a fin de mes, pagos que se vienen y hacia dónde va tu capital en los próximos 6 meses.', estimate: true },
  { n: '04', icon: ListChecks, title: 'Qué conviene hacer', body: 'Recomendaciones con prioridad, la acción concreta y cuánto impactan en pesos por mes y por año.' },
]

const AI_STEPS = [
  { title: 'Calcula', body: 'Microgastos, recurrentes, anomalías, presupuestos, objetivos y predicción. Con tus movimientos, en código.' },
  { title: 'Explica', body: 'Gemini o Groq, en su plan gratuito, redactan y ordenan por prioridad. Sin clave, un motor de reglas local. Siempre dice cuál usó.' },
  { title: 'Vos decidís', body: 'Cada recomendación trae qué hacer y cuánto impacta. Nada se ejecuta solo. Si la IA devuelve algo que no está en tus datos, se descarta.' },
]

const TIMELINE = [
  { when: 'Hoy', title: 'Arrancás', items: ['Creás tu cuenta gratis o entrás a la demo', 'Cargás tu saldo actual', 'Primer gasto con la tecla N'] },
  { when: 'Primera semana', title: 'Le das contexto', items: ['Cargás lo que gastás o importás un CSV', 'Armás presupuestos y objetivos', 'Si querés, conectás Gmail y Calendar'] },
  { when: 'Primer mes', title: 'Te empieza a leer', items: ['Detecta pagos recurrentes y microgastos', 'Te avisa si un presupuesto se va de ritmo', 'Estima cómo cerrás el mes y qué conviene hacer'] },
]

const PRIVACY: { icon: LucideIcon; title: string; body: React.ReactNode }[] = [
  {
    icon: Lock,
    title: 'Solo lectura',
    body: (
      <>
        Gmail y Calendar se conectan con <code className="font-mono text-[12px]">gmail.readonly</code> y <code className="font-mono text-[12px]">calendar.readonly</code>. De cada correo se guarda asunto, remitente, fecha, monto y tipo. Nunca el cuerpo.
      </>
    ),
  },
  { icon: KeyRound, title: 'Cifrado y bajo tu control', body: 'Los tokens de Google se guardan cifrados con AES-256-GCM. Al desconectar se revocan y se borran los hallazgos. Tus movimientos cargados a mano no se tocan.' },
  { icon: Sparkles, title: 'Sabés qué ve la IA', body: 'Recibe resultados ya calculados y, de correos y eventos, solo título corto, fecha, monto y tipo. En Privacidad ves lo que se envía tal cual, y la apagás con un switch.' },
]

const DOES_NOT = ['No te pide la clave del banco.', 'No mueve plata ni hace pagos.', 'No guarda el contenido de tus correos.', 'No presenta una estimación como dato: lo estimado dice estimado.', 'No te ata: exportás todo o borrás la cuenta cuando quieras.']

const FAQ = [
  { q: '¿Cuánto cuesta?', a: 'Nada. Crear la cuenta y usarla es gratis. La IA usa el plan gratuito de Gemini o Groq, y sin clave funciona igual con el motor de reglas local.' },
  { q: '¿Es un banco o una billetera?', a: 'No. Caudal no guarda ni mueve dinero. Es una herramienta para entender tus números y decidir mejor.' },
  { q: '¿Tengo que conectar mi banco?', a: 'No. Cargás los movimientos a mano (monto primero, Enter guarda) o importás un CSV. Gmail y Calendar son opcionales y de solo lectura.' },
  { q: '¿Qué ve la IA de mis datos?', a: 'Resultados ya calculados: montos, categorías, fechas y tipo. De correos y eventos, solo un título corto. Nunca el cuerpo de un correo. Podés ver exactamente qué se envía y apagarla.' },
  { q: '¿Qué tan precisas son las predicciones?', a: 'Son estimaciones hechas con tu historial y tus pagos recurrentes, y siempre están marcadas como estimado. Cuanto más cargás, mejor estiman.' },
  { q: '¿Qué moneda usa?', a: 'Pesos argentinos.' },
  { q: '¿Puedo borrar todo?', a: 'Sí. Desde Privacidad exportás tus datos o borrás la cuenta con todo lo asociado. Desconectar Google revoca el acceso en el momento.' },
  { q: '¿Qué es la cuenta demo?', a: 'Una cuenta compartida con 6 meses de movimientos, presupuestos, objetivos, Gmail y Calendar de ejemplo, todo relativo a hoy. Sirve para ver cómo responde Caudal sin cargar nada. No se puede conectar una cuenta real de Google ahí.' },
]

function SectionHead({ label, title, body, className }: { label: string; title: React.ReactNode; body?: React.ReactNode; className?: string }) {
  return (
    <Reveal className={cn('max-w-[640px]', className)}>
      <p className="label-caps">{label}</p>
      <h2 className="display mt-4 text-[40px] sm:text-[56px]">{title}</h2>
      {body && <p className="mt-4 text-[17px] text-fg-2">{body}</p>}
    </Reveal>
  )
}

function Ctas({ demo, className }: { demo: boolean; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2.5 sm:flex-row', className)}>
      {demo ? (
        <DemoButton />
      ) : (
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/registro">Crear cuenta gratis</Link>
        </Button>
      )}
      <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
        {demo ? <Link href="/registro">Crear cuenta gratis</Link> : <Link href="/login">Iniciar sesión</Link>}
      </Button>
    </div>
  )
}

export function Landing({ demo }: { demo: boolean }) {
  return (
    <div className="min-h-dvh overflow-x-clip">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2">
        Saltar al contenido
      </a>

      {/* header: producto a la izquierda, acción a la derecha (current) */}
      <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1160px] items-center gap-6 px-4 sm:px-6">
          <Link href="/" aria-label="Caudal, inicio">
            <Logo />
          </Link>
          <nav aria-label="Secciones" className="hidden items-center gap-0.5 rounded-full border border-border bg-surface/60 p-1 text-[13.5px] text-muted md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="rounded-full px-3.5 py-1.5 transition-colors hover:bg-surface-3 hover:text-fg">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/registro">Crear cuenta</Link>
            </Button>
          </div>
        </div>
      </header>

      <main id="contenido">
        {/* hero: titular + ctas, y el producto ocupa más pantalla que el texto (titan, midday) */}
        <section className="relative mx-auto max-w-[1160px] px-4 pt-14 sm:px-6 sm:pt-24">
          {/* el diamante vive arriba a la derecha, detrás del texto */}
          <HeroGem className="absolute top-0 right-[-40px] hidden size-[300px] md:block lg:top-2 lg:right-[-86px] lg:size-[420px]" />
          <p className="label-caps relative animate-rise">Inteligencia financiera personal</p>
          <h1 className="display relative mt-5 text-[52px] leading-[0.98] sm:text-[72px] md:text-[88px] lg:text-[104px]">
            <span className="block animate-rise [animation-delay:120ms]">Dejá de anotar gastos.</span>
            <span className="block animate-rise text-muted italic [animation-delay:260ms]">Empezá a entenderlos.</span>
          </h1>
          <div className="relative mt-6 grid gap-6 lg:mt-8 lg:grid-cols-2 lg:items-end lg:gap-16">
            <p className="max-w-[560px] animate-rise text-[17px] leading-relaxed text-fg-2 [animation-delay:420ms]">Caudal te dice qué pasó con tu plata, por qué pasó, qué puede pasar y qué conviene hacer ahora. Con tus números, no con promedios de internet.</p>
            <div className="animate-rise lg:justify-self-end [animation-delay:540ms]">
              <Ctas demo={demo} />
              <p className="mt-3 text-[13px] text-muted">{demo ? 'Sin tarjeta y sin conectar el banco. La demo trae 6 meses de movimientos de ejemplo.' : 'Gratis. Sin tarjeta y sin conectar el banco.'}</p>
            </div>
          </div>

          <figure className="mt-12 animate-rise [animation-delay:700ms] sm:mt-16">
            <ProductPreview />
            <figcaption className="mt-3 text-center text-[12px] text-muted">El inicio de la cuenta demo. Lo estimado siempre dice estimado.</figcaption>
          </figure>

          <dl className="mt-10 grid grid-cols-2 border-t border-border sm:mt-14 lg:grid-cols-4">
            {FACTS.map((f, i) => (
              <div key={f.label} className={cn('border-border py-5 pr-4', i % 2 === 1 && 'border-l pl-4 lg:pl-6', i >= 2 && 'border-t lg:border-t-0', i === 2 && 'lg:border-l lg:pl-6')}>
                <dt className="label-caps">{f.label}</dt>
                <dd className="mt-2 font-figure text-[20px] font-medium tracking-[-0.02em] sm:text-[26px]">{f.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* las 4 preguntas: cadena de datos a acción (dovetail), numeradas como la figura de mercury */}
        <section aria-labelledby="preguntas-clave" className="mt-16 border-y border-border bg-surface sm:mt-24">
          <div className="mx-auto max-w-[1160px] px-4 py-16 sm:px-6 sm:py-24">
            <SectionHead label="Qué hace distinto" title={<span id="preguntas-clave">Cada pantalla responde cuatro preguntas.</span>} body="Un tracker te muestra en qué gastaste. Caudal sigue de largo." />
            <ol className="mt-10 grid gap-px overflow-hidden rounded-card border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {QUESTIONS.map(({ n, icon: Icon, title, body, estimate }, qi) => (
                <li key={n} className="bg-surface">
                  <Reveal delay={qi * 90} className="flex h-full flex-col p-5">
                  <div className="flex items-center justify-between">
                    <span className="flex size-9 items-center justify-center rounded-full bg-surface-2">
                      <Icon className="size-4 text-fg-2" aria-hidden />
                    </span>
                    <span className="font-mono text-[12px] text-muted">{n}</span>
                  </div>
                  <h3 className="display mt-8 flex items-center gap-2 text-[28px]">
                    {title} {estimate && <EstimateTag />}
                  </h3>
                  <p className="mt-2 text-[14px] text-fg-2">{body}</p>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* funciones con fragmentos de ui (mercury, ramp) */}
        <section id="funciones" className="mx-auto max-w-[1160px] scroll-mt-16 px-4 py-16 sm:px-6 sm:py-24">
          <SectionHead label="Funciones" title="Hecho para usarse todos los días." body="Cargar te lleva segundos. Lo demás lo calcula Caudal." />
          <Reveal className="mt-10">
            <Features />
          </Reveal>
        </section>

        {/* ia: motor → explicación → vos (dovetail), con una recomendación real (hex) y preguntas sugeridas (midday) */}
        <section id="ia" className="scroll-mt-16 border-y border-border bg-surface">
          <div className="mx-auto grid max-w-[1160px] gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
            <div>
              <SectionHead label="IA financiera" title="La IA explica. Las cuentas las hace Caudal." body="Los montos salen de tus movimientos, calculados con código. La IA solo los pone en palabras y ordena qué conviene hacer primero." />
              <ol className="mt-8 divide-y divide-border border-y border-border">
                {AI_STEPS.map((s, i) => (
                  <li key={s.title} className="flex gap-4 py-4">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-2 font-mono text-[12px] text-fg-2">{i + 1}</span>
                    <div>
                      <h3 className="text-[15px] font-medium">{s.title}</h3>
                      <p className="mt-0.5 text-[14px] text-fg-2">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="space-y-4">
              <Recommendation />
              <div className="rounded-card border border-border bg-bg p-4" aria-hidden>
                <div className="flex items-center gap-2">
                  <span className="flex h-11 flex-1 items-center rounded-full bg-surface-2 px-4 text-[14px] text-muted">Preguntale a Caudal sobre tu plata…</span>
                  <span className="flex size-11 items-center justify-center rounded-full bg-fg text-bg">
                    <Sparkles className="size-4" />
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <span key={q} className="rounded-full bg-surface-2 px-3 py-1.5 text-[12px] text-fg-2">
                      {q}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-[13px] text-muted">Ejemplo real de la cuenta demo. Lo que se manda a la IA se ve tal cual en Privacidad, y la podés apagar.</p>
            </div>
          </div>
        </section>

        {/* cómo arranca: línea de tiempo con nota honesta (ramp, fruitful) */}
        <section aria-labelledby="como-arranca" className="mx-auto max-w-[1160px] px-4 py-16 sm:px-6 sm:py-24">
          <SectionHead label="Cómo arranca" title={<span id="como-arranca">Empezás en un minuto.</span>} body="Y cuanto más cargás, mejor te lee." />
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {TIMELINE.map((t, i) => (
              <li key={t.when} className="relative">
                <Reveal delay={i * 120}>
                <div className="flex items-center gap-3">
                  <span className={cn('size-2.5 rounded-full border-2', i === 0 ? 'border-accent-solid bg-accent-solid' : 'border-border-strong bg-bg')} aria-hidden />
                  <span className="rounded-full border border-border-strong px-3 py-1 font-mono text-[11px] tracking-[0.04em] text-fg-2 uppercase">{t.when}</span>
                  {i < TIMELINE.length - 1 && <span className="hidden h-px flex-1 bg-border md:block" aria-hidden />}
                </div>
                <div className="mt-4 rounded-card border border-border bg-surface p-5">
                  <h3 className="display text-[28px]">{t.title}</h3>
                  <ul className="mt-3 space-y-2">
                    {t.items.map((item) => (
                      <li key={item} className="flex gap-2 text-[14px] text-fg-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-positive" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                </Reveal>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-[13px] text-muted italic">Recorrido de ejemplo. Los tiempos dependen de cuánto cargues.</p>
        </section>

        {/* privacidad con evidencia literal (cohere) y lo que no hace (titan) */}
        <section id="privacidad" className="scroll-mt-16 border-y border-border bg-surface">
          <div className="mx-auto max-w-[1160px] px-4 py-16 sm:px-6 sm:py-24">
            <SectionHead label="Privacidad" title="Tus datos, a la vista. Y tuyos." body="Qué se guarda, qué ve la IA y cómo borrarlo. Sin letra chica." />
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {PRIVACY.map(({ icon: Icon, title, body }, pi) => (
                <Reveal key={title} delay={pi * 110}>
                  <span className="flex size-10 items-center justify-center rounded-full border border-border bg-bg">
                    <Icon className="size-[18px] text-fg-2" aria-hidden />
                  </span>
                  <h3 className="display mt-5 text-[28px]">{title}</h3>
                  <p className="mt-2 text-[14px] text-fg-2">{body}</p>
                </Reveal>
              ))}
            </div>
            <div className="mt-12 grid gap-6 border-t border-border pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
              <h3 className="display text-[36px]">Lo que Caudal no hace</h3>
              <ul className="divide-y divide-border border-y border-border">
                {DOES_NOT.map((d) => (
                  <li key={d} className="flex items-center gap-3 py-3 text-[15px]">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-2">
                      <Ban className="size-3.5 text-fg-2" aria-hidden />
                    </span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* faq en 2 columnas (origin), con las preguntas incómodas (slash, cash app). acordeón nativo, anda sin js */}
        <section id="preguntas" className="mx-auto grid max-w-[1160px] scroll-mt-16 gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <SectionHead label="Preguntas" title="Preguntas frecuentes" body="¿No está la tuya? La demo la responde más rápido." />
          </div>
          <div className="divide-y divide-border border-y border-border">
            {FAQ.map((f) => (
              <details key={f.q} name="faq" className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[17px] font-medium [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2 transition-colors group-open:bg-accent-solid group-open:text-on-accent">
                    <Plus className="size-4 transition-transform duration-200 group-open:rotate-45" aria-hidden />
                  </span>
                </summary>
                <p className="-mt-1 pr-8 pb-5 text-[15px] text-fg-2">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* cierre: una frase y la misma acción (mercury) */}
        <section className="relative overflow-hidden border-t border-border">
          <div className="pointer-events-none absolute top-1/2 left-1/2 size-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,var(--glow-strong),transparent)]" aria-hidden />
          <div className="relative mx-auto flex max-w-[1160px] flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-32">
            <Gem className="size-14" />
            <h2 className="display mt-6 max-w-[720px] text-[48px] sm:text-[72px]">Mirá tu mes con otros ojos.</h2>
            <p className="mt-4 text-[17px] text-fg-2">{demo ? 'Entrá a la demo y fijate qué te diría Caudal.' : 'Creá tu cuenta y cargá tu primer gasto.'}</p>
            <Ctas demo={demo} className="mt-7 w-full justify-center sm:w-auto" />
          </div>
        </section>
      </main>

      {/* footer: links y qué no es (ramp, mercury, cash app) */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-[1160px] px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Logo />
              <p className="mt-2 text-[13px] text-muted">Inteligencia financiera personal.</p>
            </div>
            <nav aria-label="Pie de página" className="flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-fg-2">
              <Link href="/login" className="hover:text-fg">
                Iniciar sesión
              </Link>
              <Link href="/registro" className="hover:text-fg">
                Crear cuenta
              </Link>
              <a href="#privacidad" className="hover:text-fg">
                Privacidad
              </a>
              <a href="#preguntas" className="hover:text-fg">
                Preguntas
              </a>
            </nav>
          </div>
          <div className="mt-8 border-t border-border pt-6">
            <p className="max-w-[720px] text-[12px] text-muted">Caudal no es un banco, una billetera ni un asesor financiero. No guarda ni mueve dinero. Las proyecciones y recomendaciones son estimaciones calculadas con los datos que cargás.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
