// Flow 1 — Launch and account (C-01 … C-08)
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Content, Row, Screen, TopBar } from '../components/Screen'
import {
  Button,
  Checkbox,
  Loader,
  Logo,
  OtpInput,
  PaginationDots,
  Photo,
  RuleCheck,
  TextField,
} from '../components/ui'
import { toIntl, useApp } from '../state/AppState'
import counterPhoto from '../assets/photos/counter-cup-meal.webp'
import interiorPhoto from '../assets/photos/interior-banquette.webp'
import './account.css'

/** C-01 Splash */
export function Splash() {
  const navigate = useNavigate()
  useEffect(() => {
    const t = setTimeout(() => navigate('/onboarding/1', { replace: true }), 1600)
    return () => clearTimeout(t)
  }, [navigate])

  return (
    <Screen theme="dark" bg="secondary" bodyClassName="splash">
      <div className="splash__content">
        <span className="splash__logo">
          <Logo height={200} />
        </span>
        <Loader />
      </div>
    </Screen>
  )
}

// Each slide is a crop of the cafe's own photographs.
const slides = [
  {
    title: 'Order ahead, skip the queue',
    body: 'Pick your drink, choose pickup or delivery, and it is ready when you are.',
    photo: counterPhoto,
    position: '50% 78%',
    alt: "A MEGS' kraft cup and a plate of chicken and rice on a cafe table",
  },
  {
    title: 'Earn points, get rewards',
    body: 'Every order earns points toward free drinks and treats.',
    photo: interiorPhoto,
    position: '50% 45%',
    alt: "MEGS' Cafe seating: an orange banquette, wooden chairs and black wall lamps on concrete",
  },
  {
    title: 'Track your order live',
    body: 'See every step from the counter to your hands, with a nudge when it is ready.',
    photo: counterPhoto,
    position: '50% 14%',
    alt: "The MEGS' sign on the concrete wall: The best time is coffee time",
  },
]

/** C-02 Onboarding / Slide 1–3 */
export function Onboarding({ slide }: { slide: number }) {
  const navigate = useNavigate()
  const last = slide === slides.length - 1
  const { title, body, photo, position, alt } = slides[slide]

  return (
    <Screen
      bg="surface"
      statusOverlay
      statusTheme="dark"
      footer={
        <Button onClick={() => navigate(last ? '/welcome' : `/onboarding/${slide + 2}`)}>
          {last ? 'Get started' : 'Next'}
        </Button>
      }
      overlay={
        <Button
          variant="secondary"
          height={40}
          full={false}
          className="onboarding__skip"
          onClick={() => navigate('/welcome')}
        >
          Skip
        </Button>
      }
    >
      <div className="content onboarding__content">
        <Photo src={photo} alt={alt} height={472} position={position} />
        <Row>
          <h1 className="t-h1">{title}</h1>
        </Row>
        <Row>
          <p className="t-body muted">{body}</p>
        </Row>
        <Row>
          <PaginationDots active={slide} />
        </Row>
      </div>
    </Screen>
  )
}

/** C-03 Welcome */
export function Welcome() {
  const navigate = useNavigate()
  const { setSession } = useApp()

  return (
    <Screen
      statusOverlay
      statusTheme="dark"
      footer={
        <>
          <Button onClick={() => navigate('/sign-up')}>Create account</Button>
          <Button variant="secondary" onClick={() => navigate('/log-in')}>
            Log in
          </Button>
          <Button
            variant="text"
            height={48}
            onClick={() => {
              setSession('guest')
              navigate('/home')
            }}
          >
            Browse as guest
          </Button>
        </>
      }
    >
      <Photo
        src={interiorPhoto}
        alt="Inside MEGS' Cafe: grey concrete walls, black wall lamps on a pipe rail, an orange banquette and wooden chairs"
        height={340}
        position="50% 30%"
      />
      <div className="welcome__content">
        <h1 className="welcome__logo">
          <Logo height={148} />
        </h1>
        <p className="t-h3 welcome__tagline">The best time is coffee time.</p>
        <p className="t-body muted">Order ahead for pickup at the counter, or have it delivered.</p>
      </div>
    </Screen>
  )
}

/** C-04 Sign Up */
export function SignUp() {
  const navigate = useNavigate()
  const { phone, setPhone, name, setName } = useApp()
  const [email, setEmail] = useState('')
  const [agreed, setAgreed] = useState(true)
  const valid = name.trim() !== '' && phone.replace(/\D/g, '').length >= 10 && agreed

  return (
    <Screen
      topBar={<TopBar />}
      footer={
        <Button disabled={!valid} onClick={() => navigate('/verify')}>
          Continue
        </Button>
      }
    >
      <Content>
        <Row>
          <h1 className="t-h1">Create your account</h1>
        </Row>
        <Row>
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </Row>
        <Row>
          <TextField
            label="Mobile number"
            helper="We will text you a 6-digit code"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            autoComplete="tel"
          />
        </Row>
        <Row>
          <TextField
            label="Email (optional)"
            placeholder="Enter email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Row>
        <Row>
          <Checkbox label="I agree to the Terms and Privacy Policy" checked={agreed} onChange={setAgreed} />
        </Row>
      </Content>
    </Screen>
  )
}

/** C-05 Verification — `?mode=reset` continues to Reset Password instead of Home. */
export function Verification() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const reset = params.get('mode') === 'reset'
  const { phone, setSession, setFirstLaunch } = useApp()
  const [code, setCode] = useState('123456')
  const [resent, setResent] = useState(false)

  const verify = () => {
    if (reset) return navigate('/reset-password')
    setSession('member')
    setFirstLaunch(true)
    navigate('/home', { replace: true })
  }

  return (
    <Screen
      topBar={<TopBar />}
      footer={
        <Button disabled={code.length < 6} onClick={verify}>
          Verify
        </Button>
      }
    >
      <Content>
        <Row>
          <h1 className="t-h1">Enter the 6-digit code</h1>
        </Row>
        <Row>
          <div className="sent-to">
            <span className="t-body muted">Sent to {toIntl(phone)}</span>
            <Button variant="text" height={40} full={false} onClick={() => navigate(-1)}>
              Edit
            </Button>
          </div>
        </Row>
        <Row>
          <OtpInput value={code} onChange={setCode} />
        </Row>
        <Row>
          <button className="t-body link-text resend" onClick={() => setResent(true)}>
            {resent ? 'Code sent again' : 'Resend code'}
          </button>
        </Row>
      </Content>
    </Screen>
  )
}

/** C-06 Log In */
export function LogIn() {
  const navigate = useNavigate()
  const { setSession } = useApp()
  const [id, setId] = useState('maria@email.com')
  const [password, setPassword] = useState('password1')

  return (
    <Screen
      topBar={<TopBar />}
      footer={
        <Button
          disabled={!id || !password}
          onClick={() => {
            setSession('member')
            navigate('/home', { replace: true })
          }}
        >
          Log in
        </Button>
      }
    >
      <Content>
        <Row>
          <h1 className="t-h1">Log in</h1>
        </Row>
        <Row>
          <TextField
            label="Mobile number or email"
            value={id}
            onChange={(e) => setId(e.target.value)}
            autoComplete="username"
          />
        </Row>
        <Row>
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </Row>
        <Row>
          <div className="forgot-row">
            <Button variant="text" height={48} full={false} onClick={() => navigate('/forgot-password')}>
              Forgot password?
            </Button>
          </div>
        </Row>
      </Content>
    </Screen>
  )
}

/** C-07 Forgot Password */
export function ForgotPassword() {
  const navigate = useNavigate()
  const [id, setId] = useState('')

  return (
    <Screen
      topBar={<TopBar />}
      footer={
        <Button disabled={!id} onClick={() => navigate('/verify?mode=reset')}>
          Send reset code
        </Button>
      }
    >
      <Content>
        <Row>
          <h1 className="t-h1">Reset your password</h1>
        </Row>
        <Row>
          <p className="t-body muted">Enter your mobile number or email and we'll send you a code.</p>
        </Row>
        <Row>
          <TextField
            label="Mobile number or email"
            placeholder="Enter mobile number or email"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
        </Row>
      </Content>
    </Screen>
  )
}

/** C-08 Reset Password */
export function ResetPassword() {
  const navigate = useNavigate()
  const [pw, setPw] = useState('password1')
  const [confirm, setConfirm] = useState('password1')
  const longEnough = pw.length >= 8
  const hasNumber = /\d/.test(pw)

  return (
    <Screen
      topBar={<TopBar />}
      footer={
        <Button
          disabled={!longEnough || !hasNumber || pw !== confirm}
          onClick={() => navigate('/log-in', { replace: true })}
        >
          Save password
        </Button>
      }
    >
      <Content>
        <Row>
          <h1 className="t-h1">Set a new password</h1>
        </Row>
        <Row>
          <TextField label="New password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </Row>
        <Row>
          <TextField
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Row>
        <Row>
          <div className="rules">
            <RuleCheck label="8 or more characters" met={longEnough} />
            <RuleCheck label="At least one number" met={hasNumber} />
          </div>
        </Row>
      </Content>
    </Screen>
  )
}
