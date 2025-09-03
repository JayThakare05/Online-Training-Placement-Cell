import { useState } from "react";
import { Code, UserCheck, Brain, History, Award, ArrowLeft } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
export default function MockInterviews() {
  const [selectedType, setSelectedType] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [history, setHistory] = useState([]); // store attempts
  const [viewHistory, setViewHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null); // New state to store score and suggestions
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null); // New state for detailed history view

  // Generate questions by calling the backend API
  const startInterview = async (type, level) => {
    setLoading(true);
    setSelectedType(type);
    setDifficulty(level);
    setQuestions([]);
    setAnswers({});
    setViewHistory(false);
    setEvaluation(null); // Reset evaluation state
    setSelectedHistoryItem(null); // Clear selected history item

    try {
      const response = await fetch('http://localhost:5000/api/mockInterview/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, difficulty: level }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      const data = await response.json();
      setQuestions(data.questions);
    } catch (error) {
      console.error('Error:', error);
      // alert('Failed to start interview. Please try again.');
      setSelectedType(null);
      setDifficulty(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle answer change
  const handleAnswerChange = (index, value) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  };

  // Submit answers and get score from API
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/mockInterview/submit-answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: selectedType,
          difficulty,
          questions,
          answers,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit answers for evaluation.');
      }

      const data = await response.json();
      setEvaluation({
        score: data.score,
        suggestions: data.suggestions,
      });

      const attempt = {
        type: selectedType,
        difficulty,
        timestamp: new Date().toLocaleString(),
        answers,
        questions, // Add questions to history for display
        score: data.score,
        suggestions: data.suggestions,
      };
      setHistory((prev) => [attempt, ...prev]);

    } catch (error) {
      console.error('Error:', error);
      // alert('Failed to submit answers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-5xl mx-auto bg-white shadow-md border border-gray-200 rounded-2xl p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mock Interviews</h1>
            <p className="text-gray-600 mt-2">
              Practice by choosing interview type and difficulty level.
            </p>
          </div>
          <button
            onClick={() => {
              setViewHistory(!viewHistory);
              setSelectedType(null);
              setDifficulty(null);
              setQuestions([]);
              setAnswers({});
              setEvaluation(null);
              setSelectedHistoryItem(null);
            }}
            className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
          >
            <History className="h-5 w-5 text-gray-700" />
            {viewHistory ? "Back" : "View History"}
          </button>
        </div>

        {/* History Section - List View */}
        {viewHistory && !selectedHistoryItem && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Your Past Attempts</h2>
            {history.length === 0 ? (
              <p className="text-gray-600">No interview attempts yet.</p>
            ) : (
              <ul className="space-y-3">
                {history.map((h, i) => (
                  <li
                    key={i}
                    className="p-4 bg-gray-50 border rounded-lg flex flex-col md:flex-row md:justify-between md:items-center"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">
                        {h.type} Interview ({h.difficulty})
                      </p>
                      <p className="text-gray-600 text-sm">{h.timestamp}</p>
                    </div>
                    <button
                      onClick={() => setSelectedHistoryItem(h)}
                      className="mt-2 md:mt-0 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                    >
                      View Details
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* History Section - Detailed View */}
        {viewHistory && selectedHistoryItem && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedHistoryItem(null)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to History
              </button>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 space-y-6">
              <div className="flex items-center gap-4">
                <Award className="h-10 w-10 text-yellow-500" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Attempt Details</h2>
                  <p className="text-gray-600">{selectedHistoryItem.type} Interview on {selectedHistoryItem.timestamp}</p>
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-xl">
                <h3 className="text-xl font-semibold text-gray-700">Score: <span className="text-green-600">{selectedHistoryItem.score}</span> / 50</h3>
              </div>

              <div className="p-6 bg-gray-50 rounded-xl">
                <h3 className="text-xl font-semibold text-gray-700 mb-3">Suggestions for Improvement:</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{selectedHistoryItem.suggestions}</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-700">Questions & Your Answers:</h3>
                {selectedHistoryItem.questions.map((q, i) => (
                  <div key={i} className="p-4 bg-white rounded-lg border border-gray-200 space-y-2">
                    <p className="font-semibold text-gray-800">Q{i + 1}: {q}</p>
                    <p className="text-gray-600">Your Answer: {selectedHistoryItem.answers[i] || 'No answer provided'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Select Interview Type */}
        {!selectedType && !viewHistory && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              onClick={() => setSelectedType("HR")}
              className="cursor-pointer bg-gray-50 p-6 rounded-xl shadow-sm hover:shadow-md transition"
            >
              <UserCheck className="h-8 w-8 text-green-600 mb-4" />
              <h2 className="text-lg font-bold text-gray-800">HR Interview</h2>
              <p className="text-gray-600 text-sm mt-2">
                Practice behavioral and communication-based questions.
              </p>
            </div>

            <div
              onClick={() => setSelectedType("Technical")}
              className="cursor-pointer bg-gray-50 p-6 rounded-xl shadow-sm hover:shadow-md transition"
            >
              <Code className="h-8 w-8 text-green-600 mb-4" />
              <h2 className="text-lg font-bold text-gray-800">Technical Interview</h2>
              <p className="text-gray-600 text-sm mt-2">
                Domain-specific questions on DBMS, OS, OOPs, etc.
              </p>
            </div>

            <div
              onClick={() => setSelectedType("Coding")}
              className="cursor-pointer bg-gray-50 p-6 rounded-xl shadow-sm hover:shadow-md transition"
            >
              <Brain className="h-8 w-8 text-green-600 mb-4" />
              <h2 className="text-lg font-bold text-gray-800">Coding Interview</h2>
              <p className="text-gray-600 text-sm mt-2">
                Solve coding challenges in real-time.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Select Difficulty */}
        {selectedType && !difficulty && !loading && !evaluation && !viewHistory && (
          <div className="text-center space-y-6">
            <h2 className="text-xl font-bold text-gray-800">
              Select Difficulty Level for {selectedType} Interview
            </h2>
            <div className="flex justify-center gap-6">
              {["Easy", "Medium", "Hard"].map((level) => (
                <button
                  key={level}
                  onClick={() => startInterview(selectedType, level)}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="text-center p-8">
            <p className="text-xl font-semibold text-gray-700">Generating questions... 🧠</p>
            <p className="text-gray-500 mt-2">Please wait a moment.</p>
          </div>
        )}

        {/* Step 3: Show Questions + Answer Boxes */}
        {difficulty && !loading && !evaluation && !viewHistory && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">
              {selectedType} Interview ({difficulty} Level)
            </h2>

            {questions.map((q, i) => (
              <div
                key={i}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3"
              >
                <p className="text-gray-800 font-semibold">
                  Q{i + 1}: {q}
                </p>
                <textarea
                  rows="3"
                  value={answers[i] || ""}
                  onChange={(e) => handleAnswerChange(i, e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
            ))}

            <div className="flex gap-4">
              <button
                onClick={handleSubmit}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Submit Answers
              </button>
              <button
                onClick={() => {
                  setSelectedType(null);
                  setDifficulty(null);
                  setQuestions([]);
                  setAnswers({});
                }}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Back to Interview Types
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Show Evaluation */}
        {evaluation && (
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 space-y-6">
            <div className="flex items-center gap-4">
              <Award className="h-10 w-10 text-yellow-500" />
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Interview Results</h2>
                <p className="text-gray-600">Review of candidate performance and evaluation metrics.</p>
              </div>
            </div>
            <div className="p-6 bg-gray-50 rounded-xl">
              <h3 className="text-xl font-semibold text-gray-700">Score: <span className="text-green-600">{evaluation.score}</span> / 50</h3>
            </div>
            <div className="p-6 bg-gray-50 rounded-xl">
              <h3 className="text-xl font-semibold text-gray-700 mb-3">Suggestions for Improvement:</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{evaluation.suggestions}</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setEvaluation(null);
                  setSelectedType(null);
                  setDifficulty(null);
                  setQuestions([]);
                  setAnswers({});
                }}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Start New Interview
              </button>
              <button
                onClick={() => {
                  setViewHistory(true);
                  setEvaluation(null);
                }}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                View History
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </DashboardLayout>
  );
}
