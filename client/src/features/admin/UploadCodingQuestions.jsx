import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { FileCode, Upload, FileSpreadsheet } from "lucide-react";

export default function UploadCodingQuestions() {
  const [file, setFile] = useState(null);
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  // New state to store fetched questions
  const [uploadedQuestions, setUploadedQuestions] = useState([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  // New function to fetch questions from the database
  const fetchUploadedQuestions = async () => {
    setIsLoadingQuestions(true);
    try {
      const response = await fetch("http://localhost:5000/api/questions", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch questions");
      }

      setUploadedQuestions(data);
    } catch (error) {
      console.error("Error fetching questions:", error);
      setError("Failed to fetch uploaded questions.");
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Use useEffect to fetch questions when the component mounts
  useEffect(() => {
    fetchUploadedQuestions();
  }, []); // Empty dependency array means this runs only once on mount

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (
      selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || 
      selectedFile.type === "application/vnd.ms-excel" ||
      selectedFile.name.endsWith('.xlsx') ||
      selectedFile.name.endsWith('.xls')
    )) {
      setFile(selectedFile);
      setError("");
    } else {
      setError("Please select an Excel file (.xlsx or .xls)");
      setFile(null);
    }
  };

  const parseExcel = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setIsUploading(true);
    setError("");
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("excel", file);

      const response = await fetch("http://localhost:5000/api/questions/parse-excel", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to parse Excel");
      }

      setParsedQuestions(data.questions);
      
      if (data.questions.length === 0) {
        setError("No questions found in the Excel file. Please check the format.");
      }
    } catch (error) {
      console.error("Error parsing Excel:", error);
      setError(error.message || "Failed to parse Excel. Please check the format.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleBulkUpload = async () => {
    if (parsedQuestions.length === 0) {
      setError("No questions to upload");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/questions/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ questions: parsedQuestions }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to upload questions");
      }

      setSuccess(true);
      setParsedQuestions([]);
      setFile(null);
      // Reset file input
      document.getElementById("excel-file").value = "";
      
      setTimeout(() => setSuccess(false), 3000);
      // Fetch the updated list of questions after a successful upload
      fetchUploadedQuestions();
    } catch (error) {
      console.error("Error uploading questions:", error);
      setError(error.message || "Failed to upload questions");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto bg-white shadow border border-gray-200 rounded-lg p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-2">
          <FileCode className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            Bulk Upload Coding Questions
          </h1>
        </div>
        
        <p className="text-gray-600">
          Upload an Excel file containing coding questions in the specified format.
        </p>

        {/* Format Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Expected Excel Format:</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Column A:</strong> Question Number (Integer)</p>
            <p><strong>Column B:</strong> Question Name (String)</p>
            <p><strong>Column C:</strong> Description (String)</p>
            <p><strong>Column D:</strong> Difficulty (Easy/Medium/Hard)</p>
            <p><strong>Column E:</strong> Output (Output specification with rules)</p>
            <p className="mt-2 text-blue-600">
              <strong>Note:</strong> First row should contain headers. Data should start from row 2.
            </p>
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Excel File
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex-1">
                <input
                  id="excel-file"
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploading}
                />
                <div className={`w-full p-3 border border-dashed rounded-lg cursor-pointer transition-colors ${
                  isUploading ? "border-gray-300 bg-gray-100" : "border-gray-300 hover:border-blue-400"
                }`}>
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <FileSpreadsheet className="h-8 w-8 mb-2" />
                    <span>{file ? file.name : "Choose Excel file (.xlsx or .xls)"}</span>
                  </div>
                </div>
              </label>
              <button
                type="button"
                onClick={parseExcel}
                disabled={!file || isUploading}
                className="bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? "Processing..." : "Parse Excel"}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">
              ❌ {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg">
              ✅ Questions uploaded successfully!
            </div>
          )}
        </div>

        {/* Parsed Questions Preview */}
        {parsedQuestions.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">
              Parsed Questions ({parsedQuestions.length} found)
            </h3>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 grid grid-cols-5 gap-4 font-semibold text-sm text-gray-700">
                <div>#</div>
                <div>Name</div>
                <div>Difficulty</div>
                <div>Description</div>
                <div>Output</div>
              </div>
              
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {parsedQuestions.map((q, index) => (
                  <div key={index} className="px-4 py-3 grid grid-cols-5 gap-4 text-sm">
                    <div className="font-medium">{q.questionNumber}</div>
                    <div className="truncate">{q.questionName}</div>
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        q.difficulty === "Easy" ? "bg-green-100 text-green-800" :
                        q.difficulty === "Medium" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {q.difficulty}
                      </span>
                    </div>
                    <div className="truncate" title={q.description}>
                      {q.description.substring(0, 50)}{q.description.length > 50 ? "..." : ""}
                    </div>
                    <div className="truncate" title={q.output}>
                      {q.output.substring(0, 30)}{q.output.length > 30 ? "..." : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleBulkUpload}
              disabled={isUploading}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "Uploading..." : `Upload ${parsedQuestions.length} Questions`}
            </button>
          </div>
        )}

        {/* Display Uploaded Questions from DB */}
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">
            All Uploaded Questions
          </h2>
          {isLoadingQuestions ? (
            <div className="text-center text-gray-500">Loading questions...</div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 grid grid-cols-5 gap-4 font-semibold text-sm text-gray-700">
                <div>#</div>
                <div>Name</div>
                <div>Difficulty</div>
                <div>Description</div>
                <div>Output</div>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {uploadedQuestions.length > 0 ? (
                  uploadedQuestions.map((q, index) => (
                    <div key={q._id || index} className="px-4 py-3 grid grid-cols-5 gap-4 text-sm">
                      <div className="font-medium">{q.questionNumber}</div>
                      <div className="truncate">{q.questionName}</div>
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          q.difficulty === "Easy" ? "bg-green-100 text-green-800" :
                          q.difficulty === "Medium" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {q.difficulty}
                        </span>
                      </div>
                      <div className="truncate" title={q.description}>
                        {q.description.substring(0, 50)}{q.description.length > 50 ? "..." : ""}
                      </div>
                      <div className="truncate" title={q.output}>
                        {q.output.substring(0, 30)}{q.output.length > 30 ? "..." : ""}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">No questions found in the database.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}