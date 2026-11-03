import { useEffect, useState } from "react";
import { Button, Container, Spinner } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import { getUserDetail, type IUserDetail } from "../helper/axios";
import { StaffIdCard } from "../components/staff/StaffIdCard";
import { EditStaffForm } from "../components/staff/EditStaffForm";
import { StaffPermissionsForm } from "../components/staff/StaffPermissionsForm";

type Mode = "view" | "edit" | "permissions";

export const StaffDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [staff, setStaff] = useState<IUserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("view");
  // Bumped to refetch after a save.
  const [reloadKey, setReloadKey] = useState(0);

  const handleSaved = () => {
    setMode("view");
    setReloadKey((k) => k + 1);
  };

  useEffect(() => {
    if (!id) return;
    let ignore = false; // drop the response if the page changed meanwhile

    getUserDetail(id).then((res) => {
      if (ignore) return;
      if (res.status === "success") {
        setStaff(res.userDetail);
        setError("");
      } else {
        setStaff(null);
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

    if (error || !staff) {
      return (
        <div className="text-center mt-5 text-danger">
          {error || "Staff member not found"}
        </div>
      );
    }

    if (mode === "view") {
      return (
        <>
          <StaffIdCard staff={staff} />
          <div className="d-flex gap-2 mt-3 justify-content-center">
            <Button onClick={() => setMode("edit")}>Edit user detail</Button>
            <Button
              variant="outline-light"
              onClick={() => setMode("permissions")}
            >
              Update permissions
            </Button>
          </div>
        </>
      );
    }

    if (mode === "edit") {
      return (
        <div className="staffPanel">
          <EditStaffForm
            staff={staff}
            onCancel={() => setMode("view")}
            onSaved={handleSaved}
          />
        </div>
      );
    }

    return (
      <div className="staffPanel">
        <StaffPermissionsForm
          staff={staff}
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
          ← Back to staff
        </Link>
        {renderContent()}
      </Container>
    </div>
  );
};
