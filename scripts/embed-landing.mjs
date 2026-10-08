// copia public/landing/index.html a un módulo para que la ruta "/" lo sirva sin leer disco (en Workers no hay fs).
// corre solo antes de dev y build (ver package.json). el archivo generado no se commitea.
import { readFileSync, writeFileSync } from 'node:fs'

const html = readFileSync('public/landing/index.html', 'utf8')
writeFileSync('src/app/landing.generated.ts', `// generado por scripts/embed-landing.mjs. no editar\nexport default ${JSON.stringify(html)}\n`)
