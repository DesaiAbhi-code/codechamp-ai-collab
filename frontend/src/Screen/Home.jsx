import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../Context/User.context';
import axios from '../config/Axios';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const { user, setUser } = useContext(UserContext); // Accessing context to set user
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState(""); // Initialized as an empty string
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null); // Added error state for user feedback

  const navigate = useNavigate();

  // Create Project Function
  const createProject = (e) => {
    e.preventDefault();

    if (!projectName.trim()) {
      setError("Project name cannot be empty!");
      return;
    }

    axios.post('/project/create', { name: projectName })
      .then((res) => {
        console.log("Project created:", res.data);
        setIsModalOpen(false);
        setProjectName(""); // Reset project name after creation
        setError(null); // Clear any previous errors
      })
      .catch((error) => {
        console.log(error);
        setError("Error creating project, please try again.");
      });
  };

  // Fetch Projects on Component Mount
  useEffect(() => {
    axios.get('/project/all')
      .then((res) => {
        setProjects(res.data.projects);
      })
      .catch((err) => {
        console.log(err);
        setError("Error fetching projects, please try again.");
      });
  }, []);

  // Logout Functionality
  const logout = () => {
    // Clear user data from context and localStorage/sessionStorage
    setUser(null); // Assuming you use context to manage the user state
    localStorage.removeItem('user'); // Remove user data from localStorage (if used)
    sessionStorage.removeItem('user'); // Optionally remove from sessionStorage

    // Redirect to login page
    navigate('/login');
  };

  return (
    <main className="p-8 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">Welcome, {user?.email || 'User'}</h1>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
        >
          Logout
        </button>
      </div>

      <div className="projects flex flex-wrap gap-6 justify-center">
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-6 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition ease-in-out duration-200"
        >
          <i className="ri-add-line mr-2"></i> New Project
        </button>

        {projects.map((project) => (
          <div
            key={project._id}
            onClick={() => {
              navigate(`/project`, {
                state: { project },
              });
            }}
            className="project flex flex-col gap-4 p-6 bg-white border border-gray-300 rounded-lg shadow-lg hover:shadow-xl hover:bg-blue-50 transition ease-in-out duration-200 cursor-pointer w-80"
          >
            <h2 className="font-semibold text-xl text-gray-800">{project.name}</h2>
            <div className="flex gap-2 text-gray-500">
              <p>
                <small><i className="ri-user-line"></i> Collaborators</small> :
              </p>
              <p>{project.users.length}</p>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-1/3">
            <h2 className="text-2xl mb-6 text-center font-semibold text-gray-700">Create New Project</h2>
            {error && <p className="text-red-500 mb-4 text-center">{error}</p>} {/* Display error message */}
            <form onSubmit={createProject}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700">Project Name</label>
                <input
                  onChange={(e) => setProjectName(e.target.value)}
                  value={projectName}
                  type="text"
                  className="mt-2 block w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  className="px-6 py-3 bg-gray-300 rounded-lg text-gray-700 hover:bg-gray-400 transition duration-150"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;
