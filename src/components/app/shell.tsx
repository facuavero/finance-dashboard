'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { Command } from 'cmdk'
import * as D from '@radix-ui/react-dialog'
import {
  ArrowLeftRight, Bell, CalendarDays, ChartColumn, Droplets, Eye, EyeOff, LayoutDashboard, LogOut, Menu as MenuIcon, Moon, PiggyBank, Plug, Plus, Search,
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
      { href: '/configuracion', label: 'Configuración', icon: Settings },
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

function NavLink({ item, badge, onNavigate }: { item: NavItem; badge?: number; onNavigate?: () => void }) {
  const pathname = usePathname()
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn('group flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] transition-colors', active ? 'bg-surface font-medium text-fg shadow-[0_0_0_1px_var(--border)]' : 'text-fg-2 hover:bg-surface-2 hover:text-fg')}
    >
      <Icon className={cn('size-4 shrink-0', active ? 'text-accent' : 'text-muted group-hover:text-fg-2')} aria-hidden />
      <span className="flex-1 truncate">{item.label}</span>
      {badge ? <span className="num rounded-full bg-critical px-1.5 text-[11px] leading-[18px] font-semibold text-white">{badge}</span> : null}
    </Link>
  )
}

function NavList({ alertCount, onNavigate }: { alertCount: number; onNavigate?: () => void }) {
  return (
    <nav aria-label="Principal" className="space-y-5">
      {NAV.map((g) => (
        <div key={g.group}>
          <p className="label-caps mb-1.5 px-2.5 !text-[10px]">{g.group}</p>
          <div className="space-y-0.5">
            {g.items.map((i) => (
              <NavLink key={i.href} item={i} badge={i.href === '/alertas' ? alertCount : undefined} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}

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
    <div className="min-h-dvh lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2">
        Saltar al contenido
      </a>

      {/* sidebar desktop */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border px-3 py-4 lg:flex">
        <Link href="/inicio" className="px-2.5">
          <Logo />
        </Link>
        <Button onClick={() => quick.open()} className="mt-5 w-full justify-start" size="md">
          <Plus /> Nuevo movimiento
          <kbd className="ml-auto rounded border border-white/20 px-1.5 font-mono text-[11px] opacity-70">N</kbd>
        </Button>
        <div className="mt-5 flex-1 overflow-y-auto scrollbar-thin">
          <NavList alertCount={alertCount} />
        </div>
        <Menu>
          <MenuTrigger className="mt-3 flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-surface-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-fg text-[11px] font-semibold text-bg">{initials}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium">{user.name}</span>
              <span className="block truncate text-[12px] text-muted">{user.email}</span>
            </span>
          </MenuTrigger>
          <MenuContent align="start" side="top">
            <MenuItem asChild>
              <Link href="/configuracion">
                <Settings /> Configuración
              </Link>
            </MenuItem>
            <MenuItem asChild>
              <Link href="/privacidad">
                <ShieldCheck /> Privacidad y datos
              </Link>
            </MenuItem>
            <MenuSeparator />
            <MenuItem onSelect={() => logoutAction()}>
              <LogOut /> Cerrar sesión
            </MenuItem>
          </MenuContent>
        </Menu>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-bg/90 px-4 backdrop-blur-sm sm:px-6">
          <Link href="/inicio" className="lg:hidden" aria-label="Inicio">
            <Logo withText={false} />
          </Link>
          <button onClick={() => setCmdOpen(true)} className="ml-1 flex h-9 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-3 text-[13px] text-muted hover:border-border-strong sm:max-w-sm lg:ml-0">
            <Search className="size-4 shrink-0" aria-hidden />
            <span className="truncate">Buscar o ir a…</span>
            <kbd className="ml-auto hidden rounded border border-border px-1.5 font-mono text-[11px] sm:inline">⌘K</kbd>
          </button>
          <div className="ml-auto flex items-center gap-0.5">
            <Tip content={privacy ? 'Mostrar montos' : 'Ocultar montos (modo privacidad)'}>
              <Button variant="ghost" size="icon" onClick={togglePrivacy} aria-pressed={privacy} aria-label={privacy ? 'Mostrar montos' : 'Ocultar montos'}>
                {privacy ? <EyeOff /> : <Eye />}
              </Button>
            </Tip>
            <Tip content={dark ? 'Modo claro' : 'Modo oscuro'}>
              <Button variant="ghost" size="icon" onClick={toggleDark} aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}>
                {dark ? <Sun /> : <Moon />}
              </Button>
            </Tip>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label={`Alertas${alertCount ? `: ${alertCount} activas` : ''}`}>
                  <Bell />
                  {alertCount > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-critical ring-2 ring-bg" aria-hidden />}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[340px] p-0">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold">Alertas</p>
                  <Link href="/alertas" className="text-[13px] text-accent hover:underline">
                    Ver todas
                  </Link>
                </div>
                {alerts.length ? (
                  <ul className="max-h-[360px] divide-y divide-border overflow-y-auto">
                    {alerts.slice(0, 5).map((a) => (
                      <li key={a.key}>
                        <Link href={a.href} className="flex gap-3 px-4 py-3 hover:bg-surface-2">
                          <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', a.severity === 'critical' ? 'bg-critical' : a.severity === 'warning' ? 'bg-warning-mark' : a.severity === 'positive' ? 'bg-positive' : 'bg-accent')} aria-hidden />
                          <span className="min-w-0">
                            <span className="block text-[13px] font-medium">{a.title}</span>
                            <span className="money mt-0.5 block text-[12px] text-muted">{a.body}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-8 text-center text-[13px] text-muted">No hay alertas. Todo en orden.</p>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </header>

        <main id="contenido" className="mx-auto w-full max-w-[1240px] flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pb-12">
          {children}
        </main>
      </div>

      {/* navegación mobile */}
      <nav aria-label="Principal móvil" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {[
          { href: '/inicio', label: 'Inicio', icon: LayoutDashboard },
          { href: '/movimientos', label: 'Movimientos', icon: ArrowLeftRight },
        ].map((i) => (
          <MobileTab key={i.href} {...i} active={pathname.startsWith(i.href)} />
        ))}
        <button onClick={() => quick.open()} className="flex cursor-pointer flex-col items-center justify-center" aria-label="Nuevo movimiento">
          <span className="flex size-11 items-center justify-center rounded-full bg-fg text-bg shadow-md">
            <Plus className="size-5" />
          </span>
        </button>
        <MobileTab href="/ia" label="IA" icon={Sparkles} active={pathname.startsWith('/ia')} />
        <D.Root open={moreOpen} onOpenChange={setMoreOpen}>
          <D.Trigger className="flex cursor-pointer flex-col items-center justify-center gap-0.5 py-2 text-[11px] text-muted">
            <MenuIcon className="size-5" aria-hidden />
            Más
          </D.Trigger>
          <D.Portal>
            <D.Overlay className="fixed inset-0 z-50 bg-black/40 animate-in" />
            <D.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-border bg-bg p-4 pb-8 animate-slide-up">
              <D.Title className="sr-only">Menú</D.Title>
              <D.Description className="sr-only">Todas las secciones</D.Description>
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border-strong" />
              <NavList alertCount={alertCount} onNavigate={() => setMoreOpen(false)} />
              <button onClick={() => logoutAction()} className="mt-5 flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] text-critical hover:bg-surface-2">
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

function MobileTab({ href, label, icon: Icon, active }: { href: string; label: string; icon: LucideIcon; active: boolean }) {
  return (
    <Link href={href} aria-current={active ? 'page' : undefined} className={cn('flex flex-col items-center justify-center gap-0.5 py-2 text-[11px]', active ? 'text-fg' : 'text-muted')}>
      <Icon className={cn('size-5', active && 'text-accent')} aria-hidden />
      {label}
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
        <D.Overlay className="fixed inset-0 z-50 bg-black/40 animate-in" />
        <D.Content className="fixed top-[12vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-surface shadow-2xl animate-slide-up">
          <D.Title className="sr-only">Buscar</D.Title>
          <D.Description className="sr-only">Navegá o buscá movimientos</D.Description>
          <Command label="Buscar" className="[&_[cmdk-group-heading]]:label-caps [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1">
            <div className="flex items-center gap-2 border-b border-border px-3">
              <Search className="size-4 text-muted" aria-hidden />
              <Command.Input autoFocus placeholder="Ir a una sección o buscar un movimiento…" className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted" />
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
    <Command.Item onSelect={onSelect} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-surface-2">
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
      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-surface-2"
    >
      <Search className="size-4 text-muted" aria-hidden /> Buscar en movimientos
    </Command.Item>
  )
}
