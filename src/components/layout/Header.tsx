import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import { Link } from "react-router-dom";
import Nav from "react-bootstrap/Nav";
import { IoLogOut } from "react-icons/io5";
import { useUser } from '../../contex/UserContext';

export const Header = () => {
const {user, setUser} = useUser();

const handleOnLogout = ()=>{
  localStorage.removeItem("accessJWT");
  setUser(undefined)
}
  return (
    <>
    
      <Navbar expand="lg" className="customNavbar">
        <Container className="text-danger">
          <Navbar.Brand href="#" >Roaster View</Navbar.Brand>

          {user && <Nav className ="auto">
  <Nav.Link as={Link} to="/" onClick={handleOnLogout}>
                  <IoLogOut />
                  Logout
                </Nav.Link>
          </Nav> }
          
        </Container>
        
      </Navbar>
   
    </>
  );
};
