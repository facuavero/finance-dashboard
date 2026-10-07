'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { Command } from 'cmdk'
import * as D from '@radix-ui/react-dialog'
import {
  ArrowLeftRight, Bell, CalendarDays, ChartColumn, ChevronDown, Droplets, Eye, EyeOff, LayoutDashboard, LogOut, Menu as MenuIcon, Moon, PiggyBank, Plug, Plus, Search,
  Settings, ShieldCheck, Sparkles, Sun, Target, Telescope, type LucideIcon,
} from 'lucide-react'
import { Logo } from './logo'
import { useQuickAdd } from './quick-add'
import { Button } from '@/components/ui/button'
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger, Popover, PopoverContent, PopoverTrigger, Tip } from '@/components/ui/misc'
import { cn } from '@/lib/utils'
import { logoutAction } from '@/modules/auth/actions'

type NavItem = { href: string; label: string; icon: LucideIcon }
export const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'General',
    items: [
      { href: '/inicio', label: 'Inicio', icon: LayoutDashboard },
      { href: '/movimientos', label: 'Movimientos', icon: ArrowLeftRight },
      { href: '/presupuestos', label: 'Presupuestos', icon: PiggyBank },
      { href: '/objetivos', label: 'Objetivos', icon: Target },
    ],
  },
  {
    group: 'Análisis',
    items: [
      { href: '/estadisticas', label: 'Estadísticas', icon: ChartColumn },
      { href: '/fugas', label: 'Fugas de dinero', icon: Droplets },
      { href: '/proyeccion', label: 'Proyección', icon: Telescope },
      { href: '/ia', label: 'IA financiera', icon: Sparkles },
    ],
  },
  {
    group: 'Agenda',
    items: [
      { href: '/calendario', label: 'Calendario', icon: CalendarDays },
      { href: '/alertas', label: 'Alertas', icon: Bell },
    ],
  },
  {
    group: 'Cuenta',
    items: [
      { href: '/integraciones', label: 'Integraciones', icon: Plug },
      { href: '/privacidad', label: 'Privacidad', icon: ShieldCheck },
      { href: '/configuracion', label: 'Settings', icon: Settings },
    ],
  },
]

export type ShellAlert = { key: string; title: string; body: string; href: string; severity: 'critical' | 'warning' | 'info' | 'positive' }

// la clase en <html> es la fuente de verdad (la pone el script de arranque antes de pintar)
function subscribeHtmlClass(cb: () => void) {
  const obs = new MutationObserver(cb)
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => obs.disconnect()
}

function useToggleClass(cls: string, storageKey: string, onValue: string) {
  const on = useSyncExternalStore(subscribeHtmlClass, () => document.documentElement.classList.contains(cls), () => false)
  const toggle = () => {
    const next = !document.documentElement.classList.contains(cls)
    document.documentElement.classList.toggle(cls, next)
    try {
      localStorage.setItem(storageKey, next ? onValue : cls === 'dark' ? 'light' : '0')
    } catch {}
  }
  return [on, toggle] as const
}

const PRIMARY = NAV[0].items
const GROUPED = [NAV[1], NAV[2]]
const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`)

/** tab pill de la barra superior (gemini). la activa lleva fondo y texto en tinta */
function TopTab({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const active = isActive(pathname, item.href)
  return (
    <Link href={item.href} aria-current={active ? 'page' : undefined} className={cn('flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[13.5px] transition-colors', active ? 'bg-surface-3 font-medium text-fg' : 'text-muted hover:text-fg')}>
      {item.label}
    </Link>
  )
}

/** menú desplegable de la barra (análisis, agenda) */
function TopMenu({ group, alertCount }: { group: (typeof NAV)[number]; alertCount: number }) {
  const pathname = usePathname()
  const active = group.items.some((i) => isActive(pathname, i.href))
  return (
    <Menu>
      <MenuTrigger className={cn('flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-[13.5px] outline-none transition-colors data-[state=open]:text-fg', active ? 'bg-surface-3 font-medium text-fg' : 'text-muted hover:text-fg')}>
        {group.group}
        {group.group === 'Agenda' && alertCount > 0 && <span className="num rounded-full bg-accent-solid px-1.5 text-[10px] leading-4 font-semibold text-on-accent">{alertCount}</span>}
        <ChevronDown className="size-3.5 opacity-60" aria-hidden />
      </MenuTrigger>
      <MenuContent align="start" className="w-60">
        {group.items.map((i) => (
          <MenuItem key={i.href} asChild className={cn(isActive(pathname, i.href) && 'bg-surface-2')}>
            <Link href={i.href}>
              <i.icon /> {i.label}
              {i.href === '/alertas' && alertCount > 0 && <span className="num ml-auto rounded-full bg-accent-solid px-1.5 text-[11px] leading-[18px] font-semibold text-on-accent">{alertCount}</span>}
            </Link>
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  )
}

/** lista completa para el sheet "más" del dock mobile */
function NavList({ alertCount, onNavigate }: { alertCount: number; onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Principal" className="space-y-5">
      {NAV.map((g) => (
        <div key={g.group}>
          <p className="label-caps mb-2 px-1 !text-[10px]">{g.group}</p>
          <div className="grid grid-cols-2 gap-2">
            {g.items.map((i) => {
              const active = isActive(pathname, i.href)
              return (
                <Link key={i.href} href={i.href} onClick={onNavigate} aria-current={active ? 'page' : undefined} className={cn('flex items-center gap-2.5 rounded-2xl border px-3 py-3 text-[13.5px]', active ? 'border-border-strong bg-surface-2 font-medium' : 'border-border bg-surface')}>
                  <i.icon className={cn('size-4 shrink-0', active ? 'text-accent' : 'text-muted')} aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{i.label}</span>
                  {i.href === '/alertas' && alertCount > 0 ? <span className="num rounded-full bg-accent-solid px-1.5 text-[11px] leading-[18px] font-semibold text-on-accent">{alertCount}</span> : null}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}

const iconBtn = 'flex size-9 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-fg [&_svg]:size-[18px]'

export function Shell({ user, alerts, alertCount, children }: { user: { name: string; email: string }; alerts: ShellAlert[]; alertCount: number; children: React.ReactNode }) {
  const quick = useQuickAdd()
  const [dark, toggleDark] = useToggleClass('dark', 'caudal-theme', 'dark')
  const [privacy, togglePrivacy] = useToggleClass('privacy', 'caudal-privacy', '1')
  const [cmdOpen, setCmdOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmdOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const initials = user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-dvh">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2">
        Saltar al contenido
      </a>

      {/* barra superior: sin sidebar, el contenido gana todo el ancho (gemini) */}
      <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-2 px-4 sm:px-6 lg:px-8">
          <Link href="/inicio" aria-label="Caudal, inicio" className="shrink-0">
            <Logo />
          </Link>
          <nav aria-label="Principal" className="ml-6 hidden items-center gap-0.5 rounded-full border border-border bg-surface/60 p-1 lg:flex">
            {PRIMARY.map((i) => (
              <TopTab key={i.href} item={i} />
            ))}
            {GROUPED.map((g) => (
              <TopMenu key={g.group} group={g} alertCount={alertCount} />
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-0.5">
            <button onClick={() => setCmdOpen(true)} className="flex h-9 cursor-pointer items-center gap-2 rounded-full px-2.5 text-[13px] text-muted transition-colors hover:bg-surface-2 hover:text-fg xl:border xl:border-border xl:pr-2 xl:pl-3.5" aria-label="Buscar (⌘K)">
              <Search className="size-[18px] xl:size-4" aria-hidden />
              <span className="hidden xl:inline">Buscar</span>
              <kbd className="hidden rounded-full border border-border px-1.5 font-mono text-[10px] xl:inline">⌘K</kbd>
            </button>
            <Tip content={privacy ? 'Mostrar montos' : 'Ocultar montos (modo privacidad)'}>
              <button className={iconBtn} onClick={togglePrivacy} aria-pressed={privacy} aria-label={privacy ? 'Mostrar montos' : 'Ocultar montos'}>
                {privacy ? <EyeOff /> : <Eye />}
              </button>
            </Tip>
            <Tip content={dark ? 'Modo claro' : 'Modo oscuro'}>
              <button className={iconBtn} onClick={toggleDark} aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}>
                {dark ? <Sun /> : <Moon />}
              </button>
            </Tip>
            <Popover>
              <PopoverTrigger asChild>
                <button className={cn(iconBtn, 'relative')} aria-label={`Alertas${alertCount ? `: ${alertCount} activas` : ''}`}>
                  <Bell />
                  {alertCount > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-accent-solid ring-2 ring-bg" aria-hidden />}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[360px] p-0">
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <p className="display text-[22px]">Alertas</p>
                  <Link href="/alertas" className="text-[13px] text-accent hover:underline">
                    Ver todas
                  </Link>
                </div>
                {alerts.length ? (
                  <ul className="max-h-[360px] overflow-y-auto px-1.5 pb-1.5">
                    {alerts.slice(0, 5).map((a) => (
                      <li key={a.key}>
                        <Link href={a.href} className="flex gap-3 rounded-xl px-2.5 py-2.5 hover:bg-surface-2">
                          <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', a.severity === 'critical' ? 'bg-accent-solid' : a.severity === 'warning' ? 'bg-warning-mark' : 'bg-muted')} aria-hidden />
                          <span className="min-w-0">
                            <span className="block text-[13px] font-medium">{a.title}</span>
                            <span className="money mt-0.5 block text-[12px] text-muted">{a.body}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 pt-4 pb-8 text-center text-[13px] text-muted">No hay alertas. Todo en orden.</p>
                )}
              </PopoverContent>
            </Popover>
            <Button variant="accent" size="sm" onClick={() => quick.open()} className="mx-1.5 hidden sm:inline-flex">
              <Plus /> Nuevo
              <kbd className="rounded-full bg-white/15 px-1.5 font-mono text-[10px]">N</kbd>
            </Button>
            <Menu>
              <MenuTrigger className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-surface-3 text-[11px] font-semibold text-fg outline-none ring-offset-2 ring-offset-bg hover:ring-2 hover:ring-border-strong" aria-label={`Cuenta de ${user.name}`}>
                {initials}
              </MenuTrigger>
              <MenuContent align="end" className="w-60">
                <div className="px-3 pt-2 pb-2.5">
                  <p className="truncate text-[13px] font-medium">{user.name}</p>
                  <p className="truncate text-[12px] text-muted">{user.email}</p>
                </div>
                <MenuSeparator />
                {NAV[3].items.map((i) => (
                  <MenuItem key={i.href} asChild>
                    <Link href={i.href}>
                      <i.icon /> {i.label}
                    </Link>
                  </MenuItem>
                ))}
                <MenuSeparator />
                <MenuItem onSelect={() => logoutAction()}>
                  <LogOut /> Cerrar sesión
                </MenuItem>
              </MenuContent>
            </Menu>
          </div>
        </div>
      </header>

      <main id="contenido" className="mx-auto w-full max-w-[1240px] px-4 pt-8 pb-32 sm:px-6 lg:px-8 lg:pt-10 lg:pb-16">
        {children}
      </main>

      {/* mobile: dock flotante (fey) */}
      <nav aria-label="Principal móvil" className="fixed bottom-[max(12px,env(safe-area-inset-bottom))] left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border-strong bg-surface/90 p-1.5 shadow-2xl shadow-black/40 backdrop-blur-md lg:hidden">
        <DockItem href="/inicio" label="Inicio" icon={LayoutDashboard} active={pathname.startsWith('/inicio')} />
        <DockItem href="/movimientos" label="Movimientos" icon={ArrowLeftRight} active={pathname.startsWith('/movimientos')} />
        <button onClick={() => quick.open()} className="mx-1 flex size-12 cursor-pointer items-center justify-center rounded-full bg-accent-solid text-on-accent shadow-[0_0_24px_-4px_var(--glow-strong)]" aria-label="Nuevo movimiento">
          <Plus className="size-5" />
        </button>
        <DockItem href="/ia" label="IA" icon={Sparkles} active={pathname.startsWith('/ia')} />
        <D.Root open={moreOpen} onOpenChange={setMoreOpen}>
          <D.Trigger className="flex size-11 cursor-pointer items-center justify-center rounded-full text-muted" aria-label="Más secciones">
            <MenuIcon className="size-5" aria-hidden />
          </D.Trigger>
          <D.Portal>
            <D.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] animate-in" />
            <D.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-border-strong bg-bg p-4 pb-8 animate-slide-up">
              <D.Title className="display mb-4 text-[28px]">Secciones</D.Title>
              <D.Description className="sr-only">Todas las secciones</D.Description>
              <NavList alertCount={alertCount} onNavigate={() => setMoreOpen(false)} />
              <button onClick={() => logoutAction()} className="mt-5 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-border-strong text-[14px] text-fg-2">
                <LogOut className="size-4" /> Cerrar sesión
              </button>
            </D.Content>
          </D.Portal>
        </D.Root>
      </nav>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} onNew={() => quick.open()} />
    </div>
  )
}

function DockItem({ href, label, icon: Icon, active }: { href: string; label: string; icon: LucideIcon; active: boolean }) {
  return (
    <Link href={href} aria-current={active ? 'page' : undefined} aria-label={label} className={cn('flex size-11 items-center justify-center rounded-full transition-colors', active ? 'bg-surface-3 text-fg' : 'text-muted')}>
      <Icon className="size-5" aria-hidden />
    </Link>
  )
}

function CommandPalette({ open, onOpenChange, onNew }: { open: boolean; onOpenChange: (v: boolean) => void; onNew: () => void }) {
  const router = useRouter()
  const go = (href: string) => {
    onOpenChange(false)
    router.push(href)
  }
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] animate-in" />
        <D.Content className="glow-ring fixed top-[12vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-3xl bg-surface animate-slide-up">
          <D.Title className="sr-only">Buscar</D.Title>
          <D.Description className="sr-only">Navegá o buscá movimientos</D.Description>
          <Command label="Buscar" className="[&_[cmdk-group-heading]]:label-caps [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1">
            <div className="flex items-center gap-2 border-b border-border px-4">
              <Search className="size-4 text-muted" aria-hidden />
              <Command.Input autoFocus placeholder="Ir a una sección o buscar un movimiento…" className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted" />
            </div>
            <Command.List className="max-h-[360px] overflow-y-auto p-1.5">
              <Command.Empty className="px-3 py-6 text-center text-[13px] text-muted">Sin resultados.</Command.Empty>
              <Command.Group heading="Acciones">
                <PaletteItem
                  onSelect={() => {
                    onOpenChange(false)
                    onNew()
                  }}
                  icon={Plus}
                  label="Nuevo movimiento"
                  hint="N"
                />
                <PaletteItem onSelect={() => go('/inicio?asistente=1')} icon={Sparkles} label="Cargar con el asistente de IA" />
                <PaletteItem onSelect={() => go('/movimientos?importar=1')} icon={ArrowLeftRight} label="Importar movimientos (CSV)" />
                <PaletteItem onSelect={() => go('/presupuestos?nuevo=1')} icon={PiggyBank} label="Crear presupuesto" />
                <PaletteItem onSelect={() => go('/objetivos?nuevo=1')} icon={Target} label="Crear objetivo" />
              </Command.Group>
              {NAV.map((g) => (
                <Command.Group key={g.group} heading={g.group}>
                  {g.items.map((i) => (
                    <PaletteItem key={i.href} onSelect={() => go(i.href)} icon={i.icon} label={i.label} />
                  ))}
                </Command.Group>
              ))}
              <Command.Group heading="Buscar">
                <SearchTxnItem go={go} />
              </Command.Group>
            </Command.List>
          </Command>
        </D.Content>
      </D.Portal>
    </D.Root>
  )
}

function PaletteItem({ onSelect, icon: Icon, label, hint }: { onSelect: () => void; icon: LucideIcon; label: string; hint?: string }) {
  return (
    <Command.Item onSelect={onSelect} className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm data-[selected=true]:bg-surface-2">
      <Icon className="size-4 text-muted" aria-hidden />
      {label}
      {hint && <kbd className="ml-auto rounded border border-border px-1.5 font-mono text-[11px] text-muted">{hint}</kbd>}
    </Command.Item>
  )
}

function SearchTxnItem({ go }: { go: (href: string) => void }) {
  // cmdk no expone el texto buscado fuera del input: se lee del DOM
  return (
    <Command.Item
      value="buscar en movimientos"
      forceMount
      onSelect={() => {
        const q = (document.querySelector('[cmdk-input]') as HTMLInputElement | null)?.value ?? ''
        go(`/movimientos${q ? `?q=${encodeURIComponent(q)}` : ''}`)
      }}
      className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm data-[selected=true]:bg-surface-2"
    >
      <Search className="size-4 text-muted" aria-hidden /> Buscar en movimientos
    </Command.Item>
  )
}
