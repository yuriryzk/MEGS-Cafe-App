// Flow 6 — Profile and settings (C-27 … C-31)
import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BottomNav } from '../components/blocks'
import { AddressCard, Alert } from '../components/order'
import { Content, Row, Screen, TopBar } from '../components/Screen'
import { Button, Checkbox, LogoMark, TextField } from '../components/ui'
import { Icon, type IconName } from '../components/Icon'

/** One plain outline icon per settings row, by what the row opens. */
const rowIcons: Record<string, IconName> = {
  'Edit profile': 'user',
  'Payment methods': 'card',
  'Saved addresses': 'pin',
  'Order history': 'receipt',
  'Points activity': 'star',
  'Regular status': 'tag',
  Notifications: 'bell',
  Settings: 'sliders',
  'Help and support': 'help',
  "About MEGS' Cafe": 'info',
  'Log out': 'logout',
  Language: 'globe',
  Privacy: 'lock',
  'Delete account': 'trash',
  'E-wallet': 'phone',
  'Pay at counter': 'store',
}
import { useOverlay } from '../overlays/OverlayHost'
import { useApp } from '../state/AppState'
import './profile.css'

/** Row / Settings — icon, label, optional value, chevron. Renders as a button only when it does something. */
function SettingsRow({
  label,
  value,
  onClick,
  danger,
  chevron = true,
}: {
  label: string
  value?: string
  onClick?: () => void
  danger?: boolean
  chevron?: boolean
}) {
  const content = (
    <>
      <Icon name={rowIcons[label] ?? 'card'} size={20} color={danger ? 'var(--negative)' : 'var(--muted)'} />
      <span className="t-body option-row__label">{label}</span>
      {value && <span className="t-body-sm muted option-row__value">{value}</span>}
      {chevron && !danger && <Icon name="chevron" size={20} color="var(--muted)" />}
    </>
  )
  const cls = `option-row ${danger ? 'option-row--danger' : ''}`
  return onClick ? (
    <button className={cls} onClick={onClick}>
      {content}
    </button>
  ) : (
    <div className={cls}>{content}</div>
  )
}

function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <>
      {title && (
        <Row>
          <p className="t-caption muted">{title}</p>
        </Row>
      )}
      <Row>
        <div className="card options-card">{children}</div>
      </Row>
    </>
  )
}

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')

/** C-27 Profile */
export function Profile() {
  const navigate = useNavigate()
  const overlay = useOverlay()
  const { name, session } = useApp()

  if (session !== 'member') {
    return (
      <Screen topBar={<TopBar type="title" title="Profile" />} bottomNav={<BottomNav active="profile" />}>
        <div className="guest-profile">
          <LogoMark size={48} />
          <h2 className="t-h2">Log in to see your profile</h2>
          <p className="t-body muted">Track orders, earn points and save your favourite drinks.</p>
          <Button onClick={() => navigate('/log-in')}>Log in</Button>
          <Button variant="secondary" onClick={() => navigate('/sign-up')}>
            Create account
          </Button>
        </div>
      </Screen>
    )
  }

  return (
    <Screen topBar={<TopBar type="title" title="Profile" />} bottomNav={<BottomNav active="profile" />}>
      <Content>
        <Row>
          <div className="identity">
            <span className="avatar t-h2">{initials(name)}</span>
            <span className="identity__name">
              <span className="t-h2">{name}</span>
              <span className="tier-pill t-caption">
                <Icon name="star" size={15} color="var(--gold-ink)" />
                Regular
              </span>
            </span>
          </div>
        </Row>
        <Group title="Account">
          <SettingsRow label="Edit profile" onClick={() => navigate('/profile/edit')} />
          <SettingsRow label="Payment methods" onClick={() => navigate('/profile/payment')} />
          <SettingsRow label="Saved addresses" onClick={() => navigate('/profile/addresses')} />
        </Group>
        <Group title="Activity">
          <SettingsRow label="Order history" onClick={() => navigate('/orders?tab=history')} />
          <SettingsRow label="Points activity" onClick={() => navigate('/rewards/activity')} />
          <SettingsRow label="Regular status" onClick={() => navigate('/rewards/status')} />
        </Group>
        <Group title="Preferences">
          <SettingsRow label="Notifications" onClick={() => navigate('/notifications')} />
          <SettingsRow label="Settings" onClick={() => navigate('/settings')} />
        </Group>
        <Group title="Support">
          <SettingsRow label="Help and support" />
          <SettingsRow label="About MEGS' Cafe" />
        </Group>
        <Group>
          <SettingsRow label="Log out" danger onClick={() => overlay.open('logout')} />
        </Group>
      </Content>
    </Screen>
  )
}

/** Toast — success banner over the top bar (C-28 Edit Profile / Saved). */
function Toast({ children }: { children: ReactNode }) {
  return (
    <div className="toast" role="status">
      <Icon name="check" size={20} />
      <span className="t-body">{children}</span>
    </div>
  )
}

/** C-28 Edit Profile — Default and Saved. */
export function EditProfile() {
  const [params] = useSearchParams()
  const { name, setName, phone } = useApp()
  const [draft, setDraft] = useState(name)
  const [email, setEmail] = useState('maria.santos@gmail.com')
  const [birthday, setBirthday] = useState('')
  const [size, setSize] = useState('Medium')
  const [cafe, setCafe] = useState("MEGS' Cafe")
  const [saved, setSaved] = useState(params.get('state') === 'saved')

  useEffect(() => {
    if (!saved || params.get('state') === 'saved') return
    const t = setTimeout(() => setSaved(false), 2500)
    return () => clearTimeout(t)
  }, [saved, params])

  return (
    <Screen
      footerBorder
      topBar={<TopBar title="Edit profile" />}
      footer={
        <Button
          disabled={!draft.trim()}
          onClick={() => {
            setName(draft.trim())
            setSaved(true)
          }}
        >
          Save
        </Button>
      }
      overlay={saved && <Toast>Profile saved</Toast>}
    >
      <Content>
        <Row>
          <TextField label="Name" value={draft} onChange={(e) => setDraft(e.target.value)} autoComplete="name" />
        </Row>
        <Row>
          <TextField label="Mobile number" helper="Verified" value={phone} readOnly className="t-body is-readonly" />
        </Row>
        <Row>
          <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Row>
        <Row>
          <TextField
            label="Birthday (optional)"
            placeholder="Enter birthday"
            helper="Used for birthday offers"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
          />
        </Row>
        <Row>
          <p className="t-caption muted">Saved preferences</p>
        </Row>
        <Row>
          <TextField label="Default drink size" value={size} onChange={(e) => setSize(e.target.value)} />
        </Row>
        <Row>
          <TextField label="Favorite cafe" value={cafe} onChange={(e) => setCafe(e.target.value)} />
        </Row>
      </Content>
    </Screen>
  )
}

/** Toggle */
function Toggle({
  label,
  description,
  on,
  onChange,
}: {
  label: string
  description: string
  on: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="toggle">
      <span className="toggle__text">
        <span className="t-body">{label}</span>
        <span className="t-body-sm muted">{description}</span>
      </span>
      <input type="checkbox" role="switch" checked={on} onChange={(e) => onChange(e.target.checked)} />
      <span className={`toggle__track ${on ? 'is-on' : ''}`} aria-hidden>
        <span />
      </span>
    </label>
  )
}

/** C-29 Settings */
export function Settings() {
  const overlay = useOverlay()
  const { notificationsOn, setNotificationsOn } = useApp()
  const [promos, setPromos] = useState(true)
  const [reminders, setReminders] = useState(true)
  // Figma shows all three on; order updates mirrors the O-11 permission choice once made.
  const [orderUpdates, setOrderUpdates] = useState(true)
  useEffect(() => {
    if (notificationsOn) setOrderUpdates(true)
  }, [notificationsOn])

  return (
    <Screen topBar={<TopBar title="Settings" />}>
      <Content>
        <Row>
          <p className="t-caption muted">Notifications</p>
        </Row>
        <Row>
          <div className="card toggles-card">
            <Toggle
              label="Order updates"
              description="Status changes for your orders"
              on={orderUpdates}
              onChange={(v) => {
                setOrderUpdates(v)
                setNotificationsOn(v)
              }}
            />
            <Toggle label="Promotions" description="Offers and new items" on={promos} onChange={setPromos} />
            <Toggle
              label="Rewards reminders"
              description="Points and rewards nearing expiry"
              on={reminders}
              onChange={setReminders}
            />
          </div>
        </Row>
        <Group title="General">
          <SettingsRow label="Language" value="English" />
          <SettingsRow label="Privacy" />
        </Group>
        <Group>
          <SettingsRow label="Delete account" danger />
          <SettingsRow label="Log out" danger onClick={() => overlay.open('logout')} />
        </Group>
      </Content>
    </Screen>
  )
}

type Note = { id: string; title: string; body: string; time: string; to: string; day: 'Today' | 'Earlier' }

const initialNotes: Note[] = [
  { id: 'n1', title: 'Your order is ready', body: 'Order #1042 is ready for pickup.', time: '2 min ago', to: '/orders/tracking', day: 'Today' },
  {
    id: 'n2',
    title: 'You earned 120 points',
    body: 'Thanks for ordering. Points added to your balance.',
    time: '1 hr ago',
    to: '/rewards/activity',
    day: 'Today',
  },
  {
    id: 'n3',
    title: 'Free pastry with any large drink',
    body: 'Ends 31 Oct. Tap to see the offer.',
    time: 'Yesterday',
    to: '/promotions/free-pastry',
    day: 'Earlier',
  },
  { id: 'n4', title: 'Order #1038 completed', body: 'Rate your order or order it again.', time: '12 Oct', to: '/orders/1038', day: 'Earlier' },
]

let readIds = new Set(['n3', 'n4'])

/** C-30 Notifications */
export function Notifications() {
  const navigate = useNavigate()
  const [read, setRead] = useState(readIds)

  const open = (n: Note) => {
    readIds = new Set([...read, n.id])
    setRead(readIds)
    navigate(n.to)
  }

  return (
    <Screen topBar={<TopBar title="Notifications" />}>
      <Content>
        {(['Today', 'Earlier'] as const).map((day) => (
          <div key={day} className="notes-group">
            <Row>
              <p className="t-caption muted">{day}</p>
            </Row>
            <Row>
              <div className="card notes-card">
                {initialNotes
                  .filter((n) => n.day === day)
                  .map((n) => {
                    const unread = !read.has(n.id)
                    return (
                      <button key={n.id} className="note" onClick={() => open(n)}>
                        <span className={`note__dot ${unread ? 'is-unread' : ''}`} />
                        <span className="note__text">
                          <span className="note__head">
                            <span className={unread ? 't-h3' : 't-body'}>{n.title}</span>
                            {unread && <span className="t-caption note__unread">Unread</span>}
                          </span>
                          <span className="t-body-sm muted">{n.body}</span>
                          <span className="t-caption muted">{n.time}</span>
                        </span>
                      </button>
                    )
                  })}
              </div>
            </Row>
          </div>
        ))}
      </Content>
    </Screen>
  )
}

/** C-31 Payment Methods */
export function PaymentMethods() {
  const navigate = useNavigate()
  const { paymentMethods } = useApp()
  return (
    <Screen
      footerBorder
      topBar={<TopBar title="Payment methods" />}
      footer={
        <Button variant="secondary" onClick={() => navigate('/profile/payment/add')}>
          Add payment method
        </Button>
      }
    >
      <Content>
        <Group>
          {paymentMethods.map((m) => (
            <SettingsRow key={m.label} label={m.label} value={m.status} chevron={m.label !== 'Pay at counter'} />
          ))}
        </Group>
      </Content>
    </Screen>
  )
}

/** C-31 Add Payment Method — placeholder form (to be replaced by the payment provider SDK). */
export function AddPaymentMethod() {
  const navigate = useNavigate()
  const { addPaymentMethod } = useApp()
  const [number, setNumber] = useState('')
  const [holder, setHolder] = useState('')
  const [expiry, setExpiry] = useState('')
  const [makeDefault, setMakeDefault] = useState(false)
  const digits = number.replace(/\D/g, '')
  const valid = digits.length >= 12 && holder.trim() && /^\d{2}\s*\/\s*\d{2}$/.test(expiry.trim())

  return (
    <Screen
      footerBorder
      topBar={<TopBar title="Add payment method" />}
      footer={
        <Button
          disabled={!valid}
          onClick={() => {
            addPaymentMethod({ label: `Card ending ${digits.slice(-4)}` }, makeDefault)
            navigate(-1)
          }}
        >
          Save
        </Button>
      }
    >
      <Content>
        <Row>
          <Alert>Placeholder form. To be replaced by the payment provider SDK.</Alert>
        </Row>
        <Row>
          <TextField
            label="Card number"
            placeholder="Enter card number"
            inputMode="numeric"
            autoComplete="off"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
        </Row>
        <Row>
          <TextField
            label="Name on card"
            placeholder="Enter name on card"
            autoComplete="off"
            value={holder}
            onChange={(e) => setHolder(e.target.value)}
          />
        </Row>
        <Row>
          <TextField
            label="Expiry"
            placeholder="Enter expiry"
            helper="MM / YY"
            autoComplete="off"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          />
        </Row>
        <Row>
          <Checkbox label="Make this my default" checked={makeDefault} onChange={setMakeDefault} />
        </Row>
      </Content>
    </Screen>
  )
}

/** Saved addresses (linked from Profile; not drawn in Figma — reuses the address cards from C-32). */
export function SavedAddresses() {
  const navigate = useNavigate()
  const { addresses, addressId, setAddressId } = useApp()
  return (
    <Screen
      footerBorder
      topBar={<TopBar title="Saved addresses" />}
      footer={
        <Button variant="secondary" onClick={() => navigate('/address/new')}>
          Add new address
        </Button>
      }
    >
      <Content>
        {addresses.map((a) => (
          <Row key={a.id}>
            <AddressCard
              address={a}
              selected={a.id === addressId}
              onSelect={() => setAddressId(a.id)}
              onEdit={() => navigate(`/address/${a.id}`)}
            />
          </Row>
        ))}
      </Content>
    </Screen>
  )
}
