import { Col, Container, Row } from "react-bootstrap";
import { useUser } from "../contex/UserContext";

export const Worker = () => {
  const { user } = useUser();
  const today = new Date().toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  console.log(user);
  return (
    <>
      <div className="layoutWrapper p-3">
        <Container>
          <Row className="d-flex ">
            <Col className="">
              {" "}
              <div className="title">Welcome {user?.name}</div>
              <span className="mutedDate">{user?.role.toUpperCase()}</span>{" "}
              <br />
              <span className="mutedDate">{today}</span>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};
