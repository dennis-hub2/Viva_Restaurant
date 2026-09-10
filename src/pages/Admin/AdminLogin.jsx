import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Read Admin Credentials strictly from .env (no hardcoded passwords in source code)
const ENV_ADMIN_USER = (import.meta.env.VITE_ADMIN_USERNAME || "").trim().toLowerCase();
const ENV_ADMIN_PASS = import.meta.env.VITE_ADMIN_PASSWORD || "";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const inputUser = username.trim().toLowerCase();

    // Match against secure .env credentials
    const isValidUsername =
      ENV_ADMIN_USER !== "" &&
      (inputUser === ENV_ADMIN_USER ||
        `${inputUser}@viva.com` === ENV_ADMIN_USER ||
        ENV_ADMIN_USER.startsWith(inputUser));

    const isValidPassword = ENV_ADMIN_PASS !== "" && password === ENV_ADMIN_PASS;

    if (isValidUsername && isValidPassword) {
      localStorage.setItem("viva_admin_session", "true");
      setIsLoading(false);
      navigate("/admin");
    } else {
      setIsLoading(false);
      setError("Invalid username or password. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1D] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-tr from-[#6539A3] to-[#4B1E83] rounded-3xl shadow-2xl mb-6 text-4xl">
            🍽️
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight font-serif mb-2">
            Viva Admin
          </h1>
          <p className="text-gray-400 font-medium">
            Enter your credentials to access the dashboard.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-[#2A2A2D] p-10 rounded-[40px] shadow-2xl border border-white/5 space-y-6"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm py-3 px-4 rounded-2xl text-center font-bold">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin1"
              autoCapitalize="none"
              autoComplete="username"
              className="w-full bg-[#1A1A1D] border border-white/5 rounded-2xl py-4 px-6 text-white outline-none focus:ring-2 focus:ring-[#6539A3] transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#1A1A1D] border border-white/5 rounded-2xl py-4 px-6 text-white outline-none focus:ring-2 focus:ring-[#6539A3] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#6539A3] text-white font-black text-xl py-5 rounded-2xl shadow-[0px_6px_0px_#4B1E83] hover:translate-y-0.5 hover:shadow-[0px_4px_0px_#4B1E83] transition-all active:translate-y-1.5 active:shadow-none mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Authenticating..." : "Login to Dashboard"}
          </button>
        </form>

        <p className="text-center text-gray-500 mt-8 text-sm">
          &copy; 2026 Viva Restaurant Group. Internal Use Only.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
