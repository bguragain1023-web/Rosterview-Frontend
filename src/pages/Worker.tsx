import { useState } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import { useUser } from "../contex/UserContext";
import { RosterCalendar } from "../components/worker/RosterCalendar";
import { AvailabilityPanel } from "../components/worker/AvailabilityPanel";
import { LeavePanel } from "../components/worker/LeavePanel";

type Section = "availability" | "leave" | "swaps" | "team";

const sections: { key: Section; label: string }[] = [
  { key: "availability", label: "Availability" },
  { key: "leave", label: "Leave" },
  { key: "swaps", label: "Swaps" },
  { key: "team", label: "My team" },
];

export const Worker = () => {
  const { user } = useUser();
  // null = no section open, just the calendar
  const [openSection, setOpenSection] = useState<Section | null>(null);
  // "Lifting state up": the panels and the calendar are siblings, so their
  // parent holds this counter. A panel bumps it after a change (availability,
  // leave), and the calendar reloads its red dots when it changes.
  const [calendarVersion, setCalendarVersion] = useState(0);
  const refreshCalendar = () => setCalendarVersion((v) => v + 1);

  const today = new Date().toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const openLabel = sections.find((s) => s.key === openSection)?.label;

  return (
    <div className="layoutWrapper p-3">
      <Container>
        <Row>
          <Col>
            <div className="title">Welcome {user?.name}</div>
            <span className="mutedDate">{user?.role?.toUpperCase()}</span>
            <br />
            <span className="mutedDate">{today}</span>
          </Col>
        </Row>

        <div className="mainScreenSection mt-4">
          <div className="quickActions d-flex gap-3 flex-wrap">
            {sections.map((s) => (
              <button
                key={s.key}
                type="button"
                className={`quickActionMenu ${openSection === s.key ? "active" : ""}`}
                onClick={() =>
                  setOpenSection(openSection === s.key ? null : s.key)
                }
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section panel */}
        {openSection && (
          <div className="mainScreenSection workerPanel mt-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="subtitle">{openLabel}</div>
              <Button
                size="sm"
                variant="outline-light"
                onClick={() => setOpenSection(null)}
              >
                Close
              </Button>
            </div>
            {openSection === "availability" && (
              <AvailabilityPanel onChanged={refreshCalendar} />
            )}
            {openSection === "leave" && (
              <LeavePanel onChanged={refreshCalendar} />
            )}
            {(openSection === "swaps" || openSection === "team") && (
              <p className="mutedDate mb-0">Coming soon.</p>
            )}
          </div>
        )}

        <div className="mainScreenSection mt-4">
          <RosterCalendar refreshKey={calendarVersion} />
        </div>
      </Container>
    </div>
  );
};
