import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { FileCode, Upload, FileSpreadsheet, ChevronDown, ChevronRight, Eye } from "lucide-react";

export default function UploadCodingQuestions() {
    const [file, setFile] = useState(null);
    const [parsedQuestions, setParsedQuestions] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [uploadedQuestions, setUploadedQuestions] = useState([]);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Toggle row expansion
    const toggleRow = (index, type) => {
        const key = `${type}-${index}`;
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(key)) {
            newExpandedRows.delete(key);
        } else {
            newExpandedRows.add(key);
        }
        setExpandedRows(newExpandedRows);
    };

    // View full details in modal
    const viewFullDetails = (question) => {
        setSelectedQuestion(question);
        setShowModal(true);
    };

    // Helper function to get output from question data
    const getQuestionOutput = (question) => {
        if (question.output) return question.output;
        if (question.examples && question.examples.length > 0 && question.examples[0].output) {
            return question.examples[0].output;
        }
        if (question.testCases && question.testCases.length > 0 && question.testCases[0].expectedOutput) {
            return question.testCases[0].expectedOutput;
        }
        return "No output specified";
    };

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
            if (!response.ok) throw new Error(data.message || "Failed to fetch questions");
            setUploadedQuestions(data);
        } catch (error) {
            console.error("Error fetching questions:", error);
            setError("Failed to fetch uploaded questions.");
        } finally {
            setIsLoadingQuestions(false);
        }
    };

    useEffect(() => { fetchUploadedQuestions(); }, []);

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
            if (!response.ok) throw new Error(data.message || "Failed to parse Excel");
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
                const errorMessage = data.message || "Failed to upload questions";
                const errorDetails = data.validationErrors || data.errors;
                throw new Error(`${errorMessage} ${JSON.stringify(errorDetails)}`);
            }

            setSuccess(true);
            setParsedQuestions([]);
            setFile(null);
            document.getElementById("excel-file").value = "";

            setTimeout(() => setSuccess(false), 3000);
            fetchUploadedQuestions();
        } catch (error) {
            console.error("Error uploading questions:", error);
            setError(error.message || "Failed to upload questions");
        } finally {
            setIsUploading(false);
        }
    };

    // Component for expanded row details
    const ExpandedRowDetails = ({ question }) => (
        <div className="col-span-6 bg-gray-50 p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <h4 className="font-semibold mb-2">Description:</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{question.description}</p>
                </div>
                <div>
                    <h4 className="font-semibold mb-2">Constraints:</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{question.constraints}</p>
                </div>
                {question.examples && question.examples.length > 0 && (
                    <div className="col-span-2">
                        <h4 className="font-semibold mb-2">Example:</h4>
                        <div className="bg-white border rounded p-3">
                            <p><strong>Input:</strong> {question.examples[0].input}</p>
                            <p><strong>Output:</strong> {question.examples[0].output}</p>
                            {question.examples[0].explanation && (
                                <p><strong>Explanation:</strong> {question.examples[0].explanation}</p>
                            )}
                        </div>
                    </div>
                )}
                {question.testCases && question.testCases.length > 0 && (
                    <div className="col-span-2">
                        <h4 className="font-semibold mb-2">Test Cases ({question.testCases.length}):</h4>
                        <div className="space-y-2">
                            {question.testCases.map((testCase, idx) => (
                                <div key={idx} className="bg-white border rounded p-2 text-xs">
                                    <p><strong>Input:</strong> {testCase.input}</p>
                                    <p><strong>Expected Output:</strong> {testCase.expectedOutput}</p>
                                    {testCase.isSample && <span className="text-blue-600 text-xs">Sample</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto bg-white shadow border border-gray-200 rounded-lg p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center space-x-2">
                    <FileCode className="h-6 w-6 text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-900">Bulk Upload Coding Questions</h1>
                </div>

                <p className="text-gray-600">Upload an Excel file containing coding questions in the specified format.</p>

                {/* Format Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">Expected Excel Format:</h3>
                    <div className="text-sm text-blue-700 space-y-1">
                        <p><strong>Column A:</strong> Problem ID (Integer)</p>
                        <p><strong>Column B:</strong> Problem Name (String)</p>
                        <p><strong>Column C:</strong> Difficulty (Easy/Medium/Hard)</p>
                        <p><strong>Column D:</strong> Description (String)</p>
                        <p><strong>Column E:</strong> Input Example (String)</p>
                        <p><strong>Column F:</strong> Output Example (String)</p>
                        <p><strong>Column G:</strong> Explanation (String)</p>
                        <p><strong>Column H:</strong> Constraints (String)</p>
                    </div>
                </div>

                {/* File Upload Section */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Upload Excel File</label>
                        <div className="flex items-center space-x-4">
                            <label className="flex-1">
                                <input
                                    id="excel-file"
                                    type="file"
                                    accept=".xlsx,.xls"
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
                                onClick={parseExcel}
                                disabled={!file || isUploading}
                                className="bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {isUploading ? "Processing..." : "Parse Excel"}
                            </button>
                        </div>
                    </div>

                    {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">❌ {error}</div>}
                    {success && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg">✅ Questions uploaded successfully!</div>}
                </div>

                {/* Parsed Questions Preview */}
                {parsedQuestions.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900">Parsed Questions ({parsedQuestions.length} found)</h3>

                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2 grid grid-cols-6 gap-4 font-semibold text-sm text-gray-700">
                                <div></div>
                                <div>#</div>
                                <div>Name</div>
                                <div>Difficulty</div>
                                <div>Input Example</div>
                                <div>Actions</div>
                            </div>

                            <div className="divide-y divide-gray-200">
                                {parsedQuestions.map((q, index) => (
                                    <div key={index} className="grid grid-cols-6 gap-4">
                                        <div className="px-4 py-3 grid grid-cols-6 gap-4 col-span-6">
                                            <div className="flex items-center">
                                                <button onClick={() => toggleRow(index, 'parsed')} className="text-gray-500 hover:text-gray-700">
                                                    {expandedRows.has(`parsed-${index}`) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                </button>
                                            </div>
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
                                            <div className="truncate" title={q.examples[0]?.input}>
                                                {q.examples[0]?.input ? q.examples[0].input.substring(0, 30) + (q.examples[0].input.length > 30 ? "..." : "") : "No input"}
                                            </div>
                                            <div>
                                                <button onClick={() => viewFullDetails(q)} className="text-blue-600 hover:text-blue-800 flex items-center">
                                                    <Eye size={16} className="mr-1" /> View Full
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {expandedRows.has(`parsed-${index}`) && <ExpandedRowDetails question={q} />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleBulkUpload}
                            disabled={isUploading}
                            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                        >
                            {isUploading ? "Uploading..." : `Upload ${parsedQuestions.length} Questions`}
                        </button>
                    </div>
                )}

                {/* Uploaded Questions from Database */}
                <div className="mt-8 space-y-4">
                    <h2 className="text-xl font-bold text-gray-900">All Uploaded Questions</h2>
                    
                    {isLoadingQuestions ? (
                        <div className="text-center text-gray-500">Loading questions...</div>
                    ) : (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-2 grid grid-cols-6 gap-4 font-semibold text-sm text-gray-700">
                                <div></div>
                                <div>#</div>
                                <div>Name</div>
                                <div>Difficulty</div>
                                <div>Input Example</div>
                                <div>Actions</div>
                            </div>
                            
                            <div className="divide-y divide-gray-200">
                                {uploadedQuestions.length > 0 ? (
                                    uploadedQuestions.map((q, index) => (
                                        <div key={q._id || index} className="grid grid-cols-6 gap-4">
                                            <div className="px-4 py-3 grid grid-cols-6 gap-4 col-span-6">
                                                <div className="flex items-center">
                                                    <button onClick={() => toggleRow(index, 'uploaded')} className="text-gray-500 hover:text-gray-700">
                                                        {expandedRows.has(`uploaded-${index}`) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                    </button>
                                                </div>
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
                                                <div className="truncate" title={q.examples[0]?.input}>
                                                    {q.examples[0]?.input ? q.examples[0].input.substring(0, 30) + (q.examples[0].input.length > 30 ? "..." : "") : "No input"}
                                                </div>
                                                <div>
                                                    <button onClick={() => viewFullDetails(q)} className="text-blue-600 hover:text-blue-800 flex items-center">
                                                        <Eye size={16} className="mr-1" /> View Full
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {expandedRows.has(`uploaded-${index}`) && <ExpandedRowDetails question={q} />}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-gray-500">No questions found in the database.</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal for Full Details */}
                {showModal && selectedQuestion && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold">Question Details</h3>
                                    <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                                        ✕
                                    </button>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold">Question Number</h4>
                                        <p>{selectedQuestion.questionNumber}</p>
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-semibold">Question Name</h4>
                                        <p>{selectedQuestion.questionName}</p>
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-semibold">Difficulty</h4>
                                        <p>{selectedQuestion.difficulty}</p>
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-semibold">Description</h4>
                                        <p className="whitespace-pre-wrap">{selectedQuestion.description}</p>
                                    </div>
                                    
                                    <div>
                                        <h4 className="font-semibold">Constraints</h4>
                                        <p className="whitespace-pre-wrap">{selectedQuestion.constraints}</p>
                                    </div>
                                    
                                    {selectedQuestion.examples && selectedQuestion.examples.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold">Examples</h4>
                                            {selectedQuestion.examples.map((example, idx) => (
                                                <div key={idx} className="bg-gray-50 p-3 rounded mb-2">
                                                    <p><strong>Input:</strong> {example.input}</p>
                                                    <p><strong>Output:</strong> {example.output}</p>
                                                    {example.explanation && <p><strong>Explanation:</strong> {example.explanation}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {selectedQuestion.testCases && selectedQuestion.testCases.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold">Test Cases ({selectedQuestion.testCases.length})</h4>
                                            <div className="space-y-2">
                                                {selectedQuestion.testCases.map((testCase, idx) => (
                                                    <div key={idx} className="bg-gray-50 p-3 rounded text-sm">
                                                        <p><strong>Input:</strong> {testCase.input}</p>
                                                        <p><strong>Expected Output:</strong> {testCase.expectedOutput}</p>
                                                        {testCase.isSample && <span className="text-blue-600 text-xs">Sample Test Case</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {selectedQuestion.tags && selectedQuestion.tags.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold">Tags</h4>
                                            <div className="flex flex-wrap gap-1">
                                                {selectedQuestion.tags.map((tag, idx) => (
                                                    <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}