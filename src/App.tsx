import "./App.css";
import { Login } from "./pages/Login";
import { Routes, Route } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Layout } from "./components/layout/Layout";
import { Staff } from "./pages/Staff";
import { Coordinator } from "./pages/Coordinator";
import { PrivateRoutes } from "./components/Private/PrivateRoutes";
import { autoLogin } from "./utils/users";
import { useUser } from "./contex/UserContext";
import { useEffect, useState } from "react";
import Spinner from "react-bootstrap/Spinner";
function App() {
  const { user, setUser } = useUser();
  const [loading, setLoading] = useState(true);

  const updatedUser = async () => {
    const users = await autoLogin();

    if (users) {
      setUser(users);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user?._id) {
      updatedUser();
    }
  }, [user?._id]);

  if (loading) {
    return (
      <div>
        {" "}
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <>
      <div className="">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Login />} />

            <Route element={<PrivateRoutes />}>
              <Route path="staff" element={<Staff />} />
              <Route path="admin" element={<Coordinator />} />
            </Route>
          </Route>
        </Routes>
        <ToastContainer />
      </div>
    </>
  );
}

export default App;
