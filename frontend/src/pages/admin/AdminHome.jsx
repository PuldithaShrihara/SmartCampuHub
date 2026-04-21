import { useState, useEffect } from 'react'
import {
  FaArrowRight,
  FaBuilding,
  FaCalendarCheck,
  FaChartBar,
  FaDownload,
  FaExclamationTriangle,
  FaLightbulb,
  FaRegClock,
  FaTicketAlt,
  FaUserCheck,
  FaUsers
} from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'
import { fetchAiResourceInsights, fetchDashboardStats } from '../../api/dashboardApi.js'
import StatCard from '../../components/dashboard/StatCard.jsx'
import './AdminHome.css'

export default function AdminHome() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalResources: 0,
    totalBookings: 0,
    pendingApprovals: 0,
    totalUsers: 0
  })
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState(null)
  const [insightsLoading, setInsightsLoading] = useState(true)

  const topDemandItem = insights?.highDemandPredictions?.[0] || null
  const topUnderutilizedItem = insights?.underutilizedResources?.[0] || null
  const usageTrends = insights?.usageTrends || null

  const reportLines = insights
    ? [
        `AI RESOURCE DECISION REPORT`,
        `Generated: ${new Date(insights.generatedAt || Date.now()).toLocaleString()}`,
        '',
        `1) HIGH DEMAND PREDICTIONS`,
        ...(insights.highDemandPredictions?.length
          ? insights.highDemandPredictions.map(
              (item, index) =>
                `${index + 1}. ${item.resourceName} (${item.location}) | ${item.resourceType} | ${item.likelyWindow} | risk=${item.riskLevel} | avgRequests=${item.averageRequests}`
            )
          : ['No high demand predictions found.']),
        '',
        `2) UNDERUTILIZED RESOURCES`,
        ...(insights.underutilizedResources?.length
          ? insights.underutilizedResources.map(
              (item, index) =>
                `${index + 1}. ${item.resourceName} (${item.location}) | utilization=${Math.round((item.utilizationRate || 0) * 100)}% | approvals=${item.approvedBookings}`
            )
          : ['No underutilized resources found.']),
        '',
        `3) USAGE TRENDS`,
        `Current week bookings: ${usageTrends?.currentWeekBookings ?? 0}`,
        `Previous week bookings: ${usageTrends?.previousWeekBookings ?? 0}`,
        `Weekly demand change: ${usageTrends?.weeklyDemandChangePct ?? 0}%`,
        `Peak slot: ${usageTrends?.peakDay || 'N/A'} ${usageTrends?.peakWindow || ''}`.trim(),
        '',
        `4) ACTIONABLE RECOMMENDATIONS`,
        ...(insights.actionableRecommendations?.length
          ? insights.actionableRecommendations.map(
              (item, index) =>
                `${index + 1}. [${item.priority}] ${item.title} -> ${item.action} | reason: ${item.reason}`
            )
          : ['No recommendations generated.']),
      ]
    : []

  const handleDownloadReport = () => {
    if (!reportLines.length) return
    const reportText = reportLines.join('\n')
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `ai-resource-report-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  const now = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  const quickActions = [
    {
      label: 'Review all bookings',
      description: 'Approve, reject, and monitor booking requests.',
      path: '/admin/all-bookings',
      icon: FaCalendarCheck
    },
    {
      label: 'Manage resources',
      description: 'Update asset details and availability.',
      path: '/admin/resources',
      icon: FaBuilding
    },
    {
      label: 'Handle support tickets',
      description: 'Track open issues raised by users.',
      path: '/admin/tickets',
      icon: FaTicketAlt
    },
    {
      label: 'View platform statistics',
      description: 'Check trends and usage metrics.',
      path: '/admin/statistics',
      icon: FaChartBar
    }
  ]

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [statsData, insightData] = await Promise.all([
          fetchDashboardStats(),
          fetchAiResourceInsights(30),
        ])
        setStats(statsData)
        setInsights(insightData)
      } catch (err) {
        console.error('Failed to load dashboard data', err)
      } finally {
        setLoading(false)
        setInsightsLoading(false)
      }
    }
    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="admin-home admin-loading">
        <p>Loading admin dashboard...</p>
      </div>
    )
  }

  return (
    <div className="admin-home">
      <section className="welcome-banner">
        <div className="welcome-text">
          <p className="welcome-date">{now}</p>
          <h1>Welcome back, {user?.fullName?.split(' ')[0] || 'Admin'}! 👋</h1>
          <p>System Overview: Administrator Control Panel.</p>
        </div>
      </section>

      <div className="stats-grid">
        <StatCard
          title="Total Resources"
          value={stats.totalResources}
          unit="Assets"
          icon={FaBuilding}
          color="#484fd1"
        />
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings}
          unit="Total"
          icon={FaCalendarCheck}
          color="#10b981"
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          unit="Requests"
          icon={FaUserCheck}
          color="#ffb86c"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          unit="Members"
          icon={FaUsers}
          color="#ff85a1"
        />
      </div>

      <section className="ai-insights-section content-section">
        <div className="section-header">
          <h2>AI Resource Insights</h2>
          <Link to="/admin/statistics" className="view-all">Open Statistics</Link>
        </div>

        {insightsLoading ? (
          <p className="ai-insights-empty">Analyzing booking patterns...</p>
        ) : !insights ? (
          <p className="ai-insights-empty">AI insights unavailable. Please try again later.</p>
        ) : (
          <div className="ai-insights-grid">
            <article className="insight-card">
              <div className="insight-head">
                <FaExclamationTriangle className="insight-icon high" />
                <h3>High Demand Predictions</h3>
              </div>
              {insights.highDemandPredictions?.length ? (
                <div className="insight-list">
                  {insights.highDemandPredictions.slice(0, 3).map((item) => (
                    <div className="insight-item" key={`demand-${item.resourceId}-${item.likelyWindow}`}>
                      <div className="recommendation-top">
                        <strong>{item.resourceName}</strong>
                        <span className={`chip chip-${String(item.riskLevel || '').toLowerCase()}`}>{item.riskLevel}</span>
                      </div>
                      <small>{item.location} • {item.resourceType}</small>
                      <p>{item.likelyWindow} • {item.averageRequests} avg requests</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="ai-insights-empty">No significant demand spikes detected.</p>
              )}
            </article>

            <article className="insight-card">
              <div className="insight-head">
                <FaRegClock className="insight-icon low" />
                <h3>Underutilized Resources</h3>
              </div>
              {insights.underutilizedResources?.length ? (
                <div className="insight-list">
                  {insights.underutilizedResources.slice(0, 3).map((item) => (
                    <div className="insight-item" key={`under-${item.resourceId}`}>
                      <strong>{item.resourceName}</strong>
                      <small>{item.location} • {item.resourceType}</small>
                      <p>{Math.round((item.utilizationRate || 0) * 100)}% utilization • {item.approvedBookings} approvals</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="ai-insights-empty">No low-utilization resources currently flagged.</p>
              )}
            </article>

            <article className="insight-card">
              <div className="insight-head">
                <FaChartBar className="insight-icon trend" />
                <h3>Usage Trends</h3>
              </div>
              <div className="trend-metrics">
                <div>
                  <span>Current week</span>
                  <strong>{insights.usageTrends?.currentWeekBookings ?? 0}</strong>
                </div>
                <div>
                  <span>Previous week</span>
                  <strong>{insights.usageTrends?.previousWeekBookings ?? 0}</strong>
                </div>
                <div>
                  <span>Demand change</span>
                  <strong>{insights.usageTrends?.weeklyDemandChangePct ?? 0}%</strong>
                </div>
                <div>
                  <span>Peak slot</span>
                  <strong>{insights.usageTrends?.peakDay} {insights.usageTrends?.peakWindow}</strong>
                </div>
              </div>
            </article>

            <article className="insight-card insight-card-wide">
              <div className="insight-head">
                <FaLightbulb className="insight-icon action" />
                <h3>Actionable Recommendations</h3>
              </div>
              {insights.actionableRecommendations?.length ? (
                <div className="insight-list">
                  {insights.actionableRecommendations.slice(0, 4).map((item, index) => (
                    <div className="insight-item" key={`action-${index}`}>
                      <div className="recommendation-top">
                        <strong>{item.title}</strong>
                        <span className={`chip chip-${String(item.priority || '').toLowerCase()}`}>{item.priority}</span>
                      </div>
                      <p>{item.action}</p>
                      <small>{item.reason}</small>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="ai-insights-empty">No actions generated for this period.</p>
              )}
            </article>

            <article className="insight-card insight-card-wide decision-report-card">
              <div className="insight-head">
                <FaLightbulb className="insight-icon action" />
                <h3>Decision Support Report</h3>
                <button
                  type="button"
                  className="report-download-btn"
                  onClick={handleDownloadReport}
                  disabled={!reportLines.length}
                >
                  <FaDownload />
                  Export Report
                </button>
              </div>
              <div className="decision-report-grid">
                <div className="decision-report-item">
                  <span className="decision-label">Primary Expansion Need</span>
                  <strong>
                    {topDemandItem
                      ? `${topDemandItem.resourceName} (${topDemandItem.location})`
                      : 'No urgent high-demand resource'}
                  </strong>
                  <small>
                    {topDemandItem
                      ? `Predicted pressure at ${topDemandItem.likelyWindow} with ${topDemandItem.riskLevel} risk.`
                      : 'Monitor upcoming weekly demand to confirm growth.'}
                  </small>
                </div>
                <div className="decision-report-item">
                  <span className="decision-label">Reallocation Opportunity</span>
                  <strong>
                    {topUnderutilizedItem
                      ? `${topUnderutilizedItem.resourceName} (${topUnderutilizedItem.location})`
                      : 'No major underutilized asset'}
                  </strong>
                  <small>
                    {topUnderutilizedItem
                      ? `${Math.round((topUnderutilizedItem.utilizationRate || 0) * 100)}% utilization suggests possible reassignment.`
                      : 'Current resources are relatively balanced.'}
                  </small>
                </div>
                <div className="decision-report-item">
                  <span className="decision-label">Demand Direction</span>
                  <strong>
                    {(usageTrends?.weeklyDemandChangePct ?? 0) >= 0 ? 'Rising demand' : 'Falling demand'}
                  </strong>
                  <small>
                    Week-over-week change is {usageTrends?.weeklyDemandChangePct ?? 0}% with peak slot at{' '}
                    {usageTrends?.peakDay || 'N/A'} {usageTrends?.peakWindow || ''}.
                  </small>
                </div>
                <div className="decision-report-item">
                  <span className="decision-label">Admin Action Summary</span>
                  <strong>Create proposal for next resource update cycle</strong>
                  <small>
                    Use this report to justify adding a same-type resource, extending time slots, or reallocating low-use assets.
                  </small>
                </div>
              </div>
            </article>
          </div>
        )}
      </section>

      <section className="dashboard-sections">
        <div className="content-section">
          <div className="section-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="quick-actions-list">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.path} to={action.path} className="quick-action-item">
                  <span className="action-icon">
                    <Icon />
                  </span>
                  <span className="quick-action-meta">
                    <strong>{action.label}</strong>
                    <small>{action.description}</small>
                  </span>
                  <FaArrowRight />
                </Link>
              )
            })}
          </div>
        </div>

        <div className="content-section">
          <div className="section-header">
            <h2>Platform Snapshot</h2>
          </div>
          <div className="snapshot-list">
            <div className="snapshot-item">
              <span className="snapshot-label">Booking pressure</span>
              <span className="snapshot-value">{stats.totalBookings} requests tracked</span>
            </div>
            <div className="snapshot-item">
              <span className="snapshot-label">Pending decisions</span>
              <span className="snapshot-value">{stats.pendingApprovals} awaiting review</span>
            </div>
            <div className="snapshot-item">
              <span className="snapshot-label">Community size</span>
              <span className="snapshot-value">{stats.totalUsers} active members</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
