// una animación de entrada por cada cambio de pantalla (el template se vuelve a montar en cada navegación)
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>
}
