import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        // Store JWT and role
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);

        // Show success message
        setError("");
        
        // Redirect based on role
        const dashboardRoutes = {
          student: "/student/dashboard",
          recruiter: "/recruiter/dashboard", 
          admin: "/admin/dashboard"
        };

        navigate(dashboardRoutes[data.role] || "/dashboard");
      } else {
        // Handle specific error messages
        setError(data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Login</h2>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={loading}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={loading}
          />

          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white p-3 rounded-lg font-semibold transition duration-200"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Logging in...
              </div>
            ) : (
              "Login"
            )}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <span 
              className="text-blue-600 hover:text-blue-800 cursor-pointer font-semibold"
              onClick={() => navigate("/register")}
            >
              Register here
            </span>
          </p>
        </div>

        {/* Optional: Forgot Password Link */}
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
            Forgot your password?
          </p>
        </div>
      </form>
    </div>
  );
}