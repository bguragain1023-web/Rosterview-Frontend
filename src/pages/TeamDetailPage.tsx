import { useEffect, useState } from "react";
import { Button, Container, Spinner } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import { getTeamDetail, type ITeamDetail } from "../helper/axios";
import { TeamCard } from "../components/teams/TeamCard";
import { EditTeamForm } from "../components/teams/EditTeamForm";
import { ManageMembersPanel } from "../components/teams/ManageMembersPanel";

type Mode = "view" | "edit" | "members";

export const TeamDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<ITeamDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("view");
  // Bumped to refetch after a save.
  const [reloadKey, setReloadKey] = useState(0);

  const reloadTeam = () => setReloadKey((k) => k + 1);

  const handleSaved = () => {
    setMode("view");
    reloadTeam();
  };

  useEffect(() => {
    if (!id) return;
    let ignore = false; // drop the response if the page changed meanwhile

    getTeamDetail(id).then((res) => {
      if (ignore) return;
      if (res.status === "success") {
        setTeam(res.team);
        setError("");
      } else {
        setTeam(null);
        setError(res.message);
      }
      setIsLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, [id, reloadKey]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center mt-5">
          <Spinner animation="border" />
        </div>
      );
    }

    if (error || !team) {
      return (
        <div className="text-center mt-5 text-danger">
          {error || "Team not found"}
        </div>
      );
    }

    if (mode === "view") {
      return (
        <>
          <TeamCard team={team} />
          <div className="d-flex gap-2 mt-3 justify-content-center">
            <Button onClick={() => setMode("edit")}>Edit team</Button>
            <Button variant="outline-light" onClick={() => setMode("members")}>
              Manage members
            </Button>
          </div>
        </>
      );
    }

    if (mode === "members") {
      return (
        <div className="staffPanel">
          <ManageMembersPanel
            team={team}
            onChanged={reloadTeam}
            onDone={() => setMode("view")}
          />
        </div>
      );
    }

    return (
      <div className="staffPanel">
        <EditTeamForm
          team={team}
          onCancel={() => setMode("view")}
          onSaved={handleSaved}
        />
      </div>
    );
  };

  return (
    <div className="layoutWrapper p-3">
      <Container>
        <Link to="/admin" className="backLink">
          ← Back to dashboard
        </Link>
        {renderContent()}
      </Container>
    </div>
  );
};
