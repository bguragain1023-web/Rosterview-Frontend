import { useState } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import { useUser } from "../contex/UserContext";
import { MyTeamPanel } from "../components/worker/MyTeamPanel";
import { TeamSwapsPanel } from "../components/teamLeader/TeamSwapsPanel";
import { TeamLeavePanel } from "../components/teamLeader/TeamLeavePanel";
import { TeamRosterPanel } from "../components/teamLeader/TeamRosterPanel";

type Section = "roster" | "swaps" | "leave" | "team";

const sections: { key: Section; label: string }[] = [
  { key: "roster", label: "Team roster" },
  { key: "swaps", label: "Swaps" },
  { key: "leave", label: "Leave" },
  { key: "team", label: "My team" },
];

export const TeamLeader = () => {
  const { user } = useUser();
  // null = no section open
  const [openSection, setOpenSection] = useState<Section | null>(null);

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
            <span className="mutedDate">TEAM LEADER</span>
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
            {openSection === "roster" && <TeamRosterPanel />}
            {openSection === "swaps" && <TeamSwapsPanel />}
            {openSection === "leave" && <TeamLeavePanel />}
            {openSection === "team" && <MyTeamPanel />}
          </div>
        )}
      </Container>
    </div>
  );
};
