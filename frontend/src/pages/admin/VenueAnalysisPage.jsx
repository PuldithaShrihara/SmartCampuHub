import { useParams, Link } from 'react-router-dom'
import { FaArrowLeft } from 'react-icons/fa'
import WeeklyAnalysis from '../../components/dashboard/WeeklyAnalysis'

export default function VenueAnalysisPage() {
  const { venueId } = useParams()
  
  // In a real app, fetch venue details based on venueId
  const venueName = venueId ? venueId.replace(/-/g, ' ').toUpperCase() : 'Main Hall'

  return (
    <div className="venue-analysis-page">
      <div style={{ marginBottom: 20 }}>
        <Link to="/admin" className="cal-btn" style={{ width: 'fit-content' }}>
          <FaArrowLeft size={12} /> Back to Dashboard
        </Link>
      </div>
      
      <WeeklyAnalysis venueName={venueName} />
    </div>
  )
}
