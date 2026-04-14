import { createElement, Fragment, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FaBuilding,
  FaCalendar,
  FaExclamationTriangle,
  FaBell,
  FaSearch,
  FaCheckCircle,
} from 'react-icons/fa'
import '../../styles/HomePage.css'
import heroGroup from '../../assets/hero-group.png'
import heroLibrary from '../../assets/hero-library.png'

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
    iconColor: '#6366f1',
    title: 'Facilities Management',
    description:
      'Manage and catalog all campus resources including lecture halls, labs, and equipment.',
  },
  {
    Icon: FaCalendar,
    iconColor: '#8b5cf6',
    title: 'Easy Booking System',
    description:
      'Book resources with conflict detection. Get instant approval notifications for your requests.',
  },
  {
    Icon: FaExclamationTriangle,
    iconColor: '#f43f5e',
    title: 'Incident Tracking',
    description:
      'Report and track maintenance issues. Assign to technicians and monitor resolution progress.',
  },
  {
    Icon: FaBell,
    iconColor: '#10b981',
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
      <header className="home-header">
        <div className="home-header-inner">
          <div className="home-logo">
            <span className="logo-accent">Smart</span> Campus
          </div>
          <nav className="home-nav">
            <a href="#features">Features</a>
            <a href="#how">How It Works</a>
            <Link to="/staff/login">Staff Portal</Link>
            <Link to="/student/login" className="nav-login">Login</Link>
            <button className="nav-register" onClick={goStudentSignup}>Register</button>
          </nav>
        </div>
      </header>

      <div className="home-container">
        <section className="home-hero-v2">
          <div className="hero-content">
            <h4 className="hero-sub">Best Digital Campus</h4>
            <h1 className="hero-title">
              Unified Education Platform <span className="text-gradient">for Modern Students</span>
            </h1>
            <p className="hero-desc">
              Manage your campus life efficiently. Book resources, track incidents, and stay updated with real-time notifications in one place.
            </p>
            <div className="hero-search-bar">
              <div className="search-input-wrap">
                <FaSearch className="search-icon" />
                <input type="text" placeholder="Search facilities or services..." />
              </div>
              <button className="search-btn" onClick={goStudentSignup}>Get Started</button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-container">
              <img src={heroGroup} alt="Students learning" className="img-primary" />
              <img src={heroLibrary} alt="Library" className="img-secondary" />
              <div className="hero-badge badge-discount">
                <FaCheckCircle className="badge-icon" />
                <div>
                  <p className="badge-text">Manage everything</p>
                  <p className="badge-sub">In one unified platform</p>
                </div>
              </div>
              <div className="hero-badge badge-expert">
                <FaCheckCircle className="badge-icon" />
                <div>
                  <p className="badge-text">24/7 Support</p>
                  <p className="badge-sub">Smart assistance</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="home-features-v2">
          <div className="section-header">
            <h2 className="section-title">Powerful Features</h2>
            <p className="section-desc">Streamlining operations for students and faculty alike.</p>
          </div>
          <div className="features-grid">
            {features.map(({ Icon, iconColor, title, description }) => (
              <article key={title} className="feature-card-v2">
                <div className="feature-icon-v2" style={{ backgroundColor: `${iconColor}22`, color: iconColor }}>
                  {createElement(Icon, { size: 24 })}
                </div>
                <h3 className="feature-card-title">{title}</h3>
                <p className="feature-card-desc">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how" className="home-how-v2">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-desc">Get started in four easy steps.</p>
          </div>
          <div className="steps-container-v2">
            {steps.map((step) => (
              <div key={step.num} className="step-card-v2">
                <div className="step-number-v2">{step.num}</div>
                <h3 className="step-title-v2">{step.title}</h3>
                <p className="step-desc-v2">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="home-cta-v2">
          <div className="cta-inner">
            <h2 className="cta-title">Ready to Experience Smart Campus?</h2>
            <p className="cta-desc">Join thousands of students and faculty members today.</p>
            <button className="cta-btn-v2" onClick={goStudentSignup}>Create Account Now</button>
          </div>
        </section>
      </div>

      <footer className="home-footer-v2">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="home-logo">Smart Campus</div>
            <p>Empowering the next generation of academic excellence.</p>
          </div>
          <div className="footer-links-grid">
            <div className="footer-group">
              <h4>Platform</h4>
              <Link to="/student/login">Student Portal</Link>
              <Link to="/staff/login">Staff Portal</Link>
              <Link to="/superadmin/login">Administration</Link>
            </div>
            <div className="footer-group">
              <h4>Support</h4>
              <a href="#about">About Us</a>
              <a href="#contact">Contact</a>
              <a href="#terms">Terms of Service</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Smart Campus Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
