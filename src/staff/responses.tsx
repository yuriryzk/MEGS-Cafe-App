// Automated response templates (SRS 3.2.13): A-07 list, A-08 editor, OA-03 Preview.
// OA-04 Discard changes lives in the console shell, which guards every way out of the editor.
import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Toggle } from '../components/ui'
import {
  PUSH_LIMIT,
  VARIABLES,
  fill,
  sampleVars,
  staffAlerts,
  unknownVariables,
  type Template,
} from '../data/templates'
import { dateTime, setTemplate, useShared } from '../state/shared'
import { Modal, Panel, StaffButton, useStaff } from './kit'

const edited = (t: Template) => `${t.editedBy} · ${dateTime(t.editedAt)}`

/* ---------- A-07 Templates ---------- */

export function Responses() {
  const { templates, staff } = useShared()
  const { go, act } = useStaff()

  return (
    <div className="st-page">
      <h1 className="t-h1">Customer messages</h1>
      <p className="t-body muted">What customers are told on each order event. Tap one to edit it.</p>
      <div className="st-rows">
        {templates.map((t) => (
          <div key={t.event} className="st-row st-tpl">
            <button className="st-row__hit" onClick={() => go(`/staff/responses/${t.event}`)} aria-label={`Edit ${t.name}`} />
            <span className="st-tpl__main">
              <span className="st-tpl__name">
                <span className="t-h3">{t.name}</span>
                <span className="st-tag t-caption">{t.channel === 'push' ? 'Push' : 'In-app'}</span>
                {t.critical && <span className="st-tag st-tag--ink t-caption">Critical</span>}
              </span>
              <span className="t-body-sm st-tpl__preview">{fill(t.body, sampleVars)}</span>
              <span className="t-caption muted">Last edited by {edited(t)}</span>
            </span>
            <span className="st-tpl__toggle">
              {/* FR-ART-06: critical messages can't be turned off, and the row says why */}
              <Toggle
                label={t.critical ? 'Always on' : t.enabled ? 'On' : 'Off'}
                description={t.critical ? 'Customers must get this one' : undefined}
                on={t.critical || t.enabled}
                disabled={t.critical}
                onChange={(v) =>
                  act(
                    () => setTemplate({ ...t, enabled: v, editedBy: staff.name, editedAt: Date.now() }),
                    `${t.name} turned ${v ? 'on' : 'off'}`,
                  )
                }
              />
            </span>
          </div>
        ))}
      </div>

      {/* FR-ART-07: internal alerts are listed apart from what customers get */}
      <Panel title="Staff alerts">
        <p className="t-body-sm muted">These go to the staff console only, never to customers.</p>
        <ul className="st-staff-alerts">
          {staffAlerts.map((a) => (
            <li key={a.name}>
              <span className="t-body">{a.name}</span>
              <span className="t-body-sm muted">{a.body}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}

/* ---------- A-08 Editor ---------- */

export function ResponseEditor() {
  const { event = '' } = useParams()
  // A fresh editor per template, so a draft never carries over to another one
  return <Editor key={event} event={event} />
}

function Editor({ event }: { event: string }) {
  const [params, setParams] = useSearchParams()
  const { templates, staff } = useShared()
  const { go, act, setDirty } = useStaff()
  const t = templates.find((x) => x.event === event)
  const [body, setBody] = useState(t?.body ?? '')
  const [saveError, setSaveError] = useState('')
  const [as, setAs] = useState<'push' | 'in-app'>(t?.channel ?? 'push')
  const area = useRef<HTMLTextAreaElement>(null)
  const sheet = params.get('sheet')
  const dirty = !!t && body !== t.body

  useEffect(() => {
    setDirty(dirty)
    return () => setDirty(false)
  }, [dirty, setDirty])

  // The screen index opens OA-04 directly: make an edit so there is something to discard
  useEffect(() => {
    if (sheet === 'discard' && t && body === t.body) {
      setBody(t.body + ' Thank you!')
      setParams({}, { replace: true })
      setTimeout(() => go('/staff/responses'), 50)
    }
  }, [sheet, t, body, setParams, go])

  if (!t) {
    return (
      <div className="st-page">
        <h1 className="t-h1">Template not found</h1>
        <StaffButton variant="secondary" onClick={() => go('/staff/responses')}>
          Back
        </StaffButton>
      </div>
    )
  }

  // FR-ART-02 / 03: a 160-character limit for push; unknown variables or empty text block saving
  const unknown = unknownVariables(body)
  const tooLong = t.channel === 'push' && body.length > PUSH_LIMIT
  const errors = [
    !body.trim() ? 'The message is empty.' : '',
    unknown.length ? `Unknown variable${unknown.length > 1 ? 's' : ''}: ${unknown.map((v) => `{${v}}`).join(', ')}.` : '',
    tooLong ? `Push messages can be up to ${PUSH_LIMIT} characters.` : '',
  ].filter(Boolean)

  const insert = (v: string) => {
    const el = area.current
    const token = `{${v}}`
    const start = el?.selectionStart ?? body.length
    const end = el?.selectionEnd ?? body.length
    setBody(body.slice(0, start) + token + body.slice(end))
    setTimeout(() => {
      el?.focus()
      el?.setSelectionRange(start + token.length, start + token.length)
    }, 0)
  }

  const save = () => {
    // FR-ART-05: if the save fails, the draft stays in the editor
    const ok = act(() => setTemplate({ ...t, body, editedBy: staff.name, editedAt: Date.now() }), 'Template saved')
    setSaveError(ok ? '' : "Couldn't save. Your draft is still here.")
  }

  return (
    <div className="st-page">
      <button className="st-back t-body-sm" onClick={() => go('/staff/responses')}>
        <Icon name="back" size={20} />
        Customer messages
      </button>
      <div className="st-detail-head">
        <h1 className="t-h1">{t.name}</h1>
        <span className="st-tag t-caption">{t.channel === 'push' ? 'Push' : 'In-app'}</span>
        {t.critical && <span className="st-tag st-tag--ink t-caption">Critical · always on</span>}
      </div>

      <Panel>
        <label className="st-field">
          <span className="t-body-sm">Message</span>
          <textarea
            ref={area}
            className={`st-input st-textarea t-body ${errors.length ? 'is-error' : ''}`}
            value={body}
            onChange={(e) => {
              setBody(e.target.value)
              setSaveError('')
            }}
            rows={4}
            aria-describedby="tpl-count tpl-errors"
          />
        </label>
        <div className="st-editor-meta">
          <span id="tpl-count" className={`t-caption num ${tooLong ? 'st-error-text' : 'muted'}`}>
            {body.length}
            {t.channel === 'push' ? ` / ${PUSH_LIMIT}` : ''} characters
          </span>
        </div>
        <div className="st-chips" role="group" aria-label="Insert a variable">
          {VARIABLES.map((v) => (
            <button key={v} className="st-chip st-chip--var t-body-sm" onClick={() => insert(v)}>
              {`{${v}}`}
            </button>
          ))}
        </div>
        {(errors.length > 0 || saveError) && (
          <ul id="tpl-errors" className="st-errors" role="alert">
            {[...errors, saveError].filter(Boolean).map((e) => (
              <li key={e} className="t-body-sm">
                <Icon name="alert" size={16} />
                {e}
              </li>
            ))}
          </ul>
        )}
        <div className="st-editor-actions">
          <StaffButton onClick={save} disabled={!dirty || errors.length > 0}>
            Save
          </StaffButton>
          <StaffButton variant="secondary" onClick={() => setParams({ sheet: 'preview' }, { replace: true })}>
            Preview
          </StaffButton>
          {dirty && (
            <StaffButton variant="text" onClick={() => setBody(t.body)}>
              Undo changes
            </StaffButton>
          )}
        </div>
        <p className="t-caption muted">Last edited by {edited(t)}</p>
      </Panel>

      {/* OA-03 Preview with sample data, as a push message or in the app */}
      {sheet === 'preview' && (
        <Modal title="Preview" onClose={() => setParams({}, { replace: true })}>
          <div className="st-chips" role="group" aria-label="Show as">
            {(['push', 'in-app'] as const).map((c) => (
              <button key={c} className={`st-chip t-button ${as === c ? 'is-active' : ''}`} aria-pressed={as === c} onClick={() => setAs(c)}>
                {c === 'push' ? 'Push message' : 'In the app'}
              </button>
            ))}
          </div>
          {as === 'push' ? (
            <div className="st-push">
              <span className="st-push__app t-caption">MEGS' CAFE · now</span>
              <span className="t-h3">{t.title}</span>
              <span className="t-body-sm">{fill(body, sampleVars)}</span>
            </div>
          ) : (
            <div className="st-inapp">
              <span className="st-inapp__dot" aria-hidden />
              <span className="st-inapp__text">
                <span className="t-h3">{t.title}</span>
                <span className="t-body-sm muted">{fill(body, sampleVars)}</span>
                <span className="t-caption muted">Just now</span>
              </span>
            </div>
          )}
          <p className="t-caption muted">Sample data: Maria, order #1043, 10 min, Ube Lava.</p>
        </Modal>
      )}
    </div>
  )
}
