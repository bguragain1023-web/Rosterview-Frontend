import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";

interface AppModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  //   children: React.ReactNode;
}

export const AppModal = ({ show, onClose, title, children }: AppModalProps) => {
  return (
    <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered>
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h4>Centered Modal</h4>
        <p>
          Cras mattis consectetur purus sit amet fermentum. Cras justo odio,
          dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac
          consectetur ac, vestibulum at eros.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};
