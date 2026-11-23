import { useEffect, useState } from "react";
import { Button, Col, Container, Row } from "react-bootstrap";
import { useUser } from "../contex/UserContext";
import {
  getLeaveRequests,
  getShifts,
  getSwapRequests,
} from "../helper/axios";
import { addDays, startOfWeek, toDateInputValue } from "../utils/dates";
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

// null = couldn't load
interface AttentionCounts {
  unassigned: number | null;
  swaps: number | null;
  leave: number | null;
}

const attentionCards: {
  key: keyof AttentionCounts;
  label: string;
  tone: "orange" | "cyan";
  section: Section; // which section the card opens
}[] = [
  {
    key: "unassigned",
    label: "Unassigned shifts this week",
    tone: "orange",
    section: "roster",
  },
  {
    key: "swaps",
    label: "Swap requests to review",
    tone: "cyan",
    section: "swaps",
  },
  {
    key: "leave",
    label: "Leave requests pending",
    tone: "orange",
    section: "leave",
  },
];

export const TeamLeader = () => {
  const { user } = useUser();
  // null = no section open
  const [openSection, setOpenSection] = useState<Section | null>(null);

  // "Needs attention" counts
  const [attention, setAttention] = useState<AttentionCounts | null>(null); // null = loading
  const [attentionReloadKey, setAttentionReloadKey] = useState(0);
  const refreshAttention = () => setAttentionReloadKey((k) => k + 1);

  useEffect(() => {
    let ignore = false;
    // Same Monday–Sunday week the Team roster opens on, so the numbers match.
    const weekStart = startOfWeek(new Date());

    Promise.all([
      getShifts({
        from: toDateInputValue(weekStart),
        to: toDateInputValue(addDays(weekStart, 6)),
      }),
      getSwapRequests(["workerAccepted"]),
      getLeaveRequests(),
    ]).then(([shiftRes, swapRes, leaveRes]) => {
      if (ignore) return;
      setAttention({
        unassigned:
          shiftRes.status === "success"
            ? shiftRes.allShifts.filter((s) => s.status === "unassigned")
                .length
            : null,
        swaps:
          swapRes.status === "success" ? swapRes.swapRequests.length : null,
        leave:
          leaveRes.status === "success"
            ? leaveRes.leaveRequests.filter((l) => l.status === "pending")
                .length
            : null,
      });
    });

    return () => {
      ignore = true;
    };
  }, [attentionReloadKey]);

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
          <div className="subtitle">Needs attention</div>
          <div className="d-flex gap-3 mt-3 flex-wrap">
            {attentionCards.map((card) => {
              const count = attention ? attention[card.key] : undefined;
              const isClear = count === 0;
              return (
                <button
                  key={card.key}
                  type="button"
                  className={`attentionCard ${count ? card.tone : "clear"}`}
                  onClick={() => setOpenSection(card.section)}
                >
                  <span className="attentionCount">
                    {count === undefined ? "…" : count === null ? "—" : count}
                  </span>
                  <span className="attentionLabel">
                    {card.label}
                    {isClear && (
                      <span className="mutedDate d-block">All clear</span>
                    )}
                  </span>
                  <span className="attentionArrow">→</span>
                </button>
              );
            })}
          </div>
        </div>

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
            {openSection === "roster" && (
              <TeamRosterPanel onChanged={refreshAttention} />
            )}
            {openSection === "swaps" && (
              <TeamSwapsPanel onChanged={refreshAttention} />
            )}
            {openSection === "leave" && (
              <TeamLeavePanel onChanged={refreshAttention} />
            )}
            {openSection === "team" && <MyTeamPanel />}
          </div>
        )}
      </Container>
    </div>
  );
};
