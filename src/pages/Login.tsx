import { LoginForm } from "../components/forms/LoginForm";

// The demo box only shows on the live demo (VITE_DEMO_MODE=true).
// Same logins as the backend's src/helper/demoAccounts.ts.
const isDemo = import.meta.env.VITE_DEMO_MODE === "true";
const DEMO_PASSWORD = "demo1234";
const demoLogins = [
  { role: "Admin", email: "admin@demo.com" },
  { role: "Coordinator", email: "coordinator@demo.com" },
  { role: "Team leader", email: "leader@demo.com" },
  { role: "Worker", email: "worker@demo.com" },
];

export const Login = () => {
  return (
    <div className="layoutWrapper d-flex align-items-center justify-content-center flex-column">
      <div className="title">Login</div>

      {/* Side by side on laptops; on phones the demo box goes below */}
      <div className="d-flex flex-column flex-md-row align-items-center align-items-md-stretch justify-content-center gap-4 mt-3 mb-4 w-100">
        <div className="loginbox">
          <LoginForm />
        </div>

        {isDemo && (
          <div className="loginbox">
            <div className="subtitle mb-2">Try the demo</div>
            <p className="mutedDate">
              Log in with any of these. Password for all:{" "}
              <strong>{DEMO_PASSWORD}</strong>
            </p>
            {demoLogins.map((login) => (
              <div key={login.email} className="demoLogin">
                <span className="mutedDate">{login.role}</span>
                <span>{login.email}</span>
              </div>
            ))}
            <p className="mutedDate mt-3 mb-0">
              Demo data resets every day.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
