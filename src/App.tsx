import "./App.css";
import { Login } from "./pages/Login";
import { Routes, Route } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Layout } from "./components/layout/Layout";
import { PrivateRoutes } from "./components/Private/PrivateRoutes";
import { Admin } from "./pages/Admin";
import { Coordinator } from "./pages/Coordinator";
import { TeamLeader } from "./pages/TeamLeader";
import { Worker } from "./pages/worker";
import { ChangePassword } from "./pages/ChangePassword";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Login />} />

          <Route
            element={
              <PrivateRoutes
                allowedRoles={["admin", "coordinator", "teamLeader", "worker"]}
              />
            }
          >
            <Route path="changePassword" element={<ChangePassword />} />
          </Route>

          <Route element={<PrivateRoutes allowedRoles={["admin"]} />}>
            <Route path="admin" element={<Admin />} />
          </Route>

          <Route element={<PrivateRoutes allowedRoles={["coordinator"]} />}>
            <Route path="coordinator" element={<Coordinator />} />
          </Route>

          <Route element={<PrivateRoutes allowedRoles={["teamLeader"]} />}>
            <Route path="teamLeader" element={<TeamLeader />} />
          </Route>

          <Route element={<PrivateRoutes allowedRoles={["worker"]} />}>
            <Route path="worker" element={<Worker />} />
          </Route>
        </Route>
      </Routes>

      <ToastContainer />
    </>
  );
}

export default App;
