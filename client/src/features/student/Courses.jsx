import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fake data
    const fakeCourses = [
      {
        _id: "1",
        title: "Web Development Bootcamp",
        description: "Learn HTML, CSS, JavaScript, and React step by step.",
        instructor: "John Doe",
      },
      {
        _id: "2",
        title: "Data Structures in C++",
        description: "Master data structures and algorithms with hands-on coding.",
        instructor: "Jane Smith",
      },
      {
        _id: "3",
        title: "Python for Data Science",
        description: "Explore NumPy, Pandas, and machine learning basics.",
        instructor: "Alex Johnson",
      },
    ];

    // Simulate network delay
    setTimeout(() => {
      setCourses(fakeCourses);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <DashboardLayout>
      {loading ? (
        <p className="text-center text-gray-500">Loading courses...</p>
      ) : courses.length === 0 ? (
        <p className="text-center text-gray-500">No courses available.</p>
      ) : (
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Available Courses</h1>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course._id}
                className="bg-white rounded-2xl shadow p-5 border hover:shadow-lg transition"
              >
                <h2 className="text-xl font-semibold mb-2">{course.title}</h2>
                <p className="text-gray-600 text-sm mb-3">{course.description}</p>
                <p className="text-sm text-gray-500 mb-4">
                  Instructor: {course.instructor}
                </p>
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg">
                  Enroll
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
