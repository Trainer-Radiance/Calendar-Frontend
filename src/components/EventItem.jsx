export default function EventItem({ title, start, end, memberName }) {
  // Function to determine color based on title keywords
  const getEventColor = () => {
    const titleLower = (title || '').toLowerCase();
    if (titleLower.includes('meeting')) return '#4f46e5'; // Indigo
    if (titleLower.includes('assessment')) return '#ec4899'; // Pink
    if (titleLower.includes('proxy')) return '#f97316'; // Orange
    if (titleLower.includes('resume') || titleLower.includes('interview')) return '#14b8a6'; // Teal
    return '#4f46e5'; // Default - Indigo
  };

  return (
    <div className="event-item" style={{ borderLeftColor: getEventColor() }}>
      <div className="event-content">
        <h3 className="event-title">{title || 'Untitled Event'}</h3>
        <div className="event-time">
          <span className="time-icon">⏱️</span>
          <span>{start} - {end}</span>
        </div>
        {memberName && (
          <div className="event-member" style={{ color: getEventColor() }}>
            <span className="member-icon">👤</span>
            <span className="member-name">{memberName}</span>
          </div>
        )}
      </div>
    </div>
  );
}
