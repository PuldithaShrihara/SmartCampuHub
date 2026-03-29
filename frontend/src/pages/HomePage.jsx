import { createElement, Fragment, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FaBuilding,
  FaCalendar,
  FaExclamationTriangle,
  FaBell,
} from 'react-icons/fa'
import './HomePage.css'

const steps = [
  {
    num: '1',
    title: 'Create Account',
    description:
      'Sign up with your university credentials or Google account',
  },
  {
    num: '2',
    title: 'Book Resources',
    description:
      'Browse available facilities and book them for your needs. Get instant conflict notifications.',
  },
  {
    num: '3',
    title: 'Track Incidents',
    description:
      'Report maintenance issues and track their resolution in real-time.',
  },
  {
    num: '4',
    title: 'Get Updates',
    description:
      'Receive notifications for all booking and ticket status changes.',
  },
]

const features = [
  {
    Icon: FaBuilding,
    iconColor: '#3f51b5',
    title: 'Facilities Management',
    description:
      'Manage and catalog all campus resources including lecture halls, labs, and equipment.',
  },
  {
    Icon: FaCalendar,
    iconColor: '#FF9800',
    title: 'Easy Booking System',
    description:
      'Book resources with conflict detection. Get instant approval notifications for your requests.',
  },
  {
    Icon: FaExclamationTriangle,
    iconColor: '#f44336',
    title: 'Incident Tracking',
    description:
      'Report and track maintenance issues. Assign to technicians and monitor resolution progress.',
  },
  {
    Icon: FaBell,
    iconColor: '#4CAF50',
    title: 'Real-time Notifications',
    description:
      'Stay updated with instant notifications for bookings, ticket updates, and system events.',
  },
]

function HomePage() {
  const navigate = useNavigate()
  const [reduceMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  const goStudentSignup = () => navigate('/student/signup')

  return (
    <div className="home-page" data-reduced-motion={reduceMotion || undefined}>
      <section className="home-hero" aria-label="Welcome">
        <div className="home-hero-inner">
          <h1 className="home-hero-title">Smart Campus Hub</h1>
          <p className="home-hero-tagline">
            Manage Campus Operations Efficiently
          </p>
          <p className="home-hero-desc">
            A unified platform for booking resources, managing incidents, and
            tracking notifications. Streamline your campus operations today.
          </p>
          <button type="button" className="home-btn" onClick={goStudentSignup}>
            Get Started
          </button>
        </div>
      </section>

      <section className="home-features" aria-labelledby="features-heading">
        <h2 id="features-heading" className="visually-hidden">
          Features
        </h2>
        <div className="home-features-inner">
          <div className="home-features-grid">
            {features.map(({ Icon, iconColor, title, description }) => (
              <article key={title} className="home-feature-card">
                <div className="home-feature-icon-wrap">
                  {createElement(Icon, {
                    size: 40,
                    color: iconColor,
                    'aria-hidden': true,
                  })}
                </div>
                <h3 className="home-feature-title">{title}</h3>
                <p className="home-feature-desc">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-how" aria-labelledby="how-heading">
        <div className="home-how-inner">
          <h2 id="how-heading" className="home-how-title">
            How It Works
          </h2>
          <div className="home-steps-row">
            {steps.map((step, index) => (
              <Fragment key={step.num}>
                {index > 0 ? (
                  <div className="home-step-connector" aria-hidden="true" />
                ) : null}
                <div className="home-step">
                  <div className="home-step-num">{step.num}</div>
                  <h3 className="home-step-title">{step.title}</h3>
                  <p className="home-step-desc">{step.description}</p>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      <section className="home-cta" aria-labelledby="cta-heading">
        <h2 id="cta-heading" className="home-cta-title">
          Ready to Streamline Campus Operations?
        </h2>
        <button type="button" className="home-btn" onClick={goStudentSignup}>
          Start Now
        </button>
      </section>

      <footer className="home-footer">
        <nav className="home-footer-links" aria-label="Footer">
          <Link className="home-footer-link" to="/student/login">
            Student login
          </Link>
          <span className="home-footer-sep" aria-hidden>
            |
          </span>
          <Link className="home-footer-link" to="/staff/login">
            Staff login
          </Link>
          <span className="home-footer-sep" aria-hidden>
            |
          </span>
          <Link className="home-footer-link" to="/superadmin/login">
            Superadmin
          </Link>
          <span className="home-footer-sep" aria-hidden>
            |
          </span>
          <a className="home-footer-link" href="#about">
            About
          </a>
          <span className="home-footer-sep" aria-hidden>
            |
          </span>
          <a className="home-footer-link" href="#contact">
            Contact
          </a>
          <span className="home-footer-sep" aria-hidden>
            |
          </span>
          <a className="home-footer-link" href="#privacy">
            Privacy Policy
          </a>
          <span className="home-footer-sep" aria-hidden>
            |
          </span>
          <a className="home-footer-link" href="#terms">
            Terms
          </a>
        </nav>
        <p className="home-footer-copy">
          © 2026 Smart Campus Hub. All rights reserved.
        </p>
      </footer>
    </div>
  )
}

export default HomePage
