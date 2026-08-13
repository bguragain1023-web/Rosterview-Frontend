import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';

export const Header = () => {
  return (
    <>
    <Container>
      <Navbar expand="lg" className="bg-body-tertiary">
        <Container>
          <Navbar.Brand href="#">Roaster View</Navbar.Brand>
        </Container>
      </Navbar>
    </Container>
    </>
  );
};
