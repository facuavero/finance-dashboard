// compila la landing estática: public/landing/landing.css (Tailwind sobre index.html) y public/landing/gem.js (diamante 3D).
// uso: node scripts/landing/build.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import postcss from 'postcss'
import tailwind from '@tailwindcss/postcss'
import { build } from 'esbuild'

process.env.NODE_ENV = 'production'
const from = 'scripts/landing/landing.css'
const css = await postcss([tailwind({ optimize: { minify: true } })]).process(readFileSync(from, 'utf8'), { from, to: 'public/landing/landing.css' })
writeFileSync('public/landing/landing.css', css.css)

await build({ entryPoints: ['scripts/landing/gem.ts'], outfile: 'public/landing/gem.js', bundle: true, minify: true, format: 'esm', target: 'es2020', legalComments: 'none' })
await build({ entryPoints: ['scripts/landing/landing.js'], outfile: 'public/landing/landing.js', bundle: false, minify: true, target: 'es2020', legalComments: 'none' })
console.log('landing lista')
