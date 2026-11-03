import { useEffect, useState } from "react";
import { Button, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import {
  getAllPermissions,
  updateStaffPermissions,
  type IPermission,
  type IUserDetail,
} from "../../helper/axios";

interface StaffPermissionsFormProps {
  staff: IUserDetail;
  onCancel: () => void;
  onSaved: () => void;
}

// Display order and labels for each backend "resource".
const resourceGroups: { resource: string; label: string }[] = [
  { resource: "user", label: "Staff" },
  { resource: "client", label: "Clients" },
  { resource: "team", label: "Teams" },
  { resource: "shift", label: "Roster" },
  { resource: "availability", label: "Availability" },
  { resource: "leaveRequest", label: "Leave" },
  { resource: "shiftSwap", label: "Shift swaps" },
];

const groupByResource = (permissions: IPermission[]) => {
  const known = resourceGroups.map((g) => ({
    ...g,
    items: permissions.filter((p) => p.resource === g.resource),
  }));

  // Anything added to the backend later still shows up, under its raw name.
  const knownResources = new Set(resourceGroups.map((g) => g.resource));
  const otherResources = [
    ...new Set(
      permissions
        .map((p) => p.resource)
        .filter((r) => !knownResources.has(r)),
    ),
  ];
  const others = otherResources.map((resource) => ({
    resource,
    label: resource,
    items: permissions.filter((p) => p.resource === resource),
  }));

  return [...known, ...others].filter((g) => g.items.length > 0);
};

const sameNames = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().join() === [...b].sort().join();

export const StaffPermissionsForm = ({
  staff,
  onCancel,
  onSaved,
}: StaffPermissionsFormProps) => {
  const [permissions, setPermissions] = useState<IPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(staff.additionalPermissions),
  );
  const [isSaving, setIsSaving] = useState(false);

  const fromRole = new Set(staff.rolePermissions);
  const isAdmin = staff.role === "admin";

  useEffect(() => {
    let ignore = false;

    getAllPermissions().then((res) => {
      if (ignore) return;
      if (res.status === "success") {
        setPermissions(res.permissions);
      } else {
        toast.error(res.message);
      }
      setIsLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, []);

  const toggle = (name: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  // Extra permissions only; anything the role already gives is left out.
  const extraNames = [...selected].filter((name) => !fromRole.has(name));
  const originalExtras = staff.additionalPermissions.filter(
    (name) => !fromRole.has(name),
  );

  const handleSave = async () => {
    if (sameNames(extraNames, originalExtras)) {
      toast.info("No changes to save");
      return;
    }

    setIsSaving(true);
    const res = await updateStaffPermissions(staff._id, extraNames);
    setIsSaving(false);

    toast[res.status](res.message);
    if (res.status === "success") {
      onSaved();
    }
  };

  if (isLoading) {
    return (
      <div className="text-center">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-baseline mb-3">
        <div className="subtitle">Update permissions</div>
        <span className="mutedDate">{extraNames.length} extra selected</span>
      </div>

      {isAdmin && (
        <p className="mutedDate">
          Admins already have every permission through their role.
        </p>
      )}

      {groupByResource(permissions).map((group) => (
        <div key={group.resource} className="permissionGroup">
          <div className="permissionGroupTitle">{group.label}</div>
          {group.items.map((p) => {
            const isFromRole = fromRole.has(p.name);
            return (
              <Form.Check
                key={p._id}
                id={`perm-${p.name}`}
                type="checkbox"
                checked={isFromRole || selected.has(p.name)}
                disabled={isFromRole || isSaving}
                onChange={() => toggle(p.name)}
                label={
                  <>
                    {p.description || p.name}{" "}
                    <code className="permissionName">{p.name}</code>
                    {isFromRole && (
                      <span className="mutedDate"> · from role</span>
                    )}
                  </>
                }
              />
            );
          })}
        </div>
      ))}

      <div className="d-flex gap-2 mt-3">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
        <Button variant="outline-light" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </>
  );
};
