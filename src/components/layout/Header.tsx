import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';

export const Header = () => {
  return (
    <>
    
      <Navbar expand="lg" className="customNavbar">
        <Container className="text-danger">
          <Navbar.Brand href="#" >Roaster View</Navbar.Brand>
        </Container>
      </Navbar>
   
    </>
  );
};
