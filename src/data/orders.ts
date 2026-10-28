// Past orders shown on C-18 Orders / History and C-19 Order Detail.
import type { CartLine, Fulfillment } from '../state/AppState'

export type PastOrder = {
  number: number
  status: 'Completed' | 'Cancelled'
  fulfillment: Fulfillment
  when: string
  date: string
  lines: CartLine[]
  subtotal: number
  discount: number
  payment: string
}

const line = (productId: string, options: string[], unitPrice: number): CartLine => ({
  key: `${productId}-${options.join('-')}`,
  productId,
  options,
  note: '',
  unitPrice,
  qty: 1,
})

export const pastOrders: PastOrder[] = [
  {
    number: 1038,
    status: 'Completed',
    fulfillment: 'pickup',
    when: 'Today, 10:42 AM',
    date: '12 Oct · 10:42 AM',
    lines: [line('latte', ['Hot · 12 oz', 'Oat milk'], 180), line('beef-tapa', [], 180)],
    subtotal: 360,
    discount: 18,
    payment: 'Pay at counter',
  },
  {
    number: 1031,
    status: 'Completed',
    fulfillment: 'pickup',
    when: 'Today, 10:42 AM',
    date: '9 Oct · 8:15 AM',
    lines: [line('spanish-latte', ['Cold · 16 oz', 'Regular milk'], 110)],
    subtotal: 110,
    discount: 0,
    payment: 'Card ending 4242',
  },
  {
    number: 1027,
    status: 'Cancelled',
    fulfillment: 'pickup',
    when: 'Today, 10:42 AM',
    date: '6 Oct · 4:30 PM',
    lines: [line('hot-chocolate', ['Hot · 12 oz'], 105), line('nachos', [], 180)],
    subtotal: 285,
    discount: 0,
    payment: 'Pay at counter',
  },
]

export const pastOrderByNumber = (n: number) => pastOrders.find((o) => o.number === n)
