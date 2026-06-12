import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axiosInstance";
import { AuthContext } from "../context/AuthContext";

function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post("/auth/login", {
        username,
        password,
      });

      login(response.data);

      // Role-based routing
      if (response.data.role === "ADMIN") {
        navigate("/admin");
      } else if (response.data.role === "TEACHER") {
        navigate("/teacher");
      } else if (response.data.role === "STUDENT") {
        navigate("/student");
      }
    } catch {
      setError("Invalid credentials or account inactive");
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-card">
        <h2>Login</h2>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>

          <label className="auth-field">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button className="auth-button" type="submit">
            Login
          </button>
        </form>

        {error && <p className="auth-error">{error}</p>}
      </section>
    </div>
  );
}

export default Login;
