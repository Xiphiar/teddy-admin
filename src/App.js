import { Container } from "react-bootstrap";
import { Routes, Route } from "react-router-dom";

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout
import Layout from "./layout/Layout";

// pages
import Home from "./pages/Home";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import Mint from "./pages/Mint";
import GoldToken from "./pages/GoldToken";




const App = () => {
  return (
    <Layout>
      <ToastContainer
        position="top-right"
        theme="colored"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        draggable
        pauseOnHover
      />
      <Container>
        <Routes>
          <Route path="/" element={<Home />} exact />
          <Route path="/about" element={<About />} />
          <Route path="/mint" element={<Mint />} />
          <Route path="/goldticket" element={<GoldToken />} />
          <Route element={<NotFound />} />
        </Routes>
      </Container>
    </Layout>
  );
};

export default App;
