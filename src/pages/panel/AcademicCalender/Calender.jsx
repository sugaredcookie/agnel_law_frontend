// import React, { useState } from "react";
// import { Calendar, momentLocalizer } from "react-big-calendar";
// import moment from "moment";
// import "react-big-calendar/lib/css/react-big-calendar.css";
// import PanelDashboardLayout from "../PanelDashboardLayout";

// const localizer = momentLocalizer(moment);

// const Calender = () => {
//   const [events, setEvents] = useState([]);
//   const [modalOpen, setModalOpen] = useState(false);
//   const [newEvent, setNewEvent] = useState({
//     title: "",
//     start: new Date(),
//     description: "",
//     type: "Holiday", // Default type
//   });

//   const handleSelectSlot = (slotInfo) => {
//     setNewEvent({ ...newEvent, start: slotInfo.start });
//     setModalOpen(true);
//   };

//   const handleEventSubmit = () => {
//     setEvents([...events, newEvent]);
//     setModalOpen(false);
//     setNewEvent({
//       title: "",
//       start: new Date(),
//       description: "",
//       type: "Holiday",
//     });
//   };

//   return (
//     <PanelDashboardLayout>
//       <div className="mb-4 text-2xl font-bold">Calendar</div>
//       <Calendar
//         localizer={localizer}
//         events={events}
//         startAccessor="start"
//         endAccessor="start"
//         selectable
//         style={{ height: 500 }}
//         onSelectSlot={handleSelectSlot}
//       />

//       {/* Modal for adding event */}
//       {modalOpen && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-30">
//           <div className="bg-white p-6 rounded-lg shadow-lg w-96">
//             <h2 className="text-lg font-bold mb-4">Create An Event</h2>
//             <form
//               onSubmit={(e) => {
//                 e.preventDefault();
//                 handleEventSubmit();
//               }}
//             >
//               <label className="block mb-2">
//                 Event Title:
//                 <input
//                   type="text"
//                   className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg"
//                   value={newEvent.title}
//                   onChange={(e) =>
//                     setNewEvent({ ...newEvent, title: e.target.value })
//                   }
//                 />
//               </label>
//               <label className="block mb-2">
//                 Event Date: {moment(newEvent.start).format("MMMM Do YYYY")}
//               </label>
//               <label className="block mb-2">
//                 Description:
//                 <textarea
//                   className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg"
//                   value={newEvent.description}
//                   onChange={(e) =>
//                     setNewEvent({ ...newEvent, description: e.target.value })
//                   }
//                 />
//               </label>

//               {/* Dropdown for selecting event type */}
//               <label className="block mb-4">
//                 Event Type:
//                 <select
//                   className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg"
//                   value={newEvent.type}
//                   onChange={(e) =>
//                     setNewEvent({ ...newEvent, type: e.target.value })
//                   }
//                 >
//                   <option value="Holiday">Holiday</option>
//                   <option value="Special Occasion">Special Occasion</option>
//                 </select>
//               </label>

//               <div className="flex justify-between">
//                 <button
//                   type="submit"
//                   className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
//                 >
//                   Create
//                 </button>
//                 <button
//                   type="button"
//                   className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
//                   onClick={() => setModalOpen(false)}
//                 >
//                   Close
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </PanelDashboardLayout>
//   );
// };

// export default Calender;

import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import PanelDashboardLayout from "../PanelDashboardLayout";
import {
  createEventViaAdmin,
  fetchAllEventsViaAdmin,
} from "../../../utils/Api";

const localizer = momentLocalizer(moment);

const Calender = () => {
  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    start: new Date(),
    description: "",
    type: "Holiday", // Default type
  });

  // Fetch events from the API when the component mounts
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetchAllEventsViaAdmin();

        // If the response is an object with events array, access the 'events' field
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

  console.log(events);

  const handleSelectSlot = (slotInfo) => {
    setNewEvent({ ...newEvent, start: slotInfo.start });
    setModalOpen(true);
  };

  const handleEventSubmit = async () => {
    try {
      console.log("Creating event:", newEvent);
      const createdEvent = await createEventViaAdmin(newEvent);
      setEvents([...events, createdEvent]);
      setModalOpen(false);
      setNewEvent({
        title: "",
        start: new Date(),
        description: "",
        type: "Holiday",
      });
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };
  const eventStyleGetter = (event) => {
    let backgroundColor = "#3174ad"; // Default color

    if (event.type === "Holiday") {
      backgroundColor = "#4299e1"; // Blue for Holidays
    } else if (event.type === "Special Occasion") {
      backgroundColor = "#d69e2e"; // Dark yellow for Special Occasions
    }

    const style = {
      backgroundColor,
      borderRadius: "5px",
      opacity: 0.8,
      color: "white",
      border: "0px",
      display: "block",
    };

    return {
      style,
    };
  };
  return (
    <PanelDashboardLayout>
      <div className="mb-4 text-2xl font-bold">Calendar</div>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="start"
        selectable
        eventPropGetter={eventStyleGetter}
        style={{ height: 500 }}
        onSelectSlot={handleSelectSlot}
      />

      {/* Modal for adding event */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-30">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">Create An Event</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEventSubmit();
              }}
            >
              <label className="block mb-2">
                Event Title:
                <input
                  type="text"
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                />
              </label>
              <label className="block mb-2">
                Event Date: {moment(newEvent.start).format("MMMM Do YYYY")}
              </label>
              <label className="block mb-2">
                Description:
                <textarea
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg"
                  value={newEvent.description}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, description: e.target.value })
                  }
                />
              </label>

              {/* Dropdown for selecting event type */}
              <label className="block mb-4">
                Event Type:
                <select
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg"
                  value={newEvent.type}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, type: e.target.value })
                  }
                >
                  <option value="Holiday">Holiday</option>
                  <option value="Special Occasion">Special Occasion</option>
                </select>
              </label>

              <div className="flex justify-between">
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                  Create
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  onClick={() => setModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PanelDashboardLayout>
  );
};

export default Calender;
