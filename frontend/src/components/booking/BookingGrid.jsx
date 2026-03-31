import BookingCard from './BookingCard.jsx'

const defaultResources = [
  {
    id: 'R-101',
    name: 'Lecture Hall A',
    location: 'Academic Block 1',
    capacity: 120,
    status: 'Available',
  },
  {
    id: 'R-102',
    name: 'Computer Lab 2',
    location: 'Engineering Block',
    capacity: 45,
    status: 'Ongoing',
  },
  {
    id: 'R-103',
    name: 'Seminar Room 3',
    location: 'Main Campus',
    capacity: 60,
    status: 'Reserved',
  },
  {
    id: 'R-104',
    name: 'Innovation Hub',
    location: 'Tech Park',
    capacity: 80,
    status: 'Out of Service',
  },
]

export default function BookingGrid({ resources = defaultResources }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: 14,
      }}
    >
      {resources.map((item) => (
        <BookingCard
          key={item.id}
          name={item.name}
          location={item.location}
          capacity={item.capacity}
          status={item.status}
        />
      ))}
    </div>
  )
}
