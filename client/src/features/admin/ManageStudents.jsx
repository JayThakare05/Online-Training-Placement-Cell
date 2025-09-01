import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { Users, GraduationCap, Loader, Edit, Trash2, Save, X, Upload, Eye, Plus, UserPlus, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState('');
  const [newStudentData, setNewStudentData] = useState({});
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkResults, setBulkResults] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(35);
  
  // Sorting states
  const [sortField, setSortField] = useState('registered');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/auth/admin/students", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  };

  // Pagination calculations
  const sortedStudents = [...students].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    // Handle date sorting
    if (sortField === 'registered' || sortField === 'dob') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    // Handle string sorting (case-insensitive)
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    // Handle null/undefined values
    if (!aValue && !bValue) return 0;
    if (!aValue) return sortDirection === 'asc' ? 1 : -1;
    if (!bValue) return sortDirection === 'asc' ? -1 : 1;
    
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });
  
  const totalPages = Math.ceil(sortedStudents.length / studentsPerPage);
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = sortedStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  // Sorting handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Pagination handlers
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Generate page numbers for pagination display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  const handleEdit = (student) => {
    setEditingId(student.student_id);
    setEditData({ ...student });
    setShowModal(true);
  };

  const handleChange = (e, field) => {
    const value = e.target.type === 'file' ? e.target.files[0] : e.target.value;
    setEditData({ ...editData, [field]: value });
  };

  const handleNewStudentChange = (e, field) => {
    const value = e.target.type === 'file' ? e.target.files[0] : e.target.value;
    setNewStudentData({ ...newStudentData, [field]: value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
        setEditData({ ...editData, profile_photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNewStudentImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewStudentData({ ...newStudentData, profile_photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const convertBlobToBase64 = (blob) => {
    if (!blob) return null;
    if (typeof blob === 'string' && blob.startsWith('data:')) {
      return blob;
    }
    return `data:image/jpeg;base64,${blob}`;
  };

  const handleSave = async (id) => {
    try {
      const token = localStorage.getItem("token");
      
      const formattedData = { ...editData };
      if (formattedData.dob) {
        const date = new Date(formattedData.dob);
        formattedData.dob = date.toISOString().split('T')[0];
      }

      if (selectedImage) {
        formattedData.profile_photo = selectedImage;
      }
      
      const res = await fetch(`http://localhost:5000/api/auth/admin/students/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formattedData,
          isPlaced: formattedData.isPlaced === "Yes" || formattedData.isPlaced === 1 ? 1 : 0,
        }),
      });

      if (res.ok) {
        fetchStudents();
        setEditingId(null);
        setShowModal(false);
        setSelectedImage(null);
        alert("Student updated successfully!");
      }
    } catch (err) {
      console.error("Error updating student:", err);
      alert("Error updating student. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/auth/admin/students/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setStudents(students.filter((s) => s.student_id !== id));
        // Adjust current page if necessary after deletion
        const newTotalPages = Math.ceil((students.length - 1) / studentsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
        }
        alert("Student deleted successfully!");
      }
    } catch (err) {
      console.error("Error deleting student:", err);
      alert("Error deleting student. Please try again.");
    }
  };

  const closeModal = () => {
    setEditingId(null);
    setShowModal(false);
    setSelectedImage(null);
    setEditData({});
  };

  const openAddModal = (type) => {
    setAddType(type);
    setShowAddModal(true);
    setNewStudentData({});
    setBulkFile(null);
    setBulkResults(null);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setAddType('');
    setNewStudentData({});
    setBulkFile(null);
    setBulkResults(null);
  };

  const handleSingleStudentRegister = async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (!newStudentData.name || !newStudentData.email || !newStudentData.password) {
        alert("Name, email, and password are required!");
        return;
      }

      const formData = new FormData();
      formData.append('name', newStudentData.name);
      formData.append('email', newStudentData.email);
      formData.append('password', newStudentData.password);
      formData.append('role', 'student');
      
      if (newStudentData.dob) formData.append('dob', newStudentData.dob);
      if (newStudentData.gender) formData.append('gender', newStudentData.gender);
      if (newStudentData.contact) formData.append('contact', newStudentData.contact);
      if (newStudentData.address) formData.append('address', newStudentData.address);
      if (newStudentData.roll_no) formData.append('roll_no', newStudentData.roll_no);
      if (newStudentData.college) formData.append('college', newStudentData.college);
      if (newStudentData.department) formData.append('department', newStudentData.department);
      if (newStudentData.year_of_study) formData.append('year_of_study', newStudentData.year_of_study);
      if (newStudentData.cgpa) formData.append('cgpa', newStudentData.cgpa);
      if (newStudentData.marks_10) formData.append('marks_10', newStudentData.marks_10);
      if (newStudentData.marks_12) formData.append('marks_12', newStudentData.marks_12);
      if (newStudentData.backlogs) formData.append('backlogs', newStudentData.backlogs);
      if (newStudentData.skills) formData.append('skills', newStudentData.skills);
      if (newStudentData.certifications) formData.append('certifications', newStudentData.certifications);
      if (newStudentData.projects) formData.append('projects', newStudentData.projects);
      if (newStudentData.resume_url) formData.append('resume_url', newStudentData.resume_url);
      if (newStudentData.job_roles) formData.append('job_roles', newStudentData.job_roles);
      if (newStudentData.job_locations) formData.append('job_locations', newStudentData.job_locations);
      if (newStudentData.placement_status) formData.append('placement_status', newStudentData.placement_status);
      if (newStudentData.isPlaced !== undefined) formData.append('isPlaced', newStudentData.isPlaced ? 1 : 0);

      if (newStudentData.profile_photo) {
        if (typeof newStudentData.profile_photo === 'string' && newStudentData.profile_photo.startsWith('data:')) {
          const response = await fetch(newStudentData.profile_photo);
          const blob = await response.blob();
          formData.append('photo', blob, 'profile.jpg');
        } else {
          formData.append('photo', newStudentData.profile_photo);
        }
      }

      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        alert("Student registered successfully!");
        fetchStudents();
        closeAddModal();
        // Go to the last page to show the newly added student
        const newTotalPages = Math.ceil((students.length + 1) / studentsPerPage);
        setCurrentPage(newTotalPages);
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (err) {
      console.error("Error registering student:", err);
      alert("Error registering student. Please try again.");
    }
  };

  const handleBulkFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBulkFile(file);
    }
  };

  const processBulkRegistration = async () => {
    if (!bulkFile) {
      alert("Please select a file first!");
      return;
    }

    setBulkProcessing(true);
    
    try {
      const token = localStorage.getItem("token");
      let studentsData = [];

      if (bulkFile.name.endsWith('.csv')) {
        Papa.parse(bulkFile, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
            studentsData = results.data;
            await processBulkData(studentsData, token);
          },
          error: (error) => {
            console.error("CSV parsing error:", error);
            alert("Error parsing CSV file");
            setBulkProcessing(false);
          }
        });
      } else if (bulkFile.name.endsWith('.xlsx') || bulkFile.name.endsWith('.xls')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            const worksheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[worksheetName];
            
            studentsData = XLSX.utils.sheet_to_json(worksheet);
            processBulkData(studentsData, token);
          } catch (err) {
            console.error("Excel parsing error:", err);
            alert("Error parsing Excel file");
            setBulkProcessing(false);
          }
        };
        reader.onerror = () => {
          alert("Error reading file");
          setBulkProcessing(false);
        };
        reader.readAsArrayBuffer(bulkFile);
      } else {
        alert("Please select a CSV or Excel file");
        setBulkProcessing(false);
      }
    } catch (err) {
      console.error("Error processing bulk file:", err);
      alert("Error processing file. Please try again.");
      setBulkProcessing(false);
    }
  };

  const processBulkData = async (studentsData, token) => {
    const results = {
      success: [],
      errors: []
    };

    for (let i = 0; i < studentsData.length; i++) {
      const studentData = studentsData[i];
      
      try {
        if (!studentData.name || !studentData.email || !studentData.password) {
          results.errors.push({
            row: i + 1,
            data: studentData,
            error: "Missing required fields (name, email, password)"
          });
          continue;
        }

        const formData = new FormData();
        formData.append('name', studentData.name);
        formData.append('email', studentData.email);
        formData.append('password', studentData.password);
        formData.append('role', 'student');
        
        Object.keys(studentData).forEach(key => {
          if (key !== 'name' && key !== 'email' && key !== 'password' && studentData[key]) {
            formData.append(key, studentData[key]);
          }
        });

        const res = await fetch("http://localhost:5000/api/auth/register", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (res.ok) {
          results.success.push({
            row: i + 1,
            name: studentData.name,
            email: studentData.email
          });
        } else {
          const errorData = await res.json();
          results.errors.push({
            row: i + 1,
            data: studentData,
            error: errorData.message
          });
        }
      } catch (err) {
        results.errors.push({
          row: i + 1,
          data: studentData,
          error: err.message
        });
      }
    }

    setBulkResults(results);
    setBulkProcessing(false);
    fetchStudents();
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-orange-600" />
              Manage Students
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Total: {students.length} students | Page {currentPage} of {totalPages}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => openAddModal('single')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add Single Student
            </button>
            <button
              onClick={() => openAddModal('bulk')}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Bulk Registration
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader className="animate-spin w-6 h-6 text-gray-600" />
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg shadow-md">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-2 border">Photo</th>
                    <th 
                      className="px-4 py-2 border cursor-pointer hover:bg-gray-200 select-none"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Name
                        {sortField === 'name' && (
                          <span className="text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-2 border cursor-pointer hover:bg-gray-200 select-none"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Email
                        {sortField === 'email' && (
                          <span className="text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-2 border cursor-pointer hover:bg-gray-200 select-none"
                      onClick={() => handleSort('dob')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        DOB
                        {sortField === 'dob' && (
                          <span className="text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-2 border">Gender</th>
                    <th className="px-4 py-2 border">Contact</th>
                    <th 
                      className="px-4 py-2 border cursor-pointer hover:bg-gray-200 select-none"
                      onClick={() => handleSort('roll_no')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Roll No
                        {sortField === 'roll_no' && (
                          <span className="text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-2 border cursor-pointer hover:bg-gray-200 select-none"
                      onClick={() => handleSort('college')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        College
                        {sortField === 'college' && (
                          <span className="text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-2 border cursor-pointer hover:bg-gray-200 select-none"
                      onClick={() => handleSort('department')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Dept
                        {sortField === 'department' && (
                          <span className="text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-2 border cursor-pointer hover:bg-gray-200 select-none"
                      onClick={() => handleSort('year_of_study')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Year
                        {sortField === 'year_of_study' && (
                          <span className="text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-2 border cursor-pointer hover:bg-gray-200 select-none"
                      onClick={() => handleSort('cgpa')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        CGPA
                        {sortField === 'cgpa' && (
                          <span className="text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-2 border cursor-pointer hover:bg-gray-200 select-none"
                      onClick={() => handleSort('marks_10')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        10th %
                        {sortField === 'marks_10' && (
                          <span className="text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-2 border cursor-pointer hover:bg-gray-200 select-none"
                      onClick={() => handleSort('marks_12')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        12th %
                        {sortField === 'marks_12' && (
                          <span className="text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-2 border cursor-pointer hover:bg-gray-200 select-none"
                      onClick={() => handleSort('backlogs')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Backlogs
                        {sortField === 'backlogs' && (
                          <span className="text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-2 border">Skills</th>
                    <th className="px-4 py-2 border">Resume</th>
                    <th className="px-4 py-2 border">Job Roles</th>
                    <th className="px-4 py-2 border">Locations</th>
                    <th className="px-4 py-2 border">Status</th>
                    <th 
                      className="px-4 py-2 border cursor-pointer hover:bg-gray-200 select-none"
                      onClick={() => handleSort('isPlaced')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Placed?
                        {sortField === 'isPlaced' && (
                          <span className="text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-2 border cursor-pointer hover:bg-gray-200 select-none"
                      onClick={() => handleSort('registered')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Registered
                        {sortField === 'registered' && (
                          <span className="text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-2 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStudents.length > 0 ? (
                    currentStudents.map((s) => (
                      <tr key={s.student_id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 border">
                          {s.profile_photo ? (
                            <img
                              src={convertBlobToBase64(s.profile_photo)}
                              alt="Profile"
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                              <Users className="w-6 h-6 text-gray-600" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 border">{s.name}</td>
                        <td className="px-4 py-2 border">{s.email}</td>
                        <td className="px-4 py-2 border">
                          {s.dob ? new Date(s.dob).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-2 border">{s.gender || 'N/A'}</td>
                        <td className="px-4 py-2 border">{s.contact || 'N/A'}</td>
                        <td className="px-4 py-2 border">{s.roll_no || 'N/A'}</td>
                        <td className="px-4 py-2 border">{s.college}</td>
                        <td className="px-4 py-2 border">{s.department}</td>
                        <td className="px-4 py-2 border">{s.year_of_study}</td>
                        <td className="px-4 py-2 border">{s.cgpa}</td>
                        <td className="px-4 py-2 border">{s.marks_10 || 'N/A'}</td>
                        <td className="px-4 py-2 border">{s.marks_12 || 'N/A'}</td>
                        <td className="px-4 py-2 border">{s.backlogs || 0}</td>
                        <td className="px-4 py-2 border max-w-xs">
                          <div className="truncate" title={s.skills}>
                            {Array.isArray(s.skills) ? s.skills.join(", ") : s.skills}
                          </div>
                        </td>
                        <td className="px-4 py-2 border">
                          {s.resume_url ? (
                            <a
                              href={s.resume_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline flex items-center gap-1"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </a>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td className="px-4 py-2 border max-w-xs">
                          <div className="truncate" title={s.job_roles}>
                            {s.job_roles || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-2 border max-w-xs">
                          <div className="truncate" title={s.job_locations}>
                            {s.job_locations || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-2 border">{s.placement_status || 'N/A'}</td>
                        <td className="px-4 py-2 border">
                          {s.isPlaced ? (
                            <span className="text-green-600 font-semibold">Yes</span>
                          ) : (
                            <span className="text-red-600 font-semibold">No</span>
                          )}
                        </td>
                        <td className="px-4 py-2 border">
                          {new Date(s.registered).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 border">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(s)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit Student"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(s.student_id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete Student"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="22" className="text-center py-4 text-gray-500">
                        No students found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Component */}
            {students.length > studentsPerPage && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {indexOfFirstStudent + 1} to{" "}
                  {Math.min(indexOfLastStudent, students.length)} of {students.length} students
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <div className="flex items-center space-x-1">
                    {getPageNumbers().map((pageNumber, index) => (
                      <button
                        key={index}
                        onClick={() => typeof pageNumber === 'number' && handlePageChange(pageNumber)}
                        disabled={pageNumber === '...'}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          pageNumber === currentPage
                            ? 'bg-blue-600 text-white border border-blue-600'
                            : pageNumber === '...'
                            ? 'text-gray-400 cursor-default'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Edit Student Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto m-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Edit Student Details</h2>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Profile Photo */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    {(selectedImage || editData.profile_photo) && (
                      <img
                        src={selectedImage || convertBlobToBase64(editData.profile_photo)}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover border"
                      />
                    )}
                    <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    value={editData.name || ''}
                    onChange={(e) => handleChange(e, "name")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={editData.email || ''}
                    onChange={(e) => handleChange(e, "email")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* DOB */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={editData.dob ? new Date(editData.dob).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleChange(e, "dob")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select
                    value={editData.gender || ''}
                    onChange={(e) => handleChange(e, "gender")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Contact */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact</label>
                  <input
                    value={editData.contact || ''}
                    onChange={(e) => handleChange(e, "contact")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Roll Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Roll Number</label>
                  <input
                    value={editData.roll_no || ''}
                    onChange={(e) => handleChange(e, "roll_no")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* College */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">College</label>
                  <input
                    value={editData.college || ''}
                    onChange={(e) => handleChange(e, "college")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <input
                    value={editData.department || ''}
                    onChange={(e) => handleChange(e, "department")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Year of Study */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year of Study</label>
                  <select
                    value={editData.year_of_study || ''}
                    onChange={(e) => handleChange(e, "year_of_study")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                {/* CGPA */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={editData.cgpa || ''}
                    onChange={(e) => handleChange(e, "cgpa")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 10th Marks */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">10th Marks (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={editData.marks_10 || ''}
                    onChange={(e) => handleChange(e, "marks_10")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 12th Marks */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">12th Marks (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={editData.marks_12 || ''}
                    onChange={(e) => handleChange(e, "marks_12")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Backlogs */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Backlogs</label>
                  <input
                    type="number"
                    min="0"
                    value={editData.backlogs || ''}
                    onChange={(e) => handleChange(e, "backlogs")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Placement Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Placement Status</label>
                  <input
                    value={editData.placement_status || ''}
                    onChange={(e) => handleChange(e, "placement_status")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Is Placed */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Is Placed</label>
                  <select
                    value={editData.isPlaced ? "Yes" : "No"}
                    onChange={(e) => handleChange(e, "isPlaced")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                {/* Address */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    value={editData.address || ''}
                    onChange={(e) => handleChange(e, "address")}
                    rows="3"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Skills */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                  <textarea
                    value={editData.skills || ''}
                    onChange={(e) => handleChange(e, "skills")}
                    rows="3"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Certifications */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
                  <textarea
                    value={editData.certifications || ''}
                    onChange={(e) => handleChange(e, "certifications")}
                    rows="3"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Projects */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Projects</label>
                  <textarea
                    value={editData.projects || ''}
                    onChange={(e) => handleChange(e, "projects")}
                    rows="3"
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Job Roles */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Job Roles</label>
                  <input
                    value={editData.job_roles || ''}
                    onChange={(e) => handleChange(e, "job_roles")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Job Locations */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Job Locations</label>
                  <input
                    value={editData.job_locations || ''}
                    onChange={(e) => handleChange(e, "job_locations")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Resume URL */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Resume URL</label>
                  <input
                    value={editData.resume_url || ''}
                    onChange={(e) => handleChange(e, "resume_url")}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSave(editData.student_id)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Student Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto m-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {addType === 'single' ? 'Add New Student' : 'Bulk Student Registration'}
                </h2>
                <button onClick={closeAddModal} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {addType === 'single' ? (
                /* Single Student Form */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Profile Photo */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
                    <div className="flex items-center gap-4">
                      {newStudentData.profile_photo && (
                        <img
                          src={typeof newStudentData.profile_photo === 'string' ? 
                                newStudentData.profile_photo : 
                                URL.createObjectURL(newStudentData.profile_photo)}
                          alt="Profile"
                          className="w-20 h-20 rounded-full object-cover border"
                        />
                      )}
                      <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Upload Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleNewStudentImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Required Fields */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                    <input
                      value={newStudentData.name || ''}
                      onChange={(e) => handleNewStudentChange(e, "name")}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={newStudentData.email || ''}
                      onChange={(e) => handleNewStudentChange(e, "email")}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                    <input
                      type="password"
                      value={newStudentData.password || ''}
                      onChange={(e) => handleNewStudentChange(e, "password")}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Optional Fields */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                    <input
                      type="date"
                      value={newStudentData.dob || ''}
                      onChange={(e) => handleNewStudentChange(e, "dob")}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                    <select
                      value={newStudentData.gender || ''}
                      onChange={(e) => handleNewStudentChange(e, "gender")}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact</label>
                    <input
                      value={newStudentData.contact || ''}
                      onChange={(e) => handleNewStudentChange(e, "contact")}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Roll Number</label>
                    <input
                      value={newStudentData.roll_no || ''}
                      onChange={(e) => handleNewStudentChange(e, "roll_no")}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">College</label>
                    <input
                      value={newStudentData.college || ''}
                      onChange={(e) => handleNewStudentChange(e, "college")}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <input
                      value={newStudentData.department || ''}
                      onChange={(e) => handleNewStudentChange(e, "department")}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year of Study</label>
                    <select
                      value={newStudentData.year_of_study || ''}
                      onChange={(e) => handleNewStudentChange(e, "year_of_study")}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Year</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CGPA</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={newStudentData.cgpa || ''}
                      onChange={(e) => handleNewStudentChange(e, "cgpa")}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">10th Marks (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={newStudentData.marks_10 || ''}
                      onChange={(e) => handleNewStudentChange(e, "marks_10")}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">12th Marks (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={newStudentData.marks_12 || ''}
                      onChange={(e) => handleNewStudentChange(e, "marks_12")}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Backlogs</label>
                    <input
                      type="number"
                      min="0"
                      value={newStudentData.backlogs || ''}
                      onChange={(e) => handleNewStudentChange(e, "backlogs")}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Placement Status</label>
                    <input
                      value={newStudentData.placement_status || ''}
                      onChange={(e) => handleNewStudentChange(e, "placement_status")}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Is Placed</label>
                    <select
                      value={newStudentData.isPlaced ? "Yes" : "No"}
                      onChange={(e) => handleNewStudentChange(e, "isPlaced")}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Job Roles</label>
                    <input
                      value={newStudentData.job_roles || ''}
                      onChange={(e) => handleNewStudentChange(e, "job_roles")}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Job Locations</label>
                    <input
                      value={newStudentData.job_locations || ''}
                      onChange={(e) => handleNewStudentChange(e, "job_locations")}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <textarea
                      value={newStudentData.address || ''}
                      onChange={(e) => handleNewStudentChange(e, "address")}
                      rows="3"
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                    <textarea
                      value={newStudentData.skills || ''}
                      onChange={(e) => handleNewStudentChange(e, "skills")}
                      rows="3"
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter skills separated by commas"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
                    <textarea
                      value={newStudentData.certifications || ''}
                      onChange={(e) => handleNewStudentChange(e, "certifications")}
                      rows="3"
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Projects</label>
                    <textarea
                      value={newStudentData.projects || ''}
                      onChange={(e) => handleNewStudentChange(e, "projects")}
                      rows="3"
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Resume URL</label>
                    <input
                      value={newStudentData.resume_url || ''}
                      onChange={(e) => handleNewStudentChange(e, "resume_url")}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/resume.pdf"
                    />
                  </div>
                </div>
              ) : (
                /* Bulk Registration Form */
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">CSV/Excel File Requirements:</h3>
                    <p className="text-blue-700 text-sm mb-2">
                      Your file should contain the following columns (required fields marked with *):
                    </p>
                    <div className="text-sm text-blue-600 grid grid-cols-1 md:grid-cols-2 gap-1">
                      <div>• name* • email* • password*</div>
                      <div>• dob • gender • contact</div>
                      <div>• address • roll_no • college</div>
                      <div>• department • year_of_study • cgpa</div>
                      <div>• marks_10 • marks_12 • backlogs</div>
                      <div>• skills • certifications • projects</div>
                      <div>• resume_url • job_roles • job_locations</div>
                      <div>• placement_status • isPlaced</div>
                    </div>
                    <p className="text-blue-600 text-xs mt-2">
                      Note: student_id and user_id will be auto-generated. Don't include them in your file.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select CSV or Excel File
                    </label>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleBulkFileChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Supported formats: CSV, XLSX, XLS
                    </p>
                  </div>

                  {bulkFile && (
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-sm text-gray-600">Selected file: <span className="font-medium">{bulkFile.name}</span></p>
                    </div>
                  )}

                  {bulkResults && (
                    <div className="space-y-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2">
                          Successfully Registered ({bulkResults.success.length})
                        </h4>
                        {bulkResults.success.length > 0 && (
                          <div className="max-h-32 overflow-y-auto">
                            {bulkResults.success.map((student, index) => (
                              <div key={index} className="text-sm text-green-600">
                                Row {student.row}: {student.name} ({student.email})
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {bulkResults.errors.length > 0 && (
                        <div className="bg-red-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-red-800 mb-2">
                            Errors ({bulkResults.errors.length})
                          </h4>
                          <div className="max-h-32 overflow-y-auto">
                            {bulkResults.errors.map((error, index) => (
                              <div key={index} className="text-sm text-red-600">
                                Row {error.row}: {error.error}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={closeAddModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                {addType === 'single' ? (
                  <button
                    onClick={handleSingleStudentRegister}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Register Student
                  </button>
                ) : (
                  <button
                    onClick={processBulkRegistration}
                    disabled={!bulkFile || bulkProcessing}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bulkProcessing ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {bulkProcessing ? 'Processing...' : 'Process File'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}