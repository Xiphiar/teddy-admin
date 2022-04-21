import { Link } from "react-router-dom";
import { Nav, Container } from "react-bootstrap";

const Menu = () => {
  return (
    <Container>
      <header className="d-flex flex-wrap align-items-center justify-content-center justify-content-md-between py-3 mb-5 border-bottom">
        <Link
          to="/"
          className="d-flex align-items-center col-md-3 mb-2 mb-md-0 text-dark text-decoration-none"
        >
          <b>MTC Admin Dashboard{process.env.REACT_APP_CHAIN_ID.includes("secret-")? <span style={{color: "red", fontSize: "1.1rem"}}>&nbsp;&nbsp;Mainnet</span>:null}</b>
        </Link>
        <Nav>
          <ul className="nav col-12 col-md-auto mb-2 justify-content-center mb-md-0" style={{marginRight: "15px"}}>
            <li>
              <Link to="/goldticket" className="nav-link px-2 link-secondary">
                Mint Golden Ticket
              </Link>
            </li>
          </ul>
          <ul className="nav col-12 col-md-auto mb-2 justify-content-center mb-md-0" style={{marginRight: "15px"}}>
            <li>
              <Link to="/minttrait" className="nav-link px-2 link-secondary">
                Mint 1/1 Trait
              </Link>
            </li>
          </ul>
          <ul className="nav col-12 col-md-auto mb-2 justify-content-center mb-md-0">
            <li>
              <Link to="/mint" className="nav-link px-2 link-secondary">
                Mint Teddy
              </Link>
            </li>
          </ul>
        </Nav>
      </header>
    </Container>
  );
};

export default Menu;
