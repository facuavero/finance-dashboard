// diamante 3D de la landing. talla brillante (mesa, estrellas, cometas, cintura, pabellón) con reflejos de un entorno de paneles,
// una cara interna espejada y una externa transmisiva con dispersión, más destellos en cruz. se carga solo en el navegador.
import * as THREE from 'three'

type V = [number, number, number]

function gemGeometry(): THREE.BufferGeometry {
  const ring = (n: number, r: number, y: number, off = 0): V[] => Array.from({ length: n }, (_, i) => [Math.cos(off + (i * 2 * Math.PI) / n) * r, y, Math.sin(off + (i * 2 * Math.PI) / n) * r])
  const G = ring(16, 1, 0) // cintura
  const T = ring(8, 0.58, 0.34) // mesa
  const S = ring(8, 0.8, 0.2, Math.PI / 8) // puntas de las estrellas
  const M = ring(8, 0.58, -0.4) // pabellón
  const C: V = [0, -0.88, 0]
  const inside: V = [0, -0.2, 0]
  const pos: number[] = []
  const tri = (a: V, b: V, c: V) => {
    // todas las caras apuntan hacia afuera: si la normal mira al centro, se invierte
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2]
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]
    const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
    const cx = (a[0] + b[0] + c[0]) / 3 - inside[0], cy = (a[1] + b[1] + c[1]) / 3 - inside[1], cz = (a[2] + b[2] + c[2]) / 3 - inside[2]
    const flip = n[0] * cx + n[1] * cy + n[2] * cz < 0
    for (const p of flip ? [a, c, b] : [a, b, c]) pos.push(...p)
  }
  const mod = (i: number, n: number) => ((i % n) + n) % n
  for (let i = 1; i < 7; i++) tri(T[0], T[i], T[i + 1]) // mesa
  for (let i = 0; i < 8; i++) {
    const i1 = mod(i + 1, 8)
    tri(T[i], T[i1], S[i]) // estrella
    tri(T[i], S[mod(i - 1, 8)], G[2 * i]) // cometa
    tri(T[i], G[2 * i], S[i])
    tri(S[i], G[2 * i], G[2 * i + 1]) // cintura superior
    tri(S[i], G[2 * i + 1], G[mod(2 * i + 2, 16)])
    tri(C, M[i], G[2 * i + 1]) // facetas principales del pabellón
    tri(C, G[2 * i + 1], M[i1])
    tri(M[i], G[2 * i], G[2 * i + 1]) // cintura inferior
    tri(M[i1], G[2 * i + 1], G[mod(2 * i + 2, 16)])
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.computeVertexNormals() // sin índices: normales por cara, se ve facetado
  return g
}

/** entorno de estudio: fondo oscuro con paneles blancos y rosados. los destellos del diamante salen de acá */
function studio(renderer: THREE.WebGLRenderer): THREE.Texture {
  const s = new THREE.Scene()
  s.background = new THREE.Color(0x050506)
  const panel = (w: number, h: number, color: number, k: number, p: V) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }))
    m.position.set(...p)
    m.lookAt(0, 0, 0)
    s.add(m)
  }
  panel(7, 2, 0xffffff, 9, [0, 6, 2])
  panel(2, 8, 0xffffff, 7, [-6, 0, 3])
  panel(2, 8, 0xffe6ec, 6, [6, 1, -2])
  panel(5, 1.2, 0xff4d6d, 8, [3, -4, 4])
  panel(3, 3, 0xffffff, 5, [0, 1, 7])
  panel(1.2, 6, 0xff8aa0, 6, [-4, -2, -5])
  panel(4, 1, 0xffffff, 6, [0, -6, -3])
  panel(3, 2, 0xffffff, 7, [5, -3, 5])
  panel(2, 4, 0xff8aa0, 7, [-5, -3, 3])
  panel(5, 1.5, 0xffffff, 6, [0, -4, 6])
  panel(2, 5, 0xffffff, 6, [-3, 3, -6])
  panel(1.5, 5, 0xff4d6d, 7, [4, 2, 5])
  const pm = new THREE.PMREMGenerator(renderer)
  const tex = pm.fromScene(s, 0.015).texture
  pm.dispose()
  return tex
}

function starTexture(): THREE.Texture {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const x = c.getContext('2d')!
  const glow = x.createRadialGradient(64, 64, 0, 64, 64, 30)
  glow.addColorStop(0, 'rgba(255,255,255,1)')
  glow.addColorStop(0.25, 'rgba(255,200,215,0.55)')
  glow.addColorStop(1, 'rgba(255,120,150,0)')
  x.fillStyle = glow
  x.fillRect(0, 0, 128, 128)
  for (const [len, w] of [[62, 3], [34, 2]] as const) {
    for (const rot of [0, Math.PI / 2]) {
      x.save()
      x.translate(64, 64)
      x.rotate(rot + (len === 34 ? Math.PI / 4 : 0))
      const l = x.createLinearGradient(-len, 0, len, 0)
      l.addColorStop(0, 'rgba(255,255,255,0)')
      l.addColorStop(0.5, 'rgba(255,255,255,1)')
      l.addColorStop(1, 'rgba(255,255,255,0)')
      x.fillStyle = l
      x.fillRect(-len, -w / 2, len * 2, w)
      x.restore()
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** monta el diamante en `host`. devuelve la función que lo desmonta. lanza si el navegador no tiene WebGL */
export function mountGem(host: HTMLElement): () => void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.3
  renderer.setClearColor(0x000000, 0)
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%'
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const env = studio(renderer)
  scene.environment = env
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50)
  camera.position.set(0, 0.2, 7.2)

  const geo = gemGeometry()
  // cara interna: espejo con otro giro del entorno, es lo que "se ve adentro"
  const inner = new THREE.MeshStandardMaterial({ color: 0xffc2cf, metalness: 1, roughness: 0.03, side: THREE.BackSide, flatShading: true, envMapIntensity: 2.6 })
  // cara externa: vidrio de índice alto (2,4) con dispersión
  const outer = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0, transmission: 1, thickness: 1.4, ior: 2.4, dispersion: 0.6, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0, flatShading: true, envMapIntensity: 2.2, attenuationColor: new THREE.Color(0xffd9e0), attenuationDistance: 3 })
  const pivot = new THREE.Group()
  pivot.add(new THREE.Mesh(geo, inner), new THREE.Mesh(geo, outer))
  pivot.scale.setScalar(1.45)
  scene.add(pivot)

  const key = new THREE.DirectionalLight(0xffffff, 3)
  key.position.set(3, 5, 4)
  const rim = new THREE.PointLight(0xff4d6d, 60, 0, 2)
  rim.position.set(-3.5, -1, 3)
  scene.add(key, rim)

  // destellos en cruz que aparecen y se apagan alrededor de la piedra
  const tex = starTexture()
  const sparks = Array.from({ length: 7 }, (_, i) => {
    const mat = new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, transparent: true, depthTest: false, depthWrite: false, opacity: 0 })
    const sp = new THREE.Sprite(mat)
    sp.renderOrder = 10
    scene.add(sp)
    return { sp, mat, period: 1.8 + (i % 4) * 0.55, phase: i * 0.83, seed: i * 7.13 }
  })
  const place = (s: (typeof sparks)[number], n: number) => {
    // punto al azar sobre la piedra, del lado de la cámara
    const a = Math.sin(s.seed + n * 12.9898) * 43758.5453
    const b = Math.sin(s.seed * 1.7 + n * 78.233) * 12345.6789
    const th = (a - Math.floor(a)) * Math.PI * 2
    const r = 0.25 + (b - Math.floor(b)) * 0.95
    s.sp.position.set(Math.cos(th) * r * 1.2, Math.sin(th) * r * 1.15 + 0.15, 1.2)
    s.sp.scale.setScalar(0.5 + ((a * 3) % 1 + 1) % 1 * 0.55)
  }

  const resize = () => {
    const w = host.clientWidth || 1
    const h = host.clientHeight || 1
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  const draw = (t: number) => {
    const spin = reduce ? 0.6 : t * 0.55
    pivot.rotation.set(0.42 + Math.sin(t * 0.6) * (reduce ? 0 : 0.06), spin, Math.sin(t * 0.4) * (reduce ? 0 : 0.04))
    pivot.position.y = reduce ? 0 : Math.sin(t * 1.1) * 0.06
    inner.envMapRotation.y = -spin * 0.8 + 1
    rim.position.set(Math.cos(t * 0.9) * -3.5, Math.sin(t * 0.7) * 1.5, 3)
    for (const s of sparks) {
      const k = (t + s.phase) / s.period
      const f = k - Math.floor(k)
      const life = f < 0.35 ? Math.sin((f / 0.35) * Math.PI) : 0
      if (Math.floor(k) !== (s as { last?: number }).last) {
        ;(s as { last?: number }).last = Math.floor(k)
        place(s, Math.floor(k))
      }
      s.mat.opacity = reduce ? 0 : life
      s.mat.rotation = f * 1.2
    }
    renderer.render(scene, camera)
  }

  resize()
  const ro = new ResizeObserver(() => {
    resize()
    if (reduce) draw(0)
  })
  ro.observe(host)

  let raf = 0
  let visible = true
  const t0 = performance.now()
  const loop = () => {
    raf = 0
    if (!visible || document.hidden) return
    draw((performance.now() - t0) / 1000)
    raf = requestAnimationFrame(loop)
  }
  const kick = () => {
    if (!raf && !reduce) raf = requestAnimationFrame(loop)
  }
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting
    kick()
  })
  io.observe(host)
  document.addEventListener('visibilitychange', kick)
  if (reduce) draw(0)
  else kick()

  return () => {
    cancelAnimationFrame(raf)
    visible = false
    io.disconnect()
    ro.disconnect()
    document.removeEventListener('visibilitychange', kick)
    geo.dispose()
    inner.dispose()
    outer.dispose()
    tex.dispose()
    for (const s of sparks) s.mat.dispose()
    env.dispose()
    renderer.dispose()
    renderer.domElement.remove()
  }
}
