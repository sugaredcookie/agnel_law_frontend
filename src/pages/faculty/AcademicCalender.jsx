import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import FacultyDashboardLayout from "./FacultyDashboardLayout";
import { fetchAllEventsViaAdmin } from "../../utils/Api";

const localizer = momentLocalizer(moment);

const AcademicCalender = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetchAllEventsViaAdmin();
        const fetchedEvents = Array.isArray(response)
          ? response
          : response.events;
        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };
    fetchEvents();
  }, []);

  const eventStyleGetter = (event) => {
    let backgroundColor = "#3174ad";
    if (event.type === "Holiday") {
      backgroundColor = "#4299e1";
    } else if (event.type === "Special Occasion") {
      backgroundColor = "#d69e2e";
    }
    return {
      style: {
        backgroundColor,
        borderRadius: "5px",
        opacity: 0.8,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
  };

  return (
    <FacultyDashboardLayout>
      <div className="mb-4 text-2xl font-bold">Academic Calender</div>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="start"
        eventPropGetter={eventStyleGetter}
        style={{ height: 500 }}
      />
    </FacultyDashboardLayout>
  );
};

export default AcademicCalender;
