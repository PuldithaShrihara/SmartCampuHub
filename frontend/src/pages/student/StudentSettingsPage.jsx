import { useEffect, useMemo, useRef, useState } from 'react'
import { GoogleLogin, googleLogout } from '@react-oauth/google'
import {
  FaBell,
  FaCalendar,
  FaCog,
  FaExclamationTriangle,
  FaLock,
  FaPalette,
  FaQuestionCircle,
  FaShieldAlt,
  FaUser,
} from 'react-icons/fa'
import {
  cancelAccountDeletionRequest,
  changePassword,
  downloadMyDataExport,
  getMe,
  linkGoogleAccount,
  requestAccountDeletion,
  resendMyVerification,
  unlinkGoogleAccount,
  updatePreferences,
  updateProfile,
  uploadAvatar,
} from '../../api/meApi.js'
import { createIncident } from '../../api/incidentApi.js'
import { fetchActiveResourcesByCategory } from '../../api/resourceApi.js'
import { useAuth } from '../../context/useAuth.js'
import { useGoogleClientId } from '../../context/GoogleClientIdContext.jsx'
import { applyTheme } from '../../utils/theme.js'
import '../../styles/StudentSettingsPage.css'

const TABS = [
  { id: 'profile', label: 'Profile', icon: FaUser },
  { id: 'security', label: 'Security', icon: FaLock },
  { id: 'notifications', label: 'Notifications', icon: FaBell },
  { id: 'booking', label: 'Booking', icon: FaCalendar },
  { id: 'incident', label: 'Incidents', icon: FaExclamationTriangle },
  { id: 'appearance', label: 'Appearance', icon: FaPalette },
  { id: 'privacy', label: 'Privacy & Data', icon: FaShieldAlt },
  { id: 'help', label: 'Help', icon: FaQuestionCircle },
]

function initialsFor(name, email) {
  const source = (name && name.trim()) || (email && email.split('@')[0]) || ''
  const parts = source.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function formatDateTime(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return String(value)
  }
}

function Banner({ tone, children, onClose }) {
  if (!children) return null
  return (
    <div className={`settings-banner ${tone || 'info'}`}>
      <span>{children}</span>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          style={{
            float: 'right',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
            fontWeight: 700,
          }}
        >
          ×
        </button>
      ) : null}
    </div>
  )
}

function Toggle({ checked, onChange, title, description, disabled }) {
  return (
    <label className="settings-toggle">
      <span className="settings-toggle-text">
        <span className="settings-toggle-title">{title}</span>
        {description ? (
          <span className="settings-toggle-desc">{description}</span>
        ) : null}
      </span>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
    </label>
  )
}

export default function StudentSettingsPage() {
  const { user, refreshMe, setPreferences: setContextPreferences } = useAuth()
  const googleClientId = useGoogleClientId()
  // `user` is intentionally read for future avatar/header refreshes.
  void user
  const fileInputRef = useRef(null)

  const [activeTab, setActiveTab] = useState('profile')
  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [profileName, setProfileName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' })
  const [savingPassword, setSavingPassword] = useState(false)
  const [resending, setResending] = useState(false)
  const [linkingGoogle, setLinkingGoogle] = useState(false)
  const [unlinkingGoogle, setUnlinkingGoogle] = useState(false)

  const [prefs, setPrefs] = useState(null)
  const [savingPrefs, setSavingPrefs] = useState(false)

  const [resourceCategories, setResourceCategories] = useState([])

  const [bugTitle, setBugTitle] = useState('')
  const [bugDescription, setBugDescription] = useState('')
  const [submittingBug, setSubmittingBug] = useState(false)
  const [bugResources, setBugResources] = useState([])
  const [bugResourceId, setBugResourceId] = useState('')

  const [exporting, setExporting] = useState(false)
  const [requestingDelete, setRequestingDelete] = useState(false)
  const [cancellingDelete, setCancellingDelete] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await getMe()
        if (cancelled) return
        setMe(data)
        setProfileName(data?.fullName || '')
        setPrefs(data?.preferences || {})
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to load profile')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [spaces, equipment] = await Promise.all([
          fetchActiveResourcesByCategory('SPACE').catch(() => []),
          fetchActiveResourcesByCategory('EQUIPMENT').catch(() => []),
        ])
        const merged = [...(Array.isArray(spaces) ? spaces : []), ...(Array.isArray(equipment) ? equipment : [])]
        if (!cancelled) setBugResources(merged.filter((r) => r && r.id))
        const cats = new Set()
        merged.forEach((r) => {
          const c = String(r?.category || '').toUpperCase()
          if (c) cats.add(c)
        })
        if (!cancelled) setResourceCategories(Array.from(cats))
      } catch {
        if (!cancelled) setBugResources([])
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  function clearBanners() {
    setError('')
    setSuccess('')
  }

  async function handleProfileSave(e) {
    e.preventDefault()
    clearBanners()
    setSavingProfile(true)
    try {
      const updated = await updateProfile({ fullName: profileName })
      setMe(updated)
      await refreshMe()
      setSuccess('Profile updated.')
    } catch (err) {
      setError(err?.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleAvatarPick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    clearBanners()
    try {
      const updated = await uploadAvatar(file)
      setMe(updated)
      await refreshMe()
      setSuccess('Avatar updated.')
    } catch (err) {
      setError(err?.message || 'Failed to upload avatar')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handlePasswordSave(e) {
    e.preventDefault()
    clearBanners()
    if (!pwd.current || !pwd.next) {
      setError('Current and new password are required.')
      return
    }
    if (pwd.next.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    if (pwd.next !== pwd.confirm) {
      setError('New passwords do not match.')
      return
    }
    setSavingPassword(true)
    try {
      await changePassword({ currentPassword: pwd.current, newPassword: pwd.next })
      setPwd({ current: '', next: '', confirm: '' })
      setSuccess('Password changed.')
    } catch (err) {
      setError(err?.message || 'Failed to change password')
    } finally {
      setSavingPassword(false)
    }
  }

  async function handleResendVerification() {
    clearBanners()
    setResending(true)
    try {
      await resendMyVerification()
      setSuccess('Verification OTP sent. Check your email.')
    } catch (err) {
      setError(err?.message || 'Failed to send verification email')
    } finally {
      setResending(false)
    }
  }

  async function handleGoogleLinkSuccess(credentialResponse) {
    const idToken = credentialResponse?.credential
    if (!idToken) {
      setError('Google did not return a credential.')
      return
    }
    clearBanners()
    setLinkingGoogle(true)
    try {
      const updated = await linkGoogleAccount(idToken)
      setMe(updated)
      setSuccess('Google account linked.')
      try {
        googleLogout()
      } catch {
        /* ignore */
      }
    } catch (err) {
      setError(err?.message || 'Failed to link Google account')
    } finally {
      setLinkingGoogle(false)
    }
  }

  async function handleGoogleUnlink() {
    if (!confirm('Unlink Google account from this profile?')) return
    clearBanners()
    setUnlinkingGoogle(true)
    try {
      const updated = await unlinkGoogleAccount()
      setMe(updated)
      setSuccess('Google account unlinked.')
    } catch (err) {
      setError(err?.message || 'Failed to unlink Google account')
    } finally {
      setUnlinkingGoogle(false)
    }
  }

  async function persistPrefs(patch, successMessage = 'Preferences saved.') {
    clearBanners()
    setSavingPrefs(true)
    try {
      const updated = await updatePreferences(patch)
      setMe(updated)
      setPrefs(updated?.preferences || {})
      setContextPreferences(updated?.preferences || null)
      if (patch?.theme) {
        applyTheme(patch.theme)
      }
      setSuccess(successMessage)
    } catch (err) {
      setError(err?.message || 'Failed to save preferences')
    } finally {
      setSavingPrefs(false)
    }
  }

  function setPrefsField(key, value) {
    setPrefs((prev) => ({ ...(prev || {}), [key]: value }))
  }

  async function handleExport() {
    clearBanners()
    setExporting(true)
    try {
      await downloadMyDataExport()
      setSuccess('Data export downloaded.')
    } catch (err) {
      setError(err?.message || 'Failed to download export')
    } finally {
      setExporting(false)
    }
  }

  async function handleRequestDelete() {
    if (!confirm('Request account deletion? An administrator will review your request.')) return
    clearBanners()
    setRequestingDelete(true)
    try {
      const updated = await requestAccountDeletion()
      setMe(updated)
      setSuccess('Account deletion requested.')
    } catch (err) {
      setError(err?.message || 'Failed to request deletion')
    } finally {
      setRequestingDelete(false)
    }
  }

  async function handleCancelDelete() {
    clearBanners()
    setCancellingDelete(true)
    try {
      const updated = await cancelAccountDeletionRequest()
      setMe(updated)
      setSuccess('Deletion request cancelled.')
    } catch (err) {
      setError(err?.message || 'Failed to cancel deletion')
    } finally {
      setCancellingDelete(false)
    }
  }

  async function handleBugSubmit(e) {
    e.preventDefault()
    clearBanners()
    if (!bugTitle.trim() || !bugDescription.trim() || !bugResourceId) {
      setError('Title, description and a resource are required for a bug report.')
      return
    }
    setSubmittingBug(true)
    try {
      await createIncident({
        title: bugTitle.trim(),
        description: bugDescription.trim(),
        resourceId: bugResourceId,
      })
      setBugTitle('')
      setBugDescription('')
      setBugResourceId('')
      setSuccess('Thanks! Your bug report was submitted as an incident.')
    } catch (err) {
      setError(err?.message || 'Failed to submit bug report')
    } finally {
      setSubmittingBug(false)
    }
  }

  const verifiedBadge = useMemo(() => {
    if (!me) return null
    if (me.verified === false) {
      return <span className="settings-pill warn">Not verified</span>
    }
    if (me.verified === true) {
      return <span className="settings-pill success">Verified</span>
    }
    return <span className="settings-pill muted">Unknown</span>
  }, [me])

  if (loading) {
    return (
      <div className="settings-section">
        <h2>Settings</h2>
        <p className="settings-section-desc">Loading your profile…</p>
      </div>
    )
  }

  const canChangePassword = me?.hasPassword

  return (
    <div className="settings-page">
      <aside className="settings-tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon || FaCog
          return (
            <button
              key={tab.id}
              type="button"
              className={`settings-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="settings-tab-icon">
                <Icon />
              </span>
              {tab.label}
            </button>
          )
        })}
      </aside>

      <div className="settings-content">
        <Banner tone="success" onClose={() => setSuccess('')}>{success}</Banner>
        <Banner tone="error" onClose={() => setError('')}>{error}</Banner>

        {activeTab === 'profile' ? (
          <section className="settings-section">
            <h2>Profile</h2>
            <p className="settings-section-desc">
              Update how your name, photo and email appear across Smart Campus Hub.
            </p>

            <div className="settings-avatar-row">
              <div className="settings-avatar">
                {me?.avatarUrl ? (
                  <img src={me.avatarUrl} alt="Avatar" />
                ) : (
                  <span>{initialsFor(me?.fullName, me?.email)}</span>
                )}
              </div>
              <div className="settings-avatar-actions">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarPick}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="settings-btn secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload new photo
                </button>
                {me?.avatarUrl ? (
                  <button
                    type="button"
                    className="settings-btn outline-danger"
                    onClick={async () => {
                      try {
                        const updated = await updateProfile({ avatarUrl: '' })
                        setMe(updated)
                        setSuccess('Avatar removed.')
                      } catch (err) {
                        setError(err?.message || 'Failed to remove avatar')
                      }
                    }}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </div>

            <form onSubmit={handleProfileSave} className="settings-grid">
              <div className="settings-field">
                <label htmlFor="profile-name">Full name</label>
                <input
                  id="profile-name"
                  type="text"
                  value={profileName}
                  minLength={2}
                  maxLength={60}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                />
              </div>
              <div className="settings-field">
                <label htmlFor="profile-email">Email</label>
                <input id="profile-email" type="email" value={me?.email || ''} disabled />
              </div>
              <div className="settings-field">
                <label>Role</label>
                <input type="text" value={me?.role || 'STUDENT'} disabled />
              </div>
              <div className="settings-field">
                <label>Member since</label>
                <input type="text" value={formatDateTime(me?.createdAt)} disabled />
              </div>
              <div className="settings-field">
                <label>Email status</label>
                <div style={{ paddingTop: 6 }}>{verifiedBadge}</div>
              </div>
              <div className="settings-field">
                <label>Last login</label>
                <input type="text" value={formatDateTime(me?.lastLoginAt)} disabled />
              </div>

              <div className="settings-actions" style={{ gridColumn: '1 / -1' }}>
                <button type="submit" className="settings-btn" disabled={savingProfile}>
                  {savingProfile ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {activeTab === 'security' ? (
          <section className="settings-section">
            <h2>Security</h2>
            <p className="settings-section-desc">
              Change your password, manage Google sign-in, and verify your email.
            </p>

            {canChangePassword ? (
              <form onSubmit={handlePasswordSave} className="settings-grid">
                <div className="settings-field" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="pwd-current">Current password</label>
                  <input
                    id="pwd-current"
                    type="password"
                    value={pwd.current}
                    onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
                    autoComplete="current-password"
                    required
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="pwd-new">New password</label>
                  <input
                    id="pwd-new"
                    type="password"
                    value={pwd.next}
                    onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="pwd-confirm">Confirm new password</label>
                  <input
                    id="pwd-confirm"
                    type="password"
                    value={pwd.confirm}
                    onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
                <div className="settings-actions" style={{ gridColumn: '1 / -1' }}>
                  <button type="submit" className="settings-btn" disabled={savingPassword}>
                    {savingPassword ? 'Saving…' : 'Update password'}
                  </button>
                </div>
              </form>
            ) : (
              <Banner tone="info">
                Your account uses Google sign-in. Use the &quot;Forgot password&quot; flow to set a
                password before you can change it here.
              </Banner>
            )}

            <div className="settings-row">
              <div className="settings-row-meta">
                <span className="settings-row-title">Email verification</span>
                <span className="settings-row-desc">
                  Status: {verifiedBadge}
                </span>
              </div>
              {me?.verified === false ? (
                <button
                  type="button"
                  className="settings-btn secondary"
                  onClick={handleResendVerification}
                  disabled={resending}
                >
                  {resending ? 'Sending…' : 'Send verification OTP'}
                </button>
              ) : (
                <span className="settings-pill success">Verified</span>
              )}
            </div>

            <div className="settings-row">
              <div className="settings-row-meta">
                <span className="settings-row-title">Google account</span>
                <span className="settings-row-desc">
                  {me?.googleLinked
                    ? 'Linked. You can sign in with Google.'
                    : 'Not linked. Link your @my.sliit.lk Google account to enable Google sign-in.'}
                </span>
              </div>
              {me?.googleLinked ? (
                <button
                  type="button"
                  className="settings-btn outline-danger"
                  onClick={handleGoogleUnlink}
                  disabled={unlinkingGoogle || !me?.hasPassword}
                  title={
                    me?.hasPassword
                      ? ''
                      : 'Set a password before unlinking Google to avoid being locked out.'
                  }
                >
                  {unlinkingGoogle ? 'Unlinking…' : 'Unlink'}
                </button>
              ) : googleClientId ? (
                <div style={{ minWidth: 220 }}>
                  <GoogleLogin
                    onSuccess={handleGoogleLinkSuccess}
                    onError={() => setError('Google sign-in was cancelled or failed.')}
                    useOneTap={false}
                    text="signin_with"
                  />
                </div>
              ) : (
                <span className="settings-pill muted">Google not configured</span>
              )}
            </div>
            {linkingGoogle ? (
              <p className="settings-section-desc">Linking your Google account…</p>
            ) : null}

            <div className="settings-row">
              <div className="settings-row-meta">
                <span className="settings-row-title">Last login</span>
                <span className="settings-row-desc">{formatDateTime(me?.lastLoginAt)}</span>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === 'notifications' ? (
          <section className="settings-section">
            <h2>Notifications</h2>
            <p className="settings-section-desc">
              Choose which channels and categories receive notifications, and set quiet hours.
            </p>
            <div className="settings-grid cols-1">
              <Toggle
                title="Email notifications"
                description="Send important updates to your email."
                checked={prefs?.emailNotifications}
                onChange={(v) => setPrefsField('emailNotifications', v)}
              />
              <Toggle
                title="In-app notifications"
                description="Show notifications in the bell icon at the top of the page."
                checked={prefs?.inAppNotifications}
                onChange={(v) => setPrefsField('inAppNotifications', v)}
              />
              <Toggle
                title="Bookings"
                description="Status changes, approvals and reminders for your bookings."
                checked={prefs?.notifyBookings}
                onChange={(v) => setPrefsField('notifyBookings', v)}
              />
              <Toggle
                title="Incidents"
                description="Updates on incidents you have reported."
                checked={prefs?.notifyIncidents}
                onChange={(v) => setPrefsField('notifyIncidents', v)}
              />
              <Toggle
                title="Announcements"
                description="Campus-wide announcements from administrators."
                checked={prefs?.notifyAnnouncements}
                onChange={(v) => setPrefsField('notifyAnnouncements', v)}
              />
            </div>

            <div className="settings-grid" style={{ marginTop: 16 }}>
              <div className="settings-field">
                <label htmlFor="quiet-start">Quiet hours start</label>
                <input
                  id="quiet-start"
                  type="time"
                  value={prefs?.quietHoursStart || ''}
                  onChange={(e) => setPrefsField('quietHoursStart', e.target.value)}
                />
              </div>
              <div className="settings-field">
                <label htmlFor="quiet-end">Quiet hours end</label>
                <input
                  id="quiet-end"
                  type="time"
                  value={prefs?.quietHoursEnd || ''}
                  onChange={(e) => setPrefsField('quietHoursEnd', e.target.value)}
                />
              </div>
            </div>

            <div className="settings-actions">
              <button
                type="button"
                className="settings-btn"
                disabled={savingPrefs}
                onClick={() =>
                  persistPrefs({
                    emailNotifications: !!prefs?.emailNotifications,
                    inAppNotifications: !!prefs?.inAppNotifications,
                    notifyBookings: !!prefs?.notifyBookings,
                    notifyIncidents: !!prefs?.notifyIncidents,
                    notifyAnnouncements: !!prefs?.notifyAnnouncements,
                    quietHoursStart: prefs?.quietHoursStart || '',
                    quietHoursEnd: prefs?.quietHoursEnd || '',
                  })
                }
              >
                {savingPrefs ? 'Saving…' : 'Save notification preferences'}
              </button>
            </div>
          </section>
        ) : null}

        {activeTab === 'booking' ? (
          <section className="settings-section">
            <h2>Booking preferences</h2>
            <p className="settings-section-desc">
              Defaults applied when you start creating a new booking.
            </p>

            <div className="settings-grid">
              <div className="settings-field">
                <label htmlFor="default-cat">Default resource category</label>
                <select
                  id="default-cat"
                  value={prefs?.defaultResourceCategory || ''}
                  onChange={(e) => setPrefsField('defaultResourceCategory', e.target.value)}
                >
                  <option value="">No default</option>
                  <option value="SPACE">Space</option>
                  <option value="EQUIPMENT">Equipment</option>
                  {resourceCategories
                    .filter((c) => c !== 'SPACE' && c !== 'EQUIPMENT')
                    .map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                </select>
              </div>
              <div className="settings-field">
                <label htmlFor="default-duration">Default booking duration (minutes)</label>
                <input
                  id="default-duration"
                  type="number"
                  min={15}
                  max={1440}
                  value={prefs?.defaultBookingDurationMins ?? ''}
                  onChange={(e) =>
                    setPrefsField(
                      'defaultBookingDurationMins',
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                />
              </div>
              <div className="settings-field">
                <label htmlFor="default-view">Default booking view</label>
                <select
                  id="default-view"
                  value={prefs?.bookingViewMode || ''}
                  onChange={(e) => setPrefsField('bookingViewMode', e.target.value)}
                >
                  <option value="">No default</option>
                  <option value="LIST">List</option>
                  <option value="GRID">Grid</option>
                </select>
              </div>
            </div>

            <div className="settings-actions">
              <button
                type="button"
                className="settings-btn"
                disabled={savingPrefs}
                onClick={() =>
                  persistPrefs({
                    defaultResourceCategory: prefs?.defaultResourceCategory || '',
                    defaultBookingDurationMins: prefs?.defaultBookingDurationMins || null,
                    bookingViewMode: prefs?.bookingViewMode || '',
                  })
                }
              >
                {savingPrefs ? 'Saving…' : 'Save booking preferences'}
              </button>
            </div>
          </section>
        ) : null}

        {activeTab === 'incident' ? (
          <section className="settings-section">
            <h2>Incident preferences</h2>
            <p className="settings-section-desc">
              Defaults applied when you report a new incident.
            </p>

            <div className="settings-grid">
              <div className="settings-field">
                <label htmlFor="default-incident-cat">Default incident category</label>
                <input
                  id="default-incident-cat"
                  type="text"
                  value={prefs?.defaultIncidentCategory || ''}
                  onChange={(e) => setPrefsField('defaultIncidentCategory', e.target.value)}
                  placeholder="e.g. Equipment, Hardware, Network"
                />
              </div>
              <div className="settings-field">
                <label htmlFor="default-incident-loc">Default location</label>
                <input
                  id="default-incident-loc"
                  type="text"
                  value={prefs?.defaultIncidentLocation || ''}
                  onChange={(e) => setPrefsField('defaultIncidentLocation', e.target.value)}
                  placeholder="e.g. Building A, Lab 3"
                />
              </div>
            </div>

            <div className="settings-grid cols-1" style={{ marginTop: 12 }}>
              <Toggle
                title="Show only my incidents by default"
                description="When opening the incidents page, filter to incidents you reported."
                checked={prefs?.showOnlyMyIncidents}
                onChange={(v) => setPrefsField('showOnlyMyIncidents', v)}
              />
            </div>

            <div className="settings-actions">
              <button
                type="button"
                className="settings-btn"
                disabled={savingPrefs}
                onClick={() =>
                  persistPrefs({
                    defaultIncidentCategory: prefs?.defaultIncidentCategory || '',
                    defaultIncidentLocation: prefs?.defaultIncidentLocation || '',
                    showOnlyMyIncidents: !!prefs?.showOnlyMyIncidents,
                  })
                }
              >
                {savingPrefs ? 'Saving…' : 'Save incident preferences'}
              </button>
            </div>
          </section>
        ) : null}

        {activeTab === 'appearance' ? (
          <section className="settings-section">
            <h2>Appearance</h2>
            <p className="settings-section-desc">
              Customise theme, language, time zone and list density.
            </p>
            <div className="settings-grid">
              <div className="settings-field">
                <label htmlFor="theme">Theme</label>
                <select
                  id="theme"
                  value={prefs?.theme || 'LIGHT'}
                  onChange={(e) => {
                    setPrefsField('theme', e.target.value)
                    applyTheme(e.target.value)
                  }}
                >
                  <option value="LIGHT">Light</option>
                  <option value="DARK">Dark</option>
                </select>
              </div>
              <div className="settings-field">
                <label htmlFor="language">Language</label>
                <select
                  id="language"
                  value={prefs?.language || 'en'}
                  onChange={(e) => setPrefsField('language', e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="si">Sinhala</option>
                  <option value="ta">Tamil</option>
                </select>
              </div>
              <div className="settings-field">
                <label htmlFor="tz">Time zone</label>
                <input
                  id="tz"
                  type="text"
                  value={prefs?.timeZone || ''}
                  onChange={(e) => setPrefsField('timeZone', e.target.value)}
                  placeholder="e.g. Asia/Colombo"
                />
              </div>
              <div className="settings-field">
                <label htmlFor="ipp">Items per page</label>
                <input
                  id="ipp"
                  type="number"
                  min={5}
                  max={200}
                  value={prefs?.itemsPerPage ?? ''}
                  onChange={(e) =>
                    setPrefsField(
                      'itemsPerPage',
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                />
              </div>
            </div>

            <div className="settings-actions">
              <button
                type="button"
                className="settings-btn"
                disabled={savingPrefs}
                onClick={() =>
                  persistPrefs({
                    theme: prefs?.theme || 'LIGHT',
                    language: prefs?.language || 'en',
                    timeZone: prefs?.timeZone || '',
                    itemsPerPage: prefs?.itemsPerPage || null,
                  })
                }
              >
                {savingPrefs ? 'Saving…' : 'Save appearance'}
              </button>
            </div>
          </section>
        ) : null}

        {activeTab === 'privacy' ? (
          <section className="settings-section">
            <h2>Privacy &amp; data</h2>
            <p className="settings-section-desc">
              Download a copy of your data or request to delete your account.
            </p>

            <div className="settings-row">
              <div className="settings-row-meta">
                <span className="settings-row-title">Download my data</span>
                <span className="settings-row-desc">
                  Profile, bookings and incidents as a JSON file.
                </span>
              </div>
              <button
                type="button"
                className="settings-btn secondary"
                onClick={handleExport}
                disabled={exporting}
              >
                {exporting ? 'Preparing…' : 'Download'}
              </button>
            </div>

            <div className="settings-row">
              <div className="settings-row-meta">
                <span className="settings-row-title">Account deletion</span>
                <span className="settings-row-desc">
                  {me?.deletionRequested
                    ? 'You have requested account deletion. An administrator will review your request.'
                    : 'Submit a request for an administrator to delete your account.'}
                </span>
              </div>
              {me?.deletionRequested ? (
                <button
                  type="button"
                  className="settings-btn secondary"
                  onClick={handleCancelDelete}
                  disabled={cancellingDelete}
                >
                  {cancellingDelete ? 'Cancelling…' : 'Cancel request'}
                </button>
              ) : (
                <button
                  type="button"
                  className="settings-btn danger"
                  onClick={handleRequestDelete}
                  disabled={requestingDelete}
                >
                  {requestingDelete ? 'Requesting…' : 'Request deletion'}
                </button>
              )}
            </div>
          </section>
        ) : null}

        {activeTab === 'help' ? (
          <section className="settings-section">
            <h2>Help &amp; info</h2>
            <p className="settings-section-desc">
              App information and quick ways to get support.
            </p>

            <div className="settings-row">
              <div className="settings-row-meta">
                <span className="settings-row-title">App version</span>
                <span className="settings-row-desc">Smart Campus Hub · Frontend 0.0.0</span>
              </div>
            </div>
            <div className="settings-row">
              <div className="settings-row-meta">
                <span className="settings-row-title">Terms &amp; Privacy</span>
                <span className="settings-row-desc">
                  Read how Smart Campus Hub handles your data.
                </span>
              </div>
              <a
                className="settings-btn secondary"
                href="/"
                onClick={(e) => e.preventDefault()}
              >
                View
              </a>
            </div>

            <h3 style={{ marginTop: 24, marginBottom: 12 }}>Report a bug</h3>
            <p className="settings-section-desc">
              Reports are submitted as incidents so the technician team is notified automatically.
            </p>
            <form onSubmit={handleBugSubmit} className="settings-grid">
              <div className="settings-field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="bug-title">Title</label>
                <input
                  id="bug-title"
                  type="text"
                  value={bugTitle}
                  onChange={(e) => setBugTitle(e.target.value)}
                  required
                />
              </div>
              <div className="settings-field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="bug-desc">Description</label>
                <textarea
                  id="bug-desc"
                  rows={4}
                  value={bugDescription}
                  onChange={(e) => setBugDescription(e.target.value)}
                  required
                />
              </div>
              <div className="settings-field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="bug-resource">Related resource</label>
                <select
                  id="bug-resource"
                  value={bugResourceId}
                  onChange={(e) => setBugResourceId(e.target.value)}
                  required
                >
                  <option value="">Select a resource</option>
                  {bugResources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name || r.title || r.id}
                    </option>
                  ))}
                </select>
              </div>
              <div className="settings-actions" style={{ gridColumn: '1 / -1' }}>
                <button type="submit" className="settings-btn" disabled={submittingBug}>
                  {submittingBug ? 'Submitting…' : 'Submit bug report'}
                </button>
              </div>
            </form>
          </section>
        ) : null}
      </div>
    </div>
  )
}
