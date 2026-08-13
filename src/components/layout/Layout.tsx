import { Footer } from "./Footer";
import { Header } from "./Header";
import { Outlet } from "react-router-dom";

export const Layout = () => {
  return (
    <div>
      {/* navbar */}
      <Header />

      {/* page */}
      <main className="main">
        <Outlet />
      </main>

      {/* footer */}
      <Footer />
    </div>
  );
};
