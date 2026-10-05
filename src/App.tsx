import "./App.css";
import { Login } from "./pages/Login";
import { Routes, Route } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Layout } from "./components/layout/Layout";
import { PrivateRoutes } from "./components/Private/PrivateRoutes";
import { Admin } from "./pages/Admin";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Login />} />

          <Route element={<PrivateRoutes allowedRoles={["admin"]} />}>
            <Route path="admin" element={<Admin />} />
          </Route>
        </Route>
      </Routes>

      <ToastContainer />
    </>
  );
}

export default App;
