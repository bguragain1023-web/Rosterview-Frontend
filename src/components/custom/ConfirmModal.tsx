import { useState, type ReactNode } from "react";
import { Button, Modal } from "react-bootstrap";

interface ConfirmModalProps {
  show: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  variant?: "primary" | "danger";
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

// "Are you sure?" dialog. Buttons are disabled while onConfirm runs.
export const ConfirmModal = ({
  show,
  title,
  message,
  confirmLabel = "Confirm",
  variant = "primary",
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  const [isWorking, setIsWorking] = useState(false);

  const handleConfirm = async () => {
    setIsWorking(true);
    try {
      await onConfirm();
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <Modal show={show} onHide={isWorking ? undefined : onCancel} centered>
      <Modal.Header closeButton={!isWorking}>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        <Button
          variant="outline-secondary"
          onClick={onCancel}
          disabled={isWorking}
        >
          Cancel
        </Button>
        <Button variant={variant} onClick={handleConfirm} disabled={isWorking}>
          {isWorking ? "Please wait..." : confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
