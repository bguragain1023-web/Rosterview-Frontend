import Form from "react-bootstrap/Form";
import type { FormControlProps } from "react-bootstrap";

type CustomInputProps = Omit<FormControlProps, "as"> & {
  label: string;
  controlId?: string;
};

export const CustomInput = ({ label, ...rest }: CustomInputProps) => {
  return (
    <Form.Group className="mb-3" controlId="formBasicPassword">
      <Form.Label>{label}</Form.Label>
      <Form.Control {...rest} />
    </Form.Group>
  );
};
