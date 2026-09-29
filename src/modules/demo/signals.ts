import { type ISODate, addDays } from '@/modules/analytics/dates'
import type { RawEmail, RawEvent } from '@/modules/integrations/parse'

// correos y eventos de ejemplo. pasan por el mismo parser que los reales.

const dm = (d: ISODate) => `${Number(d.slice(8, 10))}/${Number(d.slice(5, 7))}`

export function demoEmails(today: ISODate): RawEmail[] {
  const trip = addDays(today, 8)
  return [
    { id: 'demo-mail-1', subject: 'Confirmación de reserva - Hotel Patagonia Suites, Bariloche', from: 'Booking.com <noreply@booking.com>', snippet: `Tu reserva está confirmada. Check-in ${dm(trip)} · 5 noches · Total $ 312.000 a pagar en el alojamiento.`, date: addDays(today, -6) },
    { id: 'demo-mail-2', subject: 'Tu vuelo a Bariloche está confirmado', from: 'Aerolíneas Argentinas <noreply@aerolineas.com.ar>', snippet: `Itinerario de viaje AEP → BRC, salida ${dm(trip)}. Total pagado $ 286.000.`, date: addDays(today, -35) },
    { id: 'demo-mail-3', subject: 'Actualizamos el precio de tu plan', from: 'Netflix <info@netflix.com>', snippet: `A partir de tu próxima factura del ${dm(addDays(today, 9))} tu plan Estándar pasará a $ 16.999 por mes.`, date: addDays(today, -2) },
    { id: 'demo-mail-4', subject: 'Tu factura Edenor ya está disponible', from: 'Edenor <facturaelectronica@edenor.com>', snippet: `Importe $ 47.800. Vence el ${dm(addDays(today, 5))}.`, date: addDays(today, -1) },
    { id: 'demo-mail-5', subject: 'Transferencia recibida', from: 'Mercado Pago <info@mercadopago.com>', snippet: 'Recibiste un pago de OSDE por $ 35.000 correspondiente a reintegro de prestación.', date: today },
    { id: 'demo-mail-6', subject: '50% OFF en tu próximo pedido', from: 'Rappi <promos@rappi.com>', snippet: 'Solo por hoy, descuento en restaurantes seleccionados.', date: addDays(today, -1) },
    { id: 'demo-mail-7', subject: 'Gracias por tu compra', from: 'Mercado Libre <noreply@mercadolibre.com>', snippet: 'Tu compra de Funda para notebook 15" por $ 18.900 fue aprobada.', date: addDays(today, -2) },
    { id: 'demo-mail-8', subject: 'Resumen semanal de tu equipo', from: 'Notion <team@notion.so>', snippet: 'Estas son las páginas más vistas de la semana.', date: addDays(today, -1) },
  ]
}

export function demoEvents(today: ISODate): RawEvent[] {
  return [
    { id: 'demo-cal-1', summary: 'Viaje a Bariloche ✈️', start: addDays(today, 8), end: addDays(today, 13) },
    { id: 'demo-cal-2', summary: 'Cumple de Sofi 🎂', start: addDays(today, 4), end: null },
    { id: 'demo-cal-3', summary: 'Cena con amigos', start: addDays(today, 2), end: null },
    { id: 'demo-cal-4', summary: 'Vence seguro del auto', start: addDays(today, 10), end: null },
    { id: 'demo-cal-5', summary: 'Recital en el Movistar Arena', start: addDays(today, 6), end: null },
    { id: 'demo-cal-6', summary: 'Reunión de equipo', start: addDays(today, 1), end: null },
    { id: 'demo-cal-7', summary: 'Renovación dominio web $ 21.500', start: addDays(today, 20), end: null },
  ]
}
