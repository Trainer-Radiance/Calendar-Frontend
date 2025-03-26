import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import EventItem from './EventItem';
import { ChevronLeft, ChevronRight } from 'react-feather';
import React from 'react';
import { DATA_ENDPOINTS } from '../config/api';

export default function CalendarGrid({ selectedMember, setSelectedMember }) {
  const { user, timezone } = useAuth();
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - date.getDay());
    return date;
  });

  // Fetch members list
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch(DATA_ENDPOINTS.MEMBERS, {
          credentials: 'include',
        });
        const data = await res.json();
        setMembers(data);
      } catch (error) {
        console.error('Error fetching members:', error);
      }
    };

    if (user) fetchMembers();
  }, [user]);

  const formatTime = useCallback(
    (isoString) => {
      return new Date(isoString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone,
      });
    },
    [timezone]
  );

  const getWeekDays = useCallback(() => {
    const days = [];
    const date = new Date(currentWeekStart);
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(date);
      dayDate.setDate(date.getDate() + i);
      days.push(dayDate);
    }
    return days;
  }, [currentWeekStart]);

  const getWeekRangeString = useCallback(() => {
    const start = new Date(currentWeekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return `${start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: timezone,
    })} - ${end.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: timezone,
    })}`;
  }, [currentWeekStart, timezone]);

  const groupEventsByDay = useCallback(
    (events) => {
      return getWeekDays().reduce((acc, date) => {
        const dateString = date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          timeZone: timezone,
        });

        const dayEvents = events.filter((event) => {
          const eventDate = new Date(event.start.dateTime);
          return (
            eventDate.toLocaleDateString('en-US', { timeZone: timezone }) ===
            date.toLocaleDateString('en-US', { timeZone: timezone })
          );
        });

        acc[dateString] = dayEvents;
        return acc;
      }, {});
    },
    [getWeekDays, timezone]
  );

  const handleWeekChange = (direction) => {
    setCurrentWeekStart((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const startOfWeek = new Date(currentWeekStart);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999); // Set to end of day

        console.log('Date Range:', {
          start: startOfWeek.toISOString(),
          end: endOfWeek.toISOString(),
          timezone
        });

        let allEvents = [];
        
        if (selectedMember === 'all') {
          // Fetch events for all members
          const promises = members.map(member =>
            fetch(
              `${DATA_ENDPOINTS.AVAILABILITY(member.id)}?timezone=${encodeURIComponent(
                timezone
              )}&start=${startOfWeek.toISOString()}&end=${endOfWeek.toISOString()}`,
              { credentials: 'include' }
            ).then(res => res.json())
          );

          const results = await Promise.all(promises);
          console.log('API Response for all members:', results);
          results.forEach((memberEvents, index) => {
            const memberName = members[index].name;
            memberEvents.forEach(event => {
              event.memberName = memberName;
            });
            allEvents = [...allEvents, ...memberEvents];
          });
        } else {
          // Fetch events for single member
          const res = await fetch(
            `${DATA_ENDPOINTS.AVAILABILITY(selectedMember)}?timezone=${encodeURIComponent(
              timezone
            )}&start=${startOfWeek.toISOString()}&end=${endOfWeek.toISOString()}`,
            { credentials: 'include' }
          );
          const data = await res.json();
          console.log('API Response for single member:', data);
          allEvents = data;
        }

        const groupedEvents = groupEventsByDay(allEvents);
        console.log('Grouped Events:', groupedEvents);
        setEvents(groupedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && (selectedMember === 'all' || selectedMember)) {
      fetchEvents();
    }
  }, [user, selectedMember, timezone, currentWeekStart, groupEventsByDay, members]);

  if (!user) return <div className="auth-warning">Please login to view calendar</div>;

  if (!selectedMember) {
    return (
      <div className="auth-warning">
        Please select a member to view their calendar availability.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button className="nav-button" onClick={() => handleWeekChange('prev')}>
          <ChevronLeft size={24} />
          <span className="mobile-hidden">Previous Week</span>
        </button>

        <h2 className="week-range">{getWeekRangeString()}</h2>

        <button className="nav-button" onClick={() => handleWeekChange('next')}>
          <span className="mobile-hidden">Next Week</span>
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="calendar-grid">
        {getWeekDays().map((date) => {
          const dateString = date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            timeZone: timezone,
          });

          return (
            <div key={dateString} className="day-column">
              <div 
                className="day-header"
                onClick={() => setSelectedDate(date)}
                style={{ cursor: 'pointer' }}
              >
                <div className="weekday">
                  {date.toLocaleDateString('en-US', {
                    weekday: 'short',
                    timeZone: timezone,
                  })}
                </div>
                <div className="date">
                  {date.toLocaleDateString('en-US', {
                    day: 'numeric',
                    timeZone: timezone,
                  })}
                </div>
              </div>

              <div className="events-list">
                {(events[dateString] || []).map((event) => (
                  <EventItem
                    key={event.id}
                    title={event.summary}
                    start={formatTime(event.start.dateTime)}
                    end={formatTime(event.end.dateTime)}
                    memberName={selectedMember === 'all' ? event.memberName : null}
                  />
                ))}
                {events[dateString]?.length === 0 && (
                  <p className="no-events">No events</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedDate && (
        <DayDetailView
          date={selectedDate}
          events={Object.values(events).flat()}
          onClose={() => setSelectedDate(null)}
          timezone={timezone}
          selectedMember={selectedMember}
        />
      )}
    </div>
  );
}

// DayDetailView Component
const DayDetailView = ({ date, events, onClose, timezone, selectedMember }) => {
  const [members, setMembers] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch members list
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch(DATA_ENDPOINTS.MEMBERS, {
          credentials: 'include',
        });
        const data = await res.json();
        setMembers(data);
      } catch (error) {
        console.error('Error fetching members:', error);
      }
    };
    fetchMembers();
  }, []);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: timezone
    });
  };

  const formatTime = (time) => {
    const date = new Date(time);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone
    }).replace(/\s/g, ''); // Remove extra spaces for consistent display
  };

  // Filter events for the selected date
  const dateEvents = events.filter(event => {
    const eventDate = new Date(event.start.dateTime);
    return eventDate.toLocaleDateString('en-US', { timeZone: timezone }) === 
           date.toLocaleDateString('en-US', { timeZone: timezone });
  });

  // Group events by time block
  const getTimeBlocks = () => {
    const blocks = [];
    
    // Process the events and track their display status
    const processedEvents = {};
    const relevantMembers = selectedMember === 'all' ? members : members.filter(m => m.id === parseInt(selectedMember));
    
    // Function to calculate minutes since midnight
    const getMinutesSinceMidnight = (dateStr) => {
      const date = new Date(dateStr);
      return (date.getHours() * 60) + date.getMinutes();
    };

    // Calculate current time indicator position
    const getCurrentTimePosition = () => {
      const now = new Date();
      const selectedDateStr = date.toLocaleDateString('en-US', { timeZone: timezone });
      const currentDateStr = now.toLocaleDateString('en-US', { timeZone: timezone });
      
      if (selectedDateStr === currentDateStr) {
        const minutes = getMinutesSinceMidnight(now);
        return `${(minutes / 1440) * 100}%`;
      }
      return null;
    };

    relevantMembers.forEach(member => {
      processedEvents[member.id] = new Map();
      
      const memberEvents = dateEvents.filter(event => {
        if (selectedMember === 'all') {
          return event.memberName === member.name;
        } else {
          return true;
        }
      });

      memberEvents.sort((a, b) => new Date(a.start.dateTime) - new Date(b.start.dateTime));
      
      memberEvents.forEach(event => {
        const eventKey = `${event.id}-${event.start.dateTime}`;
        const startMinutes = getMinutesSinceMidnight(event.start.dateTime);
        const endMinutes = getMinutesSinceMidnight(event.end.dateTime);
        
        processedEvents[member.id].set(eventKey, {
          ...event,
          displayed: false,
          startMinutes,
          endMinutes,
          durationMinutes: endMinutes - startMinutes
        });
      });
    });

    const formatHourLabel = (hour) => {
      const timeDate = new Date(date);
      timeDate.setHours(hour, 0, 0, 0);
      return timeDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        hour12: true,
        timeZone: timezone
      }).replace(/\s/g, ''); // Remove extra spaces for consistent display
    };

    // Generate blocks for each hour
    for (let hour = 0; hour < 24; hour++) {
      const timeLabel = formatHourLabel(hour);
      const hourStartMinutes = hour * 60;
      const hourEndMinutes = (hour + 1) * 60;
      
      const memberSlots = relevantMembers.map(member => {
        const memberEventsList = Array.from(processedEvents[member.id].values());
        
        // Get all events that overlap with this hour
        const hourEvents = memberEventsList.filter(event => {
          if (event.displayed) return false;
          
          // Check if event overlaps with this hour
          const eventOverlapsHour = (
            (event.startMinutes < hourEndMinutes && event.endMinutes > hourStartMinutes) ||
            (event.startMinutes >= hourStartMinutes && event.startMinutes < hourEndMinutes)
          );
          
          if (eventOverlapsHour) {
            event.displayed = true;
            return true;
          }
          
          return false;
        });

        const isBusy = hourEvents.length > 0;
        
        const getEventType = (event) => {
          const titleLower = (event.summary || '').toLowerCase();
          if (titleLower.includes('meeting')) return 'meeting';
          if (titleLower.includes('assessment')) return 'assessment';
          if (titleLower.includes('half day')) return 'half-day';
          if (titleLower.includes('training')) return 'training';
          return 'default';
        };

        const getEventStyles = (event) => {
          // Calculate position based on minutes since start of day
          const startMinutes = event.startMinutes % 60;
          const durationInMinutes = Math.min(
            event.durationMinutes,
            60 - startMinutes // Cap at remaining minutes in the hour
          );
          
          // Calculate percentage-based positioning
          const topPercentage = (startMinutes / 60) * 100;
          const heightPercentage = (durationInMinutes / 60) * 100;
          
          return {
            position: 'absolute',
            top: `${topPercentage}%`,
            height: `${heightPercentage}%`,
            left: '0',
            right: '0',
            zIndex: event.startMinutes
          };
        };
        
        return (
          <div 
            key={member.id} 
            className={`time-slot ${isBusy ? 'busy' : 'available'}`}
          >
            {hourEvents.map((event) => (
              <div 
                key={`${event.id}-${hour}`}
                className={`event-details ${getEventType(event)}`}
                style={getEventStyles(event)}
                data-start-time={event.startMinutes}
              >
                <div className="event-title">
                  {event.summary}
                </div>
                <div className="event-time">
                  <span className="time-icon">⏱️</span>
                  {formatTime(event.start.dateTime)} - {formatTime(event.end.dateTime)}
                </div>
              </div>
            ))}
          </div>
        );
      });
      
      blocks.push(
        <div key={hour} className="time-block">
          <div className="time-label">{timeLabel}</div>
          <div className="slots-row">
            {memberSlots}
            {getCurrentTimePosition() && hour === Math.floor(getMinutesSinceMidnight(currentTime) / 60) && (
              <div 
                className="current-time-indicator" 
                style={{ 
                  top: `${((getMinutesSinceMidnight(currentTime) % 60) / 60) * 100}%` 
                }}
              />
            )}
          </div>
        </div>
      );
    }
    
    return blocks;
  };

  return (
    <div className="day-detail-overlay" onClick={onClose}>
      <div className="day-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="day-detail-header">
          <div>
            <h2>{formatDate(date)}</h2>
            <div className="timezone-display">Timezone: {timezone}</div>
          </div>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="availability-grid" data-view={selectedMember === 'all' ? 'all' : 'single'}>
          <div className="member-headers">
            <div className="time-header"></div>
            {selectedMember === 'all' ? members.map(member => (
              <div key={member.id} className="member-header">
                <div className="member-avatar" style={{ 
                  backgroundColor: `hsl(${member.id * 60}, 70%, 60%)`
                }}>
                  {member.name.charAt(0)}
                </div>
                <span className="member-name">{member.name}</span>
              </div>
            )) : (
              <div className="member-header">
                <div className="member-avatar" style={{ 
                  backgroundColor: `hsl(${members.find(m => m.id === parseInt(selectedMember))?.id * 60 || 0}, 70%, 60%)`
                }}>
                  {members.find(m => m.id === parseInt(selectedMember))?.name.charAt(0)}
                </div>
                <span className="member-name">
                  {members.find(m => m.id === parseInt(selectedMember))?.name}
                </span>
              </div>
            )}
          </div>

          <div className="time-blocks">
            {getTimeBlocks()}
          </div>
        </div>

        <div className="mobile-view-message">
          <h3>Switch to Desktop View</h3>
          <p>For a better experience viewing multiple team members' schedules, please use a desktop or tablet device.</p>
          <button className="action-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};