import "./App.css";
import { Login } from "./pages/Login";
import { Routes, Route } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
      </Routes>

      <ToastContainer />
    </>
  );
}

export default App;
