// Flow 3 — Cart, pickup or delivery, checkout (C-14, C-32, C-33, C-15, C-16)
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Content, Row, Screen, TopBar } from '../components/Screen'
import { TextArea } from '../components/blocks'
import {
  AddressCard,
  Alert,
  CartItem,
  FulfillmentDetails,
  FulfillmentSelector,
  FulfillmentSummary,
  OptionRow,
  OrderLine,
  PriceBreakdown,
  lineName,
} from '../components/order'
import { Button, Checkbox, Loader, TextField } from '../components/ui'
import { Icon } from '../components/Icon'
import { Lamp } from '../components/Lamp'
import { peso } from '../data/menu'
import {
  DELIVERY_FEE,
  FREE_DRINK_THRESHOLD,
  tierDiscount,
  useApp,
  type Address,
} from '../state/AppState'
import { useOverlay } from '../overlays/OverlayHost'
import './checkout.css'

/** Totals for the current cart, fulfillment and discount choice. */
function useTotals() {
  const { cartTotal, fulfillment, session, useTierDiscount } = useApp()
  const discount = session === 'member' && useTierDiscount ? tierDiscount(cartTotal) : 0
  const deliveryFee = fulfillment === 'delivery' ? DELIVERY_FEE : 0
  return { subtotal: cartTotal, discount, deliveryFee, total: cartTotal - discount + deliveryFee }
}

function EmptyCart() {
  const navigate = useNavigate()
  return (
    <Screen
      topBar={<TopBar title="Your order" />}
      footer={<Button onClick={() => navigate('/menu')}>Browse the menu</Button>}
    >
      <div className="empty-cart">
        <Icon name="receipt" size={40} color="var(--muted)" />
        <h2 className="t-h2">Your cart is empty</h2>
        <p className="t-body muted">Add a drink or a meal to get started.</p>
      </div>
    </Screen>
  )
}

/** C-14 Cart — Default (pickup) and Delivery states follow the chosen fulfillment. */
export function Cart() {
  const navigate = useNavigate()
  const overlay = useOverlay()
  const { cart, setQty, fulfillment, addresses, addressId } = useApp()
  const { subtotal, discount, deliveryFee, total } = useTotals()
  const address = addresses.find((a) => a.id === addressId)

  if (cart.length === 0) return <EmptyCart />

  return (
    <Screen
      footerBorder
      topBar={<TopBar title="Your order" />}
      footer={
        <Button className="btn--split" height={52} onClick={() => navigate('/checkout')}>
          <span>Checkout</span>
          <span className="num">{peso(total)}</span>
        </Button>
      }
    >
      <Content>
        <Row>
          <FulfillmentSummary type={fulfillment} address={address} onChange={() => navigate('/fulfillment')} />
        </Row>
        <Row>
          <div className="cart-items">
            {cart.map((l) => (
              <CartItem
                key={l.key}
                line={l}
                onQty={async (q) => {
                  if (q > 0 || (await overlay.confirm('remove-item', { name: lineName(l) }))) setQty(l.key, q)
                }}
                onEdit={() => navigate(`/product/${l.productId}?edit=${encodeURIComponent(l.key)}`)}
              />
            ))}
          </div>
        </Row>
        <Row>
          <div>
            <Button variant="text" height={48} full={false} onClick={() => navigate('/menu')}>
              Add more items
            </Button>
          </div>
        </Row>
        {subtotal < FREE_DRINK_THRESHOLD && (
          <Row>
            <Alert>Add {peso(FREE_DRINK_THRESHOLD - subtotal)} more to get a free drink.</Alert>
          </Row>
        )}
        <Row>
          <PriceBreakdown subtotal={subtotal} discount={discount} deliveryFee={deliveryFee} />
        </Row>
      </Content>
    </Screen>
  )
}

/** C-32 Pickup or Delivery — Default (pickup) and Delivery states. */
export function PickupOrDelivery() {
  const navigate = useNavigate()
  const { fulfillment, setFulfillment, addresses, addressId, setAddressId } = useApp()
  const address = addresses.find((a) => a.id === addressId)

  return (
    <Screen
      footerBorder
      topBar={<TopBar title="Pickup or delivery" />}
      footer={
        <Button
          disabled={fulfillment === 'delivery' && !address}
          onClick={() => navigate('/checkout', { replace: true })}
        >
          Continue to checkout
        </Button>
      }
    >
      <Content>
        <Row>
          <FulfillmentSelector value={fulfillment} onChange={setFulfillment} />
        </Row>
        {fulfillment === 'delivery' && (
          <>
            <Row>
              <h2 className="t-h3">Deliver to</h2>
            </Row>
            <Row>
              <div className="address-list" role="radiogroup" aria-label="Delivery address">
                {addresses.map((a) => (
                  <AddressCard
                    key={a.id}
                    address={a}
                    selected={a.id === addressId}
                    onSelect={() => setAddressId(a.id)}
                    onEdit={() => navigate(`/address/${a.id}`)}
                  />
                ))}
              </div>
            </Row>
            <Row>
              <div>
                <Button variant="secondary" height={48} full={false} onClick={() => navigate('/address/new')}>
                  Add new address
                </Button>
              </div>
            </Row>
          </>
        )}
        <Row>
          <FulfillmentDetails type={fulfillment} address={address} />
        </Row>
      </Content>
    </Screen>
  )
}

/** C-33 Delivery Address — add (`/address/new`) or edit (`/address/:id`). */
export function DeliveryAddress() {
  const { id = 'new' } = useParams()
  const navigate = useNavigate()
  const { addresses, saveAddress, setAddressId, name, phone } = useApp()
  const existing = addresses.find((a) => a.id === id)

  const [recipient, setRecipient] = useState(existing?.name ?? '')
  const [mobile, setMobile] = useState(existing?.phone ?? '')
  const [street, setStreet] = useState(existing?.street.split(', ').slice(0, 2).join(', ') ?? '')
  const [landmark, setLandmark] = useState('')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [save, setSave] = useState(!!existing)
  const valid = recipient.trim() && mobile.trim() && street.trim()

  const submit = () => {
    const a: Address = {
      id: existing?.id ?? `addr-${Date.now()}`,
      label: existing?.label ?? 'Other',
      name: recipient.trim(),
      phone: mobile.trim(),
      street: [landmark.trim(), street.trim()].filter(Boolean).join(', '),
      notes: notes.trim() || undefined,
      isDefault: existing?.isDefault,
    }
    saveAddress(a)
    setAddressId(a.id)
    navigate(-1)
  }

  return (
    <Screen topBar={<TopBar title="Delivery address" />}>
      <Content>
        <Row>
          <div className="address-form">
            <TextField
              label="Recipient name"
              helper="Required"
              placeholder={name}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              autoComplete="name"
            />
            <TextField
              label="Mobile number"
              helper="Required"
              placeholder={phone}
              inputMode="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              autoComplete="tel"
            />
            <TextField
              label="Street address"
              helper="Required"
              placeholder="House no., street, barangay, city"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              autoComplete="street-address"
            />
            <TextField
              label="Building, unit or landmark"
              helper="Optional"
              placeholder="e.g. Unit 8B, near the church"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
            />
            <TextArea
              label="Delivery notes"
              helper="Optional"
              placeholder="e.g. Leave at the door"
              value={notes}
              onChange={setNotes}
            />
            <Checkbox label="Save this address" checked={save} onChange={setSave} />
            <Button disabled={!valid} onClick={submit}>
              Save address
            </Button>
          </div>
        </Row>
        <Row>
          <p className="t-caption muted">
            Address entry is a placeholder form. It is replaced by the maps / address provider SDK.
          </p>
        </Row>
      </Content>
    </Screen>
  )
}

/** C-15 Checkout — Default, Delivery, Processing (Place order shows the scrim + spinner). */
export function Checkout() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const app = useApp()
  const { cart, cartCount, fulfillment, addresses, addressId, payment, session, useTierDiscount, placeOrder } = app
  const { subtotal, discount, deliveryFee, total } = useTotals()
  const overlay = useOverlay()
  const [note, setNote] = useState('')
  const [processing, setProcessing] = useState(params.get('state') === 'processing')
  const address = addresses.find((a) => a.id === addressId)

  if (cart.length === 0 && !processing) return <EmptyCart />

  const submit = async () => {
    if (session !== 'member') {
      overlay.open('login-to-order')
      return
    }
    if (app.lastOrder && Date.now() - lastPlacedAt < 2 * 60 * 1000) {
      const go = await overlay.confirm('similar-order')
      if (!go) return
    }
    setProcessing(true)
    setTimeout(() => {
      placeOrder(note)
      lastPlacedAt = Date.now()
      navigate('/order-confirmation', { replace: true })
    }, 1400)
  }

  return (
    <Screen
      footerBorder
      topBar={<TopBar title="Checkout" />}
      footer={
        <Button
          onClick={submit}
          disabled={processing}
          aria-busy={processing}
          className={`btn--processing ${processing ? '' : 'btn--split'}`}
          height={52}
        >
          {processing ? (
            <Loader dark />
          ) : (
            <>
              <span>Place order</span>
              <span className="num">{peso(total)}</span>
            </>
          )}
        </Button>
      }
      overlay={processing && <div className="processing-scrim" aria-hidden />}
    >
      <Content>
        <Row>
          <FulfillmentSummary type={fulfillment} address={address} onChange={() => navigate('/fulfillment')} />
        </Row>
        <Row>
          <section className="card checkout-items" aria-labelledby="checkout-items">
            <div className="checkout-items__head">
              <h2 id="checkout-items" className="t-h3">
                {cartCount} item{cartCount === 1 ? '' : 's'}
              </h2>
              <button className="t-body-sm link-text" onClick={() => navigate('/cart')}>
                Edit
              </button>
            </div>
            {cart.map((l) => (
              <OrderLine key={l.key} line={l} />
            ))}
          </section>
        </Row>
        <Row>
          <div className="card options-card">
            <OptionRow
              icon="tag"
              label="Discount & rewards"
              value={session === 'member' ? (useTierDiscount ? 'Regular discount' : 'None') : 'Log in to use'}
              onClick={() => overlay.open('discounts')}
            />
            <OptionRow icon="card" label="Payment method" value={payment} onClick={() => overlay.open('payment')} />
          </div>
        </Row>
        <Row>
          <TextArea
            label="Note for the cafe"
            placeholder="Optional"
            helper="Optional · up to 140 characters"
            value={note}
            onChange={setNote}
          />
        </Row>
        <Row>
          <PriceBreakdown subtotal={subtotal} discount={discount} deliveryFee={deliveryFee} />
        </Row>
      </Content>
    </Screen>
  )
}

let lastPlacedAt = 0

/** C-16 Order Confirmation — Default (pickup) and Delivery. */
export function OrderConfirmation() {
  const navigate = useNavigate()
  const { lastOrder, fulfillment, addresses, addressId } = useApp()
  const type = lastOrder?.fulfillment ?? fulfillment
  const address = lastOrder?.address ?? addresses.find((a) => a.id === addressId)

  return (
    <Screen
      footer={
        <>
          <Button onClick={() => navigate('/orders/tracking', { replace: true })}>Track order</Button>
          <Button variant="secondary" onClick={() => navigate('/menu', { replace: true })}>
            Back to menu
          </Button>
        </>
      }
    >
      <div className="confirmation">
        <header className="confirmation__head">
          <span className="confirmation__icon">
            <Lamp state="lit" size={56} label="" />
          </span>
          <div>
            <h1 className="t-h1">Order #{lastOrder?.number ?? 1042} placed</h1>
            <p className="t-body muted">Follow it on the tracker until it's ready.</p>
          </div>
        </header>
        <div className="confirmation__details">
          <FulfillmentDetails type={type} address={address} />
        </div>
        {lastOrder && (
          <section className="card confirmation__items" aria-labelledby="conf-items">
            <h2 id="conf-items" className="t-h3">
              Your order
            </h2>
            {lastOrder.lines.map((l) => (
              <OrderLine key={l.key} line={l} />
            ))}
            {lastOrder.discount > 0 && (
              <div className="confirmation__row t-body-sm">
                <span>Regular discount</span>
                <span className="num">−{peso(lastOrder.discount)}</span>
              </div>
            )}
            {lastOrder.deliveryFee > 0 && (
              <div className="confirmation__row t-body-sm">
                <span>Delivery fee</span>
                <span className="num">{peso(lastOrder.deliveryFee)}</span>
              </div>
            )}
            <div className="confirmation__total">
              <span className="t-h3">Total · {lastOrder.payment}</span>
              <span className="t-h3 num">{peso(lastOrder.total)}</span>
            </div>
          </section>
        )}
        <p className="confirmation__points t-body-sm">
          <Icon name="star" size={18} color="var(--gold-ink)" />+{lastOrder?.points ?? 120} points when completed
        </p>
      </div>
    </Screen>
  )
}
