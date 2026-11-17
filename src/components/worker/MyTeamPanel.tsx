import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { useUser } from "../../contex/UserContext";
import { getTeamDetail, type ITeamDetail } from "../../helper/axios";
import { TeamCard } from "../teams/TeamCard";

export const MyTeamPanel = () => {
  const { user } = useUser();
  const teamId = user?.teamId;

  const [team, setTeam] = useState<ITeamDetail | null>(null);
  // Only loading if there's a team to load.
  const [isLoading, setIsLoading] = useState(Boolean(teamId));

  useEffect(() => {
    if (!teamId) return; // not in a team: nothing to load
    let ignore = false;

    getTeamDetail(teamId).then((res) => {
      if (ignore) return;
      if (res.status === "success") {
        setTeam(res.team);
      } else {
        toast.error(res.message);
      }
      setIsLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, [teamId]);

  if (!teamId) {
    return (
      <p className="mutedDate mb-0">
        You're not in a team yet. Your coordinator can add you to one.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center my-3">
        <Spinner animation="border" size="sm" />
      </div>
    );
  }

  if (!team) {
    return <p className="mutedDate mb-0">Couldn't load your team.</p>;
  }

  return <TeamCard team={team} linkMembers={false} currentUserId={user?._id} />;
};
