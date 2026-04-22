import React from 'react'
import '../../styles/StatCard.css'

export default function StatCard({ title, value, unit, icon: Icon, color, trend, progress }) {
    return (
        <div className="stat-card">
            <div className="stat-card-top">
                <div className="stat-card-icon" style={{ backgroundColor: `${color}15`, color: color }}>
                    <Icon />
                </div>
                {trend !== undefined && trend !== null && (
                    <div className="stat-card-trend" style={{ color: trend >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {trend >= 0 ? '+' : ''}{trend}%
                    </div>
                )}
            </div>
            <div className="stat-card-main">
                <h3>{value}<span>{unit}</span></h3>
                <p>{title}</p>
            </div>
            {progress !== undefined && (
                <div className="stat-card-progress-wrap">
                    <div className="stat-card-progress-bar" style={{ backgroundColor: `${color}20` }}>
                        <div
                            className="stat-card-progress-fill"
                            style={{ width: `${progress}%`, backgroundColor: color }}
                        ></div>
                    </div>
                </div>
            )}
        </div>
    )
}
