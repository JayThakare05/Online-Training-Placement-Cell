import { useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { FileCode } from "lucide-react";

export default function UploadCodingQuestions() {
  const [question, setQuestion] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);

    try {
      // 🔹 Send data to backend API
      const response = await fetch("http://localhost:5000/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ question, difficulty }),
      });

      if (!response.ok) {
        throw new Error("Failed to upload question");
      }

      setSuccess(true);
      setQuestion("");
      setDifficulty("Easy");
    } catch (error) {
      console.error("Error uploading question:", error);
      setSuccess(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto bg-white shadow border border-gray-200 rounded-lg p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-2">
          <FileCode className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            Upload Coding Questions
          </h1>
        </div>
        <p className="text-gray-600">
          Add new coding problems for students to practice.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Question Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows="5"
              placeholder="Enter coding question..."
              className="w-full p-3 border rounded-lg focus:ring focus:ring-blue-200"
              required
            />
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring focus:ring-blue-200"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Upload Question
          </button>
        </form>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg">
            ✅ Question uploaded successfully!
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
