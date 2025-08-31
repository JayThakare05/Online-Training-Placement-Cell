import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    extra: {} // role-specific data
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleExtraChange = (e) => {
    setForm({
      ...form,
      extra: { ...form.extra, [e.target.name]: e.target.value }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        alert("Registration successful! Please login.");
        navigate("/login");
      } else {
        alert("Error registering user.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }
  };

  // 🟢 Role-based extra fields
  const renderExtraFields = () => {
    switch (form.role) {
      case "student":
        return (
            <>
            <h3 className="font-semibold mt-4">Personal Information</h3>
            <input name="dob" type="date" placeholder="Date of Birth" onChange={handleExtraChange} className="w-full p-2 mb-3 border rounded" />
            <input name="gender" placeholder="Gender" onChange={handleExtraChange} className="w-full p-2 mb-3 border rounded" />
            <input name="contact" placeholder="Contact Number" onChange={handleExtraChange} className="w-full p-2 mb-3 border rounded" />

            <h3 className="font-semibold mt-4">Academic Details</h3>
            <input name="roll_no" placeholder="Roll Number" onChange={handleExtraChange} className="w-full p-2 mb-3 border rounded" />
            <input name="college" placeholder="College/Institute Name" onChange={handleExtraChange} className="w-full p-2 mb-3 border rounded" />
            <input name="department" placeholder="Department/Branch" onChange={handleExtraChange} className="w-full p-2 mb-3 border rounded" />
            <input name="year_of_study" placeholder="Year of Study" onChange={handleExtraChange} className="w-full p-2 mb-3 border rounded" />
            <input name="cgpa" placeholder="Current CGPA" onChange={handleExtraChange} className="w-full p-2 mb-3 border rounded" />
            </>
        );


      case "recruiter":
        return (
          <>
            <h3 className="font-semibold mt-4">Company Info</h3>
            <input name="companyName" placeholder="Company Name" onChange={handleExtraChange} className="w-full p-2 mb-3 border rounded" />
            <input name="industry" placeholder="Industry Type" onChange={handleExtraChange} className="w-full p-2 mb-3 border rounded" />
            <input name="website" placeholder="Company Website" onChange={handleExtraChange} className="w-full p-2 mb-3 border rounded" />

            <h3 className="font-semibold mt-4">Recruiter Info</h3>
            <input name="recruiterName" placeholder="Recruiter Name" onChange={handleExtraChange} className="w-full p-2 mb-3 border rounded" />
            <input name="designation" placeholder="Designation" onChange={handleExtraChange} className="w-full p-2 mb-3 border rounded" />
            <input name="jobTitle" placeholder="Job Title" onChange={handleExtraChange} className="w-full p-2 mb-3 border rounded" />
            <input name="skills" placeholder="Required Skills" onChange={handleExtraChange} className="w-full p-2 mb-3 border rounded" />
          </>
        );

      case "admin":
        return (
          <>
            <h3 className="font-semibold mt-4">Admin Info</h3>
            <input name="designation" placeholder="Designation (TPO/Coordinator)" onChange={handleExtraChange} className="w-full p-2 mb-3 border rounded" />
            <input name="contact" placeholder="Contact Number" onChange={handleExtraChange} className="w-full p-2 mb-3 border rounded" />
            <input name="instituteId" placeholder="Institute/College ID" onChange={handleExtraChange} className="w-full p-2 mb-3 border rounded" />
            <input name="accessRole" placeholder="Access Role (Super Admin / Coordinator)" onChange={handleExtraChange} className="w-full p-2 mb-3 border rounded" />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 overflow-y-auto p-6">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">Register</h2>
        
        {/* Base Fields */}
        <input type="text" name="name" placeholder="Name" value={form.name} onChange={handleChange} className="w-full p-2 mb-3 border rounded" required />
        <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} className="w-full p-2 mb-3 border rounded" required />
        <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} className="w-full p-2 mb-3 border rounded" required />
        
        <select name="role" value={form.role} onChange={handleChange} className="w-full p-2 mb-3 border rounded">
          <option value="student">Student</option>
          <option value="recruiter">Recruiter</option>
          <option value="admin">Admin</option>
        </select>

        {/* Dynamic Fields */}
        {renderExtraFields()}

        <button type="submit" className="w-full bg-blue-600 text-white p-2 mt-4 rounded">
          Register
        </button>

        <p className="text-sm text-center mt-3 text-blue-500 cursor-pointer" onClick={() => navigate("/login")}>
          Already have an account? Login
        </p>
      </form>
    </div>
  );
}
