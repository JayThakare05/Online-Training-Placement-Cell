import React, { useMemo, useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import DashboardLayout from "../../components/DashboardLayout";

const beep = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=");

const starterSnippets = {
  c: `#include <stdio.h>
int main() {
    printf("Hello, C!\\n");
    return 0;
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
    cout << "Hello, C++!" << endl;
    return 0;
}
`,
  java: `import java.util.*;
class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");
    }
}
`,
  python: `print("Hello, Python!")`,
  javascript: `console.log("Hello, JavaScript!");`
};

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const WarningIcon = () => (
  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const ResultsScreen = ({ 
  score, 
  tabSwitches, 
  timeTaken, 
  totalTime, 
  cheatingEvents, 
  submissionType,
  onRestart 
}) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = () => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getSubmissionBadge = () => {
    switch (submissionType) {
      case 'manual':
        return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Manual Submission</span>;
      case 'timeout':
        return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">Time's Up</span>;
      case 'cheating':
        return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">Auto-Submitted (Cheating)</span>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-2">Assessment Complete!</h2>
            <p className="text-blue-100">Your coding session has ended</p>
          </div>
        </div>

        <div className="p-6">
          <div className="text-center mb-6">
            {getSubmissionBadge()}
          </div>

          <div className="text-center mb-8">
            <div className="mb-4">
              <div className={`text-6xl font-bold ${getScoreColor()} mb-2`}>
                {score}%
              </div>
              <p className="text-gray-600 text-lg">Final Score</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <ClockIcon />
                <span className="text-sm font-medium text-blue-700">Time Taken</span>
              </div>
              <div className="text-2xl font-bold text-blue-800">
                {formatTime(timeTaken)}
              </div>
              <div className="text-xs text-blue-600">
                out of {formatTime(totalTime)}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <svg className="w-4 h-4 mr-1 text-yellow-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-yellow-700">Tab Switches</span>
              </div>
              <div className="text-2xl font-bold text-yellow-800">
                {tabSwitches}
              </div>
              <div className="text-xs text-yellow-600">
                violations detected
              </div>
            </div>

            <div className={`${tabSwitches === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4 text-center`}>
              <div className="flex items-center justify-center mb-2">
                <svg className={`w-4 h-4 mr-1 ${tabSwitches === 0 ? 'text-green-700' : 'text-red-700'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className={`text-sm font-medium ${tabSwitches === 0 ? 'text-green-700' : 'text-red-700'}`}>Security</span>
              </div>
              <div className={`text-2xl font-bold ${tabSwitches === 0 ? 'text-green-800' : 'text-red-800'}`}>
                {tabSwitches === 0 ? 'CLEAN' : 'FLAGGED'}
              </div>
              <div className={`text-xs ${tabSwitches === 0 ? 'text-green-600' : 'text-red-600'}`}>
                {tabSwitches === 0 ? 'No violations' : 'Security breached'}
              </div>
            </div>
          </div>

          {cheatingEvents.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-red-700 mb-3 flex items-center">
                <WarningIcon />
                <span className="ml-2">Security Violations Detected</span>
              </h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="space-y-2">
                  {cheatingEvents.map((event, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-red-700 font-medium">{event.type}</span>
                      <span className="text-red-600">{new Date(event.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Performance Analysis</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Code Quality:</span>
                <span className="font-semibold text-gray-800">{score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Improvement'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Time Efficiency:</span>
                <span className="font-semibold text-gray-800">
                  {timeTaken < totalTime * 0.5 ? 'Very Fast' : timeTaken < totalTime * 0.8 ? 'Good' : 'Could be faster'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Security Compliance:</span>
                <span className={`font-semibold ${tabSwitches === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tabSwitches === 0 ? 'Perfect' : 'Violated'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={onRestart}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Start New Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function CodeRunner() {
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(starterSnippets["cpp"]);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [executionTime, setExecutionTime] = useState("");
  const [fontSize, setFontSize] = useState(14);
  const [showProblem, setShowProblem] = useState(true);
  const [timeLeft, setTimeLeft] = useState(300);
  const [startTime] = useState(Date.now());
  const totalTimeInSeconds = 300;

  const [tabSwitches, setTabSwitches] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [warned, setWarned] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [cheatingEvents, setCheatingEvents] = useState([]);
  const [submissionType, setSubmissionType] = useState('');
  const [windowFocused, setWindowFocused] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [attentionWarningTime, setAttentionWarningTime] = useState(null);
  const [unfocusedStartTime, setUnfocusedStartTime] = useState(null);

  const [problemData, setProblemData] = useState(null);
  const [questionLoading, setQuestionLoading] = useState(true);
  const [questionError, setQuestionError] = useState(null);

  const editorRef = useRef(null);
  const textareaRef = useRef(null);
  const [userId, setUserId] = useState(localStorage.getItem('userId') || '');
const [userLoading, setUserLoading] = useState(true);
  const [solutionStatus, setSolutionStatus] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [userSolutions, setUserSolutions] = useState([]);
  // Add this state variable with your other states
const [score, setScore] = useState(0);
useEffect(() => {
  const fetchUserData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("Authentication token not found.");
      setUserLoading(false); // 👈 Set to false on failure
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data. Your session might be invalid.');
      }

      const userData = await response.json();
      setUserId(userData.id);
    } catch (error) {
      console.error("Error fetching user data:", error);
      alert(error.message);
    } finally {
      setUserLoading(false); // 👈 Set to false after completion
    }
  };

  fetchUserData();
}, []);

useEffect(() => {
  if (userId && problemData?._id) {
    checkSolutionStatus();
    fetchUserSolutions();
  }
}, [userId, problemData]);

const checkSolutionStatus = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `http://localhost:5000/api/compiler/check-solution/${userId}/${problemData._id}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    const data = await response.json();
    setSolutionStatus(data);
  } catch (error) {
    console.error('Error checking solution status:', error);
  }
};

const fetchUserSolutions = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `http://localhost:5000/api/compiler/user-solutions/${userId}/${problemData._id}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    const data = await response.json();
    setUserSolutions(data.solutions || []);
  } catch (error) {
    console.error('Error fetching user solutions:', error);
  }
};
  const monacoLang = useMemo(() => {
    const map = { c: "c", cpp: "cpp", java: "java", python: "python", javascript: "javascript" };
    return map[language];
  }, [language]);

  useEffect(() => {
    fetchRandomQuestion();
  }, []);

  const fetchRandomQuestion = async () => {
    setQuestionLoading(true);
    setQuestionError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/questions/random', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setProblemData(data);
    } catch (error) {
      console.error('Error fetching question:', error);
      setQuestionError('Failed to load question. Please try again.');
      setProblemData({
        _id: "fallback",
        questionNumber: 101,
        questionName: "Two Sum",
        difficulty: "Easy",
        description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
        examples: [
          {
            input: "nums = [2,7,11,15], target = 9",
            output: "[0,1]",
            explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
          },
          {
            input: "nums = [3,2,4], target = 6",
            output: "[1,2]",
            explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]."
          },
          {
            input: "nums = [3,3], target = 6",
            output: "[0,1]"
          }
        ],
        constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists."
      });
    } finally {
      setQuestionLoading(false);
    }
  };

  const addCheatingEvent = (type) => {
    setCheatingEvents(prev => [...prev, { type, timestamp: Date.now() }]);
  };

  const calculateScore = () => {
    let score = 100;
    score -= tabSwitches * 10;
    const actualTimeTaken = totalTimeInSeconds - timeLeft;
    const timePercentage = actualTimeTaken / totalTimeInSeconds;
    if (timePercentage > 0.8) {
      score -= 10;
    }
    score -= cheatingEvents.length * 5;
    return Math.max(0, score);
  };

  useEffect(() => {
    if (!windowFocused && !submitted && attentionWarningTime) {
      const timer = setTimeout(() => {
        setSubmitted(true);
        setSubmissionType('cheating');
        setShowResults(true);
        addCheatingEvent('Auto-submitted due to prolonged inactivity');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [attentionWarningTime, windowFocused, submitted]);

  useEffect(() => {
    let blurCount = 0;
    let mouseLeaveCount = 0;
    let keydownViolations = 0;

    const preventWindowManipulation = (e) => {
      if (e.altKey && (e.key === 'F4' || e.key === 'Tab')) {
        e.preventDefault();
        addCheatingEvent('Window Manipulation Blocked');
        return false;
      }
      if (e.key === 'F11') {
        e.preventDefault();
        addCheatingEvent('Fullscreen Toggle Blocked');
        return false;
      }
    };

    const handleResize = () => {
      if (!submitted) {
        if (window.outerHeight < 600 || window.outerWidth < 1000) {
          addCheatingEvent('Window Manipulation Detected');
          if (window.outerHeight < 100 || window.outerWidth < 100) {
            setSubmitted(true);
            setSubmissionType('cheating');
            setShowResults(true);
          }
        }
      }
    };

    const handleFocus = () => {
      setWindowFocused(true);
      setAttentionWarningTime(null);
      setUnfocusedStartTime(null);
    };

    const handleBlur = () => {
      if (!submitted) {
        setWindowFocused(false);
        setUnfocusedStartTime(Date.now());
        setAttentionWarningTime(Date.now());
        blurCount++;
        beep.play();
        
        if (blurCount === 1 && !warned) {
          alert("⚠️ WARNING: Stay focused on this tab! Any cheating attempts will be recorded.");
          setWarned(true);
        }
        
        const newCount = tabSwitches + 1;
        setTabSwitches(newCount);
        addCheatingEvent('Window Focus Lost');
        
        if (newCount >= 3) {
          setSubmitted(true);
          setSubmissionType('cheating');
          setShowResults(true);
        }
      }
    };

    const handleMouseLeave = () => {
      if (!submitted && windowFocused) {
        mouseLeaveCount++;
        if (mouseLeaveCount > 5) {
          addCheatingEvent('Suspicious Mouse Activity');
        }
      }
    };

//     const handleKeyDown = (e) => {
//       preventWindowManipulation(e);

//       if (e.key === 'F12' || 
//           (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
//           (e.ctrlKey && e.key === 'U')) {
//         e.preventDefault();
//         keydownViolations++;
//         addCheatingEvent('Developer Tools Attempt');
//         if (keydownViolations > 3) {
//           setSubmitted(true);
//           setSubmissionType('cheating');
//           setShowResults(true);
//         }
//         return false;
//       }

//       if (e.ctrlKey && ['A', 'C', 'X', 'V'].includes(e.key)) {
//         e.preventDefault();
//         addCheatingEvent('Copy/Paste Attempt');
//         return false;
//       }

//       if (e.altKey && e.key === 'Tab') {
//         e.preventDefault();
//         addCheatingEvent('Alt+Tab Blocked');
//         return false;
//       }

//       if (e.key === 'Meta' || e.keyCode === 91) {
//         e.preventDefault();
//         addCheatingEvent('Windows Key Blocked');
//         return false;
//       }
//     };

    const handleContextMenu = (e) => {
      e.preventDefault();
      addCheatingEvent('Right-click Attempt');
      return false;
    };

    const handleSelectStart = (e) => {
      if (e.target.tagName !== 'TEXTAREA' && !e.target.closest('.monaco-editor')) {
        e.preventDefault();
        return false;
      }
    };

    const handleFullscreenChange = () => {
      const isNowFullscreen = document.fullscreenElement !== null;
      setIsFullscreen(isNowFullscreen);
      if (isNowFullscreen) {
        addCheatingEvent('Fullscreen Mode Detected');
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && !submitted) {
        addCheatingEvent('Tab/Window Hidden');
        setWindowFocused(false);
        setAttentionWarningTime(Date.now());
      } else if (!document.hidden) {
        setWindowFocused(true);
        setAttentionWarningTime(null);
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('mouseleave', handleMouseLeave);
//     document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('mouseleave', handleMouseLeave);
//       document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [submitted, windowFocused, tabSwitches, warned]);

  useEffect(() => {
    if (submitted) return;
    
    if (timeLeft <= 0) {
      setSubmitted(true);
      setSubmissionType('timeout');
      setShowResults(true);
      return;
    }
    
    const id = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft, submitted]);

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
    
    editor.onContextMenu(() => ({ actions: [] }));
    
//     editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyA, () => {});
//     editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {});
//     editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX, () => {});
//     editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {});
  }

  const runCode = async () => {
    if (submitted) return;
    setLoading(true);
    setOutput("Running your code...");
    setExecutionTime("");
    
    try {
      const response = await fetch("http://localhost:5000/api/compiler/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code, input })
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const { output: out, time } = data;
      const cleanOutput = out.replace(/\n\n\[.*\]$/, "");
      setOutput(cleanOutput || "No output");
      if (time) setExecutionTime(`Execution time: ${time}s`);
    } catch (err) {
      setOutput("Error: " + err.message + "\n\n(Note: This demo requires a backend server)");
    } finally {
      setLoading(false);
    }
  };

const handleSubmit = async () => {
  if (submitted) return;
  
  if (!output || output.includes("No output") || output.includes("Error:")) {
    alert("Please run your code successfully first to generate valid output before submitting.");
    return;
  }
  if (!problemData?._id) {
    alert("Question data is not loaded yet. Please wait.");
    return;
  }
  
  if (!userId) {
    alert("User ID is missing. Please try refreshing the page.");
    return;
  }
  const confirmSubmit = window.confirm(
    "Are you sure you want to submit your solution? This action cannot be undone."
  );
console.log("Submitting:", {
    language,
    codeLength: code.length,
    outputLength: output.length,
    questionId: problemData?._id,
    userId
  });
  
  if (confirmSubmit) {
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch("http://localhost:5000/api/compiler/submit-solution", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          language,
          code,
          output,
          questionId: problemData._id,
          userId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setSubmitted(true);
        setSubmissionType('manual');
        setShowResults(true);
        // Update the score based on evaluation
        setScore(result.evaluation.score);
        // Refresh solution status
        checkSolutionStatus();
        fetchUserSolutions();
      } else {
        alert("Submission failed: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }
};

  const handleRestart = () => {
    setLanguage("cpp");
    setCode(starterSnippets["cpp"]);
    setInput("");
    setOutput("");
    setLoading(false);
    setExecutionTime("");
    setTimeLeft(totalTimeInSeconds);
    setTabSwitches(0);
    setSubmitted(false);
    setWarned(false);
    setShowResults(false);
    setCheatingEvents([]);
    setSubmissionType('');
    setWindowFocused(true);
    setIsFullscreen(false);
    setShowProblem(true);
    setAttentionWarningTime(null);
    setUnfocusedStartTime(null);
    fetchRandomQuestion();
  };

  const onLangChange = (e) => {
    const val = e.target.value;
    setLanguage(val);
    setCode(starterSnippets[val]);
    setOutput("");
  };

  const clearCode = () => { 
    setCode(starterSnippets[language]); 
    setOutput(""); 
  };
  
  const clearOutput = () => { 
    setOutput(""); 
    setExecutionTime(""); 
  };
  
  const clearInput = () => setInput("");

  if (showResults) {
    const actualTimeTaken = totalTimeInSeconds - timeLeft;
    return (
      <ResultsScreen
        score={calculateScore()}
        tabSwitches={tabSwitches}
        timeTaken={actualTimeTaken}
        totalTime={totalTimeInSeconds}
        cheatingEvents={cheatingEvents}
        submissionType={submissionType}
        onRestart={handleRestart}
      />
    );
  }

  return (
    <DashboardLayout>
    <div className={`min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 ${submitted ? 'pointer-events-none opacity-60' : ''}`}>
      {!windowFocused && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 z-50 animate-pulse">
          ⚠️ ATTENTION: Please return to the exam window immediately!
        </div>
      )}

      <div className={`bg-white border-b border-gray-300 py-3 px-6 flex justify-between items-center shadow-sm ${!windowFocused ? 'mt-10' : ''}`}>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 font-medium">Language:</span>
            <select 
              value={language} 
              onChange={onLangChange} 
              className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={submitted}
            >
              <option value="cpp">C++</option>
              <option value="c">C</option>
              <option value="java">Java</option>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={runCode}
              disabled={loading || submitted}
              className="bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-lg"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Running...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Run
                </>
              )}
            </button>
            
            <button
              onClick={clearCode}
              disabled={submitted}
              className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Clear
            </button>
            
            <button
  onClick={handleSubmit}
  disabled={submitted || userLoading} 
  className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-lg"
>
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
  {submitting ? 'Submitting...' : 'Submit'}
</button>
          </div>
        </div>

        <div className="flex space-x-4 items-center">
          <div className="flex items-center space-x-2">
            <div className={`flex items-center px-3 py-1.5 rounded-md text-sm font-mono border ${
              timeLeft <= 60 ? 'bg-red-100 border-red-300 text-red-700 animate-pulse' : 
              'bg-blue-100 border-blue-300 text-blue-700'
            }`}>
              <ClockIcon />
              {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:
              {String(timeLeft % 60).padStart(2, "0")}
            </div>
            <span className={`px-3 py-1.5 rounded-md text-sm font-semibold border ${
              tabSwitches === 0 ? 'bg-green-100 border-green-300 text-green-700' :
              tabSwitches < 3 ? 'bg-yellow-100 border-yellow-300 text-yellow-700' :
              'bg-red-100 border-red-300 text-red-700'
            }`}>
              Violations: {tabSwitches}/3
            </span>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-75px)]">
        <div className="w-1/3 bg-white border-r border-gray-300 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-300 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center">
              <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Problem Question
            </h3>
          </div>
          <div className="p-4 overflow-y-auto flex-1">
            {questionLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading question...</p>
                </div>
              </div>
            ) : questionError ? (
              <div className="text-center text-red-600">
                <svg className="w-12 h-12 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="mb-2">{questionError}</p>
                <button 
                  onClick={fetchRandomQuestion}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-600"
                >
                  Retry
                </button>
              </div>
            ) : (
              // -- START: REPLACEMENT --
              problemData && (
                <>
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-gray-800">{problemData.questionName}</h2>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          problemData.difficulty === "Easy" ? "bg-green-100 text-green-800" :
                          problemData.difficulty === "Medium" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {problemData.difficulty}
                        </span>
                        {solutionStatus.isSolved && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Solved ({solutionStatus.solution?.score}%)
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Problem ID: #{problemData.questionNumber}</p>
                  </div>

                  {/* Solution History */}
                  {userSolutions.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-800 mb-2">Your Submissions:</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {userSolutions.map((solution, index) => (
                          <div key={solution.id || index} className={`p-2 rounded-md text-sm ${
                            solution.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                          }`}>
                            <div className="flex justify-between items-center">
                              <span className="font-medium">
                                {solution.language?.toUpperCase()} - {solution.score}%
                              </span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                solution.isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                              }`}>
                                {solution.isCorrect ? 'Correct' : 'Incorrect'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {new Date(solution.submittedAt).toLocaleString()} • 
                              Efficiency: {solution.efficiency || 'N/A'} • 
                              {solution.passedTestCases || 0}/{solution.totalTestCases || 0} test cases
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-line text-gray-700">{problemData.description}</p>
                    
                    {problemData.examples && problemData.examples.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold text-gray-800 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Examples:
                        </h4>
                        {problemData.examples.map((example, index) => (
                          <div key={index} className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                            <p className="font-medium text-gray-700">Example {index + 1}:</p>
                            {example.input && (
                              <p className="mt-1 text-sm font-mono text-blue-600">
                                <span className="font-medium text-gray-600">Input:</span> {typeof example.input === 'string' ? example.input : JSON.stringify(example.input)}
                              </p>
                            )}
                            {example.output && (
                              <p className="mt-1 text-sm font-mono text-green-600">
                                <span className="font-medium text-gray-600">Output:</span> {typeof example.output === 'string' ? example.output : JSON.stringify(example.output)}
                              </p>
                            )}
                            {example.explanation && (
                              <p className="mt-1 text-sm text-gray-600">
                                <span className="font-medium">Explanation:</span> {example.explanation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {problemData.constraints && (
                      <div className="mt-6">
                        <h4 className="font-semibold text-gray-800 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Constraints:
                        </h4>
                        <div className="mt-2 text-sm text-gray-700 pl-2 whitespace-pre-line">
                          {problemData.constraints}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )
              // -- END: REPLACEMENT --
            )}
          </div>
        </div>

        <div className="w-2/3 flex flex-col">
          <div className="flex-1 bg-white border-b border-gray-300 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-300 bg-gray-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Code to be written
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {language.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600">Font Size:</span>
                  <select 
                    value={fontSize} 
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="bg-white border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={submitted}
                  >
                    <option value={12}>12px</option>
                    <option value={14}>14px</option>
                    <option value={16}>16px</option>
                    <option value={18}>18px</option>
                    <option value={20}>20px</option>
                  </select>
                </div>
                <div className="text-xs text-gray-500">
                  Lines: {code.split('\n').length} | Chars: {code.length}
                </div>
              </div>
            </div>
            
            <div className="flex-1 relative">
              <Editor
                height="100%"
                theme="vs"
                language={monacoLang}
                value={code}
                onChange={(v) => setCode(v ?? "")}
                onMount={handleEditorDidMount}
                options={{
                  fontSize: fontSize,
                  automaticLayout: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  lineNumbers: "on",
                  glyphMargin: false,
                  folding: true,
                  lineDecorationsWidth: 10,
                  wordWrap: "on",
                  readOnly: submitted,
                  contextmenu: false,
                  copyWithSyntaxHighlighting: false,
                  quickSuggestions: false,
                  suggestOnTriggerCharacters: false
                }}
              />
            </div>
          </div>

          <div className="h-1/3 flex">
            <div className="w-1/2 bg-white border-r border-gray-300 overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-gray-300 bg-gray-50 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Inputs
                </h3>
                <button 
                  onClick={clearInput}
                  className="text-gray-500 hover:text-gray-800 text-xs transition-colors"
                  disabled={submitted}
                >
                  Clear
                </button>
              </div>
              <textarea
                ref={textareaRef}
                placeholder="Enter your program input here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 w-full p-3 text-sm font-mono bg-gray-50 text-gray-700 border-0 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset placeholder-gray-400"
                onContextMenu={(e) => e.preventDefault()}
                readOnly={submitted}
              />
            </div>

            <div className="w-1/2 bg-white overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-gray-300 bg-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Output
                  </h3>
                  {loading && (
                    <div className="w-3 h-3 border border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {executionTime && (
                    <span className="text-xs text-gray-500">{executionTime}</span>
                  )}
                  <button 
                    onClick={clearOutput}
                    className="text-gray-500 hover:text-gray-800 text-xs transition-colors"
                    disabled={submitted}
                  >
                    Clear
                  </button>
                </div>
              </div>
              
              <div className="flex-1 relative">
                <pre className="h-full p-3 overflow-auto bg-gray-50 text-green-700 font-mono text-sm whitespace-pre-wrap">
                  {output || (
                    <span className="text-gray-500">
                      Program output will appear here...
                      {'\n'}Click "Run" to execute your program.
                    </span>
                  )}
                </pre>
                {loading && (
                  <div className="absolute inset-0 bg-gray-50/90 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-blue-500 rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-gray-300 px-6 py-2">
        <div className="flex justify-center items-center text-xs text-gray-600">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${windowFocused ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
              {windowFocused ? 'Session Active' : 'Attention Required'}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Anti-Cheat Active
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              {isFullscreen ? 'Fullscreen' : 'Windowed'}
            </span>
          </div>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
}