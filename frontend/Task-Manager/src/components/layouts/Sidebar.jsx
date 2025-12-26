import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../../context/userContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosinstance';
import { API_PATHS } from '../../utils/apiPaths';
import toast from 'react-hot-toast';
import { 
  LuPlus, 
  LuChevronDown, 
  LuLogOut, 
  LuSettings, 
  LuChevronLeft, 
  LuChevronRight,
  LuFolder
} from 'react-icons/lu';

const Sidebar = ({ menuData, activeMenu }) => {
  const { user, clearUser } = useContext(UserContext);
  const navigate = useNavigate();
  const { projectId: activeProjectId } = useParams();

  const [projects, setProjects] = useState([]);
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false); // New state for collapse

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const endpoint = user.role === 'admin' 
            ? API_PATHS.PROJECTS.GET_ALL_PROJECTS 
            : API_PATHS.PROJECTS.GET_MY_PROJECTS;

        const response = await axiosInstance.get(endpoint);
        setProjects(response.data || []);
      } catch (error) {
        console.error("Failed to fetch projects for sidebar", error);
      }
    };
    
    if (user) {
        fetchProjects();
    }
  }, [user]);

  const handleCreateProject = async () => {
    const newProjectName = window.prompt("Enter the new project name:");
    if (!newProjectName || !newProjectName.trim()) return;

    try {
      const response = await axiosInstance.post(API_PATHS.PROJECTS.CREATE_PROJECT, { name: newProjectName.trim() });
      toast.success(`Project "${response.data.name}" created!`);
      setProjects(prevProjects => [...prevProjects, response.data]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create project.");
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
  };
  
  const handleLogout = () => {
    localStorage.clear();
    clearUser();
    navigate('/login');
  };

  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}/dashboard`);
  };

  // Helper to handle expansion logic
  const toggleProjects = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setIsProjectsExpanded(true);
    } else {
      setIsProjectsExpanded(!isProjectsExpanded);
    }
  };

  const mainMenuItems = menuData.filter(item => item.path !== 'logout');

  return (
    <aside 
      className={`hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header / Logo Section */}
      <div className={`p-4 border-b border-slate-200 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && <h2 className="text-lg font-bold text-primary truncate">Task Manager</h2>}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-primary transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <LuChevronRight size={20} /> : <LuChevronLeft size={20} />}
        </button>
      </div>

      {/* User Profile Section */}
      <div className="p-4">
        <Link to="/profile" className={`block p-2 rounded-lg hover:bg-slate-100 transition-colors ${isCollapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <img 
              src={user?.profileImageUrl || `https://ui-avatars.com/api/?name=${user?.name || 'A'}`} 
              alt="profile" 
              className="w-10 h-10 rounded-full object-cover shrink-0"
            />
            {!isCollapsed && (
              <div className="overflow-hidden">
                <h5 className="font-semibold text-sm truncate">{user?.name}</h5>
                <p className="text-xs text-slate-500 truncate">{user?.role === 'admin' ? 'Administrator' : 'Member'}</p>
              </div>
            )}
          </div>
        </Link>
          
        {user?.role === 'admin' && (
          <button 
            onClick={() => navigate('/admin/create-task')} 
            className={`w-full flex items-center gap-2 bg-primary text-white font-semibold py-2 rounded-lg hover:bg-primary/90 transition-colors mb-4 mt-2 ${
              isCollapsed ? 'justify-center px-0' : 'justify-center'
            }`}
            title="Create Task"
          >
            <LuPlus size={isCollapsed ? 24 : 18} /> 
            {!isCollapsed && <span>Create Task</span>}
          </button>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {mainMenuItems.map((item) => (
          <button 
            key={item.id} 
            onClick={() => handleNavigate(item.path)} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors mb-1 ${
              activeMenu === item.label ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-100'
            } ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? item.label : ''}
          >
            <item.icon className="text-lg shrink-0" />
            {!isCollapsed && <span>{item.label}</span>}
          </button>
        ))}

        {/* Projects Section */}
        <div className="mt-4">
            <button 
                onClick={toggleProjects} 
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-md ${
                    isCollapsed ? 'justify-center' : 'justify-between'
                }`}
                title="Projects"
            >
                {/* Show Icon when collapsed, or Text when expanded */}
                {isCollapsed ? (
                    <LuFolder className="text-lg shrink-0" />
                ) : (
                    <>
                        <span>Projects</span>
                        <div className="flex items-center gap-2">
                            {user?.role === 'admin' && (
                                <LuPlus 
                                    onClick={(e) => { e.stopPropagation(); handleCreateProject(); }} 
                                    className="hover:text-primary"
                                />
                            )}
                            <LuChevronDown className={`transition-transform ${isProjectsExpanded ? 'rotate-180' : ''}`}/>
                        </div>
                    </>
                )}
            </button>

            {/* Projects List - Only show if expanded and NOT collapsed (or if logic prefers, ensure sidebar expands when project list is open) */}
            {isProjectsExpanded && !isCollapsed && (
                <div className="mt-2 pl-4 border-l-2 border-slate-200">
                    {projects.map(project => {
                        const isProjectActive = project._id === activeProjectId;
                        return (
                            <div key={project._id} className={`flex items-center group rounded-md ${isProjectActive ? 'bg-slate-100' : ''}`}>
                                <button 
                                    onClick={() => handleProjectClick(project._id)} 
                                    className={`flex-1 text-left px-3 py-1.5 text-sm hover:text-primary rounded-md truncate ${
                                        isProjectActive ? 'font-semibold text-primary' : 'text-slate-600'
                                    }`}
                                >
                                    {project.name}
                                </button>
                                {user?.role === 'admin' && 
                                    <button 
                                        onClick={() => navigate(`/projects/${project._id}/details`)} 
                                        className="p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-primary"
                                    >
                                        <LuSettings size={14} />
                                    </button>
                                }
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-200">
        <button 
            onClick={handleLogout} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 ${
                isCollapsed ? 'justify-center' : ''
            }`}
            title="Logout"
        >
          <LuLogOut className="text-lg shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;