import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { getBookingByQrToken } from '../../api/bookingApi.js'
import './ScanQrPage.css'

export default function ScanQrPage() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const detectorRef = useRef(null)
  const frameRef = useRef(null)
  const scanningRef = useRef(false)
  const fileInputRef = useRef(null)
  const processingRef = useRef(false)
  const lastFrameDecodeAtRef = useRef(0)

  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const [loadingResult, setLoadingResult] = useState(false)
  const [booking, setBooking] = useState(null)
  const [manualToken, setManualToken] = useState('')
  const [scanStatus, setScanStatus] = useState('idle') // idle | scanning | success | invalid | error
  const lastScanRef = useRef({ token: '', at: 0 })

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  async function startScanner() {
    setScanError('')
    setBooking(null)
    setScanStatus('scanning')

    detectorRef.current = null
    if (window.BarcodeDetector) {
      try {
        const formats = await window.BarcodeDetector.getSupportedFormats()
        const desired = ['qr_code']
        const supported = desired.filter((item) => formats.includes(item))
        detectorRef.current = new window.BarcodeDetector({
          formats: supported.length > 0 ? supported : formats,
        })
      } catch {
        detectorRef.current = null
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      scanningRef.current = true
      setIsScanning(true)
      frameRef.current = requestAnimationFrame(scanFrame)
    } catch (err) {
      setScanError(err?.message || 'Camera access denied or not available.')
      setScanStatus('error')
      stopScanner()
    }
  }

  function stopScanner() {
    scanningRef.current = false
    setIsScanning(false)
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    processingRef.current = false
  }

  async function scanFrame() {
    if (!scanningRef.current || !videoRef.current || !canvasRef.current) {
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const now = Date.now()
    if (processingRef.current || now - lastFrameDecodeAtRef.current < 220) {
      frameRef.current = requestAnimationFrame(scanFrame)
      return
    }
    processingRef.current = true
    lastFrameDecodeAtRef.current = now

    if (video.readyState < 2) {
      processingRef.current = false
      frameRef.current = requestAnimationFrame(scanFrame)
      return
    }
    const w = video.videoWidth
    const h = video.videoHeight

    if (!w || !h) {
      processingRef.current = false
      frameRef.current = requestAnimationFrame(scanFrame)
      return
    }

    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      processingRef.current = false
      frameRef.current = requestAnimationFrame(scanFrame)
      return
    }
    ctx.drawImage(video, 0, 0, w, h)

    let rawValue = ''
    if (detectorRef.current) {
      try {
        const detected = await detectorRef.current.detect(canvas)
        if (detected && detected.length > 0) {
          rawValue = detected[0]?.rawValue || ''
        }
      } catch {
        rawValue = ''
      }
    } else {
      try {
        const imageData = ctx.getImageData(0, 0, w, h)
        const result = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        })
        rawValue = result?.data || ''
      } catch {
        rawValue = ''
      }
    }

    if (rawValue) {
      const token = extractToken(rawValue)
      if (!token) {
        setScanStatus('invalid')
        setScanError('QR detected but token format is invalid. Keep camera steady and retry.')
        processingRef.current = false
        frameRef.current = requestAnimationFrame(scanFrame)
        return
      }
      const now = Date.now()
      // Prevent hammering the same unreadable QR every frame.
      if (
        lastScanRef.current.token === token &&
        now - lastScanRef.current.at < 1800
      ) {
        processingRef.current = false
        frameRef.current = requestAnimationFrame(scanFrame)
        return
      }
      lastScanRef.current = { token, at: now }

      const ok = await fetchBooking(token)
      if (ok) {
        setScanStatus('success')
        stopScanner()
        processingRef.current = false
        return
      }
      setScanStatus('invalid')

      if (scanningRef.current) {
        processingRef.current = false
        frameRef.current = requestAnimationFrame(scanFrame)
      }
      return
    }

    processingRef.current = false
    frameRef.current = requestAnimationFrame(scanFrame)
  }

  async function fetchBooking(token) {
    try {
      setLoadingResult(true)
      setScanError('')
      const data = await getBookingByQrToken(token)
      setBooking(data || null)
      if (!data) {
        setScanError('QR verified but booking details are empty.')
        return false
      }
      return true
    } catch (err) {
      setBooking(null)
      const msg = String(err?.message || 'Failed to fetch booking by QR token.')
      if (msg.toLowerCase().includes('not found')) {
        setScanError('QR scanned, but booking was not found in the current environment/database.')
      } else if (msg.toLowerCase().includes('already scanned')) {
        setScanError('This QR has already been scanned.')
      } else if (msg.toLowerCase().includes('no longer valid') || msg.toLowerCase().includes('gone')) {
        setScanError('This QR is no longer valid for verification.')
      } else {
        setScanError(msg)
      }
      return false
    } finally {
      setLoadingResult(false)
    }
  }

  async function handleManualLookup(e) {
    e.preventDefault()
    const token = extractToken(manualToken)
    if (!token) {
      setScanError('Enter a valid QR token or verify-booking URL.')
      setScanStatus('invalid')
      return
    }
    const ok = await fetchBooking(token)
    if (ok && isScanning) {
      stopScanner()
    }
    setScanStatus(ok ? 'success' : 'error')
  }

  async function handleScreenshotFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setScanError('')
    setBooking(null)

    try {
      const imageBitmap = await createImageBitmap(file)
      const canvas = canvasRef.current || document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Failed to read uploaded image.')

      canvas.width = imageBitmap.width
      canvas.height = imageBitmap.height
      ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height)

      let rawValue = ''
      if (window.BarcodeDetector) {
        let detector = detectorRef.current
        if (!detector) {
          try {
            const formats = await window.BarcodeDetector.getSupportedFormats()
            const desired = ['qr_code']
            const supported = desired.filter((item) => formats.includes(item))
            detector = new window.BarcodeDetector({
              formats: supported.length > 0 ? supported : formats,
            })
            detectorRef.current = detector
          } catch {
            detector = null
          }
        }
        if (detector) {
          const detected = await detector.detect(canvas)
          rawValue = detected?.[0]?.rawValue || ''
        }
      }

      if (!rawValue) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        })
        rawValue = decoded?.data || ''
      }

      const token = extractToken(rawValue)
      if (!token) {
        setScanError('No readable QR token found in this screenshot.')
        setScanStatus('invalid')
        return
      }

      const ok = await fetchBooking(token)
      if (ok && isScanning) {
        stopScanner()
      }
      setScanStatus(ok ? 'success' : 'error')
    } catch (err) {
      setScanError(err?.message || 'Failed to scan QR from screenshot.')
      setScanStatus('error')
    }
  }

  return (
    <section className="dash-card qr-scan-page">
      <div className="qr-scan-head">
        <div>
          <h2>Scan QR</h2>
          <p>Scan booking QR code and view booking details instantly.</p>
        </div>
        <div className="qr-scan-actions">
          {!isScanning ? (
            <button type="button" className="dash-btn" onClick={startScanner}>Scan QR</button>
          ) : (
            <button type="button" className="dash-btn-outline" onClick={stopScanner}>Stop Scanning</button>
          )}
          <button
            type="button"
            className="dash-btn-outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={loadingResult}
          >
            Upload Screenshot
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleScreenshotFile}
          />
        </div>
      </div>

      <div className={`qr-status-badge ${scanStatus}`}>
        {scanStatus === 'idle' && 'Scanner idle'}
        {scanStatus === 'scanning' && 'Scanner active - point camera to QR code'}
        {scanStatus === 'success' && 'QR verified successfully'}
        {scanStatus === 'invalid' && 'Invalid/unmatched QR - scanner kept active'}
        {scanStatus === 'error' && 'Scanner error - check message below'}
      </div>

      <div className="qr-scan-camera-wrap">
        <video ref={videoRef} className="qr-scan-video" muted playsInline />
        <canvas ref={canvasRef} className="qr-scan-canvas" aria-hidden />
        {!isScanning ? (
          <div className="qr-scan-overlay">Camera is idle. Click <strong>Scan QR</strong> to start.</div>
        ) : null}
      </div>

      <form className="qr-manual-form" onSubmit={handleManualLookup}>
        <input
          type="text"
          value={manualToken}
          onChange={(e) => setManualToken(e.target.value)}
          placeholder="Paste QR token or /verify-booking/<token> URL"
        />
        <button type="submit" className="dash-btn-outline" disabled={loadingResult}>Lookup</button>
      </form>

      {loadingResult ? <p>Loading booking details...</p> : null}
      {scanError ? <div className="dash-msg error">{scanError}</div> : null}

      {booking ? (
        <article className="qr-result-card">
          <h3>Booking Details</h3>
          <div className="qr-result-grid">
            <ResultItem label="Booking ID" value={booking.id} />
            <ResultItem label="Resource" value={booking.resourceName} />
            <ResultItem label="Resource Type" value={booking.resourceType} />
            <ResultItem label="Location" value={booking.resourceLocation} />
            <ResultItem label="User" value={booking.userName} />
            <ResultItem label="Date" value={booking.bookingDate} />
            <ResultItem label="Time" value={`${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}`} />
            <ResultItem label="Status" value={booking.status} />
            <ResultItem label="Purpose" value={booking.purpose} />
          </div>
        </article>
      ) : null}
    </section>
  )
}

function ResultItem({ label, value }) {
  return (
    <div className="qr-result-item">
      <span>{label}</span>
      <strong>{value === null || value === undefined || value === '' ? '-' : String(value)}</strong>
    </div>
  )
}

function formatTime(value) {
  const raw = String(value || '')
  if (!/^\d{2}:\d{2}/.test(raw)) return raw || '-'
  const [hh, mm] = raw.slice(0, 5).split(':').map(Number)
  const period = hh >= 12 ? 'PM' : 'AM'
  const hour12 = hh % 12 || 12
  return `${String(hour12).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${period}`
}

function extractToken(raw) {
  let text = String(raw || '').trim()
  if (!text) return ''
  try {
    text = decodeURIComponent(text)
  } catch {
    // ignore decode failures
  }
  text = text.replace(/^["']|["']$/g, '').trim()
  if (text.endsWith('/')) text = text.slice(0, -1).trim()

  try {
    const url = new URL(text)
    const fromQuery = url.searchParams.get('token') || url.searchParams.get('qrToken')
    if (fromQuery && fromQuery.trim()) return fromQuery.trim()
    const parts = url.pathname.split('/').filter(Boolean)
    const idx = parts.findIndex((p) => p === 'verify-booking')
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1].trim()
    if (parts.length > 0) return parts[parts.length - 1].trim()
  } catch {
    // not a URL
  }
  const maybe = text.split('/').filter(Boolean)
  const i = maybe.findIndex((p) => p === 'verify-booking')
  if (i >= 0 && maybe[i + 1]) return maybe[i + 1].trim()
  const queryMatch = text.match(/[?&](token|qrToken)=([^&#]+)/i)
  if (queryMatch?.[2]) {
    try {
      return decodeURIComponent(queryMatch[2]).trim()
    } catch {
      return queryMatch[2].trim()
    }
  }
  return text.split(/[?#]/)[0].trim()
}
