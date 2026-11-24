import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";

export const Footer = () => {
  return (
    <Container fluid className=" footer p-3">
      <Row className="text-center ">
        <Col className="footer">
          {" "}
          &copy; All copyright reserved ||{" "}
          <a
            href="https://www.brazeshguragain.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Brazesh
          </a>{" "}
        </Col>
      </Row>
    </Container>
  );
};
