import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Filter, PieChart, ArrowRight, Crown, Users } from 'lucide-react';

const StatCard = ({ title, value, filter, onSeeAll }) => (
  <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:scale-105 transition-all duration-300">
    <div className="flex items-start justify-between mb-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-600 truncate">{title}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1 truncate">{value}</p>
      </div>
      {filter && (
        <button className="text-gray-500 hover:text-gray-700 flex-shrink-0 ml-2 transition-colors duration-200">
          <Filter className="w-4 h-4" />
        </button>
      )}
    </div>
    <div className="flex items-center justify-between mt-4">
      <span className="text-xs text-gray-500 truncate">
        {filter ? '= 1 Filter' : 'No Filters'}
      </span>
      {filter && onSeeAll && (
        <button 
          onClick={onSeeAll}
          className="text-xs text-purple-600 cursor-pointer flex-shrink-0 ml-2 hover:text-purple-700 flex items-center transition-colors duration-200 font-semibold"
        >
          See all <ArrowRight className="w-3 h-3 ml-1" />
        </button>
      )}
    </div>
  </div>
);

const PieChartComponent = ({ data, title, filterCount = 1, onSeeAll }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const colors = ['#A78BFA', '#C084FC', '#E879F9', '#F472B6'];
  
  let accumulatedAngle = 0;
  
  return (
    <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:scale-105 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-800 truncate text-lg">{title}</h3>
        <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600 font-medium">= {filterCount} Filter</span>
          <button 
            onClick={onSeeAll}
            className="text-sm text-purple-600 hover:text-purple-700 flex items-center transition-colors duration-200 font-semibold"
          >
            See all <ArrowRight className="w-3 h-3 ml-1" />
          </button>
        </div>
      </div>
      
      <div className="flex flex-col items-center">
        <div className="relative w-48 h-48 mb-6 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {data.map((item, index) => {
              const percentage = total > 0 ? (item.value / total) * 100 : 0;
              const angle = (percentage / 100) * 360;
              const largeArc = angle > 180 ? 1 : 0;
              
              const x1 = 50 + 50 * Math.cos(accumulatedAngle * Math.PI / 180);
              const y1 = 50 + 50 * Math.sin(accumulatedAngle * Math.PI / 180);
              accumulatedAngle += angle;
              const x2 = 50 + 50 * Math.cos(accumulatedAngle * Math.PI / 180);
              const y2 = 50 + 50 * Math.sin(accumulatedAngle * Math.PI / 180);
              
              const pathData = [
                `M 50 50`,
                `L ${x1} ${y1}`,
                `A 50 50 0 ${largeArc} 1 ${x2} ${y2}`,
                `Z`
              ].join(' ');
              
              return (
                <path
                  key={index}
                  d={pathData}
                  fill={colors[index % colors.length]}
                  stroke="white"
                  strokeWidth="3"
                />
              );
            })}
          </svg>
        </div>
        
        <div className="w-full space-y-3">
          {data.map((item, index) => {
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
            return (
              <div key={index} className="flex items-center justify-between w-full p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center min-w-0 flex-1">
                  <div 
                    className="w-4 h-4 rounded-full mr-3 flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="text-sm font-semibold text-gray-700 truncate">{item.label}</span>
                </div>
                <span className="text-lg font-bold text-gray-800 ml-4 flex-shrink-0">
                  {percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const BarChartComponent = ({ data, title, filterCount = 1, onSeeAll }) => (
  <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:scale-105 transition-all duration-300">
    <div className="flex items-center justify-between mb-6">
      <h3 className="font-semibold text-gray-800 truncate text-lg">{title}</h3>
      <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600 font-medium">= {filterCount} Filter</span>
        <button 
          onClick={onSeeAll}
          className="text-sm text-purple-600 hover:text-purple-700 flex items-center transition-colors duration-200 font-semibold"
        >
          See all <ArrowRight className="w-3 h-3 ml-1" />
        </button>
      </div>
    </div>
    
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <span className="text-sm font-semibold text-gray-700 w-20 truncate flex-shrink-0">{item.label}</span>
          <div className="flex-1 mx-4 min-w-0">
            <div className="bg-gray-200 rounded-full h-6 overflow-hidden shadow-inner">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500 shadow-lg"
                style={{ width: `${Math.min(item.value, 100)}%` }}
              ></div>
            </div>
          </div>
          <span className="text-sm font-bold text-gray-800 w-12 text-right flex-shrink-0">
            {item.value}%
          </span>
        </div>
      ))}
    </div>
  </div>
);

const TimelineBarChart = ({ projects, title, filterCount = 1, onSeeAll }) => {
  const timelineData = [
    { date: 'Jan 1', tasks: 12, projects: ['E-commerce Platform'] },
    { date: 'Jan 8', tasks: 8, projects: ['Mobile App'] },
    { date: 'Jan 15', tasks: 15, projects: ['Marketing Campaign'] },
    { date: 'Jan 22', tasks: 6, projects: ['Website Redesign'] },
    { date: 'Jan 29', tasks: 20, projects: ['API Development', 'Product Research'] },
    { date: 'Feb 5', tasks: 10, projects: ['Customer Portal'] },
    { date: 'Feb 12', tasks: 5, projects: ['Documentation'] },
  ];

  const maxTasks = Math.max(...timelineData.map(item => item.tasks));

  return (
    <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:scale-105 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-800 text-lg">{title}</h3>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600 font-medium">= {filterCount} Filter</span>
          <button 
            onClick={onSeeAll}
            className="text-sm text-purple-600 hover:text-purple-700 flex items-center transition-colors duration-200 font-semibold"
          >
            See all <ArrowRight className="w-3 h-3 ml-1" />
          </button>
        </div>
      </div>

      <div className="flex">
        <div className="flex flex-col justify-between h-64 mr-4 text-xs text-gray-600 font-medium">
          <span>{maxTasks}</span>
          <span>{Math.round(maxTasks * 0.75)}</span>
          <span>{Math.round(maxTasks * 0.5)}</span>
          <span>{Math.round(maxTasks * 0.25)}</span>
          <span>0</span>
        </div>

        <div className="flex-1">
          <div className="flex items-end justify-between h-64 border-b-2 border-l-2 border-gray-300 pb-4 pl-4">
            {timelineData.map((item, index) => (
              <div key={index} className="flex flex-col items-center flex-1 mx-1">
                <div
                  className="w-full bg-gradient-to-t from-purple-500 to-pink-400 rounded-t-lg hover:from-purple-600 hover:to-pink-500 transition-all duration-300 cursor-pointer relative group shadow-lg"
                  style={{ 
                    height: `${(item.tasks / maxTasks) * 100}%`,
                    minHeight: '8px'
                  }}
                >
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-800 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap border border-gray-600 shadow-xl">
                      <div className="font-bold">{item.tasks} tasks</div>
                      <div className="text-gray-300 mt-1">
                        {item.projects.join(', ')}
                      </div>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-600 mt-2 text-center font-medium">
                  {item.date}
                </div>
                
                <div className="text-xs font-bold text-gray-800 mt-1">
                  {item.tasks}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-3">
            <span className="text-sm text-gray-600 font-medium">Timeline (Weeks)</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {projects.slice(0, 4).map((project, index) => (
          <div key={project.id} className="flex items-center text-sm p-2 bg-gray-50 rounded-lg">
            <div 
              className="w-3 h-3 rounded mr-2 flex-shrink-0 shadow-sm"
              style={{ 
                backgroundColor: ['#A78BFA', '#C084FC', '#E879F9', '#F472B6'][index % 4]
              }}
            />
            <span className="text-gray-700 font-medium truncate">{project.name}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-300">
        <button className="text-purple-600 hover:text-purple-700 text-sm font-bold transition-colors duration-200">
          + Add widget
        </button>
        <div className="text-sm text-gray-600 font-medium">
          Total Tasks: <span className="font-bold text-gray-800">
            {timelineData.reduce((sum, item) => sum + item.tasks, 0)}
          </span>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Team Lead sees ALL projects
  const allProjects = [
    { id: 1, name: 'E-commerce Platform', progress: 75, status: 'in-progress', priority: 'high' },
    { id: 2, name: 'Mobile App', progress: 30, status: 'in-progress', priority: 'high' },
    { id: 3, name: 'Marketing Campaign', progress: 90, status: 'completed', priority: 'medium' },
    { id: 4, name: 'Website Redesign', progress: 45, status: 'in-progress', priority: 'medium' },
    { id: 5, name: 'API Development', progress: 100, status: 'completed', priority: 'low' },
    { id: 6, name: 'Product Research', progress: 20, status: 'planning', priority: 'low' },
    { id: 7, name: 'Customer Portal', progress: 60, status: 'in-progress', priority: 'high' },
    { id: 8, name: 'Documentation', progress: 85, status: 'review', priority: 'low' },
  ];

  // Team Member sees only their projects
  const teamMemberProjects = [
    { id: 1, name: 'E-commerce Platform', progress: 75, status: 'in-progress', priority: 'high' },
    { id: 3, name: 'Marketing Campaign', progress: 90, status: 'completed', priority: 'medium' },
    { id: 6, name: 'Product Research', progress: 20, status: 'planning', priority: 'low' },
  ];

  // Use different projects based on role
  const projects = user?.role === 'team_lead' ? allProjects : teamMemberProjects;

  const totalProjects = projects.length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const inProgressProjects = projects.filter(p => p.status === 'in-progress').length;
  const overdueProjects = projects.filter(p => p.progress < 100 && p.status !== 'completed').length;

  const projectsByStatus = [
    { label: 'Planning', value: projects.filter(p => p.status === 'planning').length },
    { label: 'In Progress', value: projects.filter(p => p.status === 'in-progress').length },
    { label: 'Review', value: projects.filter(p => p.status === 'review').length },
    { label: 'Completed', value: completedProjects },
  ];

  const projectsByCompletion = projects.slice(0, 5).map(project => ({
    label: project.name,
    value: project.progress
  }));

  const projectsByPriority = [
    { label: 'High', value: projects.filter(p => p.priority === 'high').length },
    { label: 'Medium', value: projects.filter(p => p.priority === 'medium').length },
    { label: 'Low', value: projects.filter(p => p.priority === 'low').length },
  ];

  const handleSeeAll = () => navigate('/workspaces');

  const stats = [
    { 
      title: 'Total complete', 
      value: completedProjects.toString(), 
      filter: true,
      onSeeAll: handleSeeAll
    },
    { 
      title: 'Total in progress', 
      value: inProgressProjects.toString(), 
      filter: true,
      onSeeAll: handleSeeAll
    },
    { 
      title: 'Total overdue projects', 
      value: overdueProjects.toString(), 
      filter: true,
      onSeeAll: handleSeeAll
    },
    { 
      title: 'Total projects', 
      value: totalProjects.toString(), 
      filter: false 
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EED5F0] via-white to-[#A067A3] p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Projects Dashboard</h1>
            <p className="text-gray-600 text-lg">Welcome back, {user?.name || 'User'}! Overview of all your projects</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            user?.role === 'team_lead' 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
              : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
          }`}>
            {user?.role === 'team_lead' ? <Crown className="w-5 h-5" /> : <Users className="w-5 h-5" />}
            <span className="font-semibold">
              {user?.role === 'team_lead' ? 'Team Lead' : 'Team Member'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChartComponent 
          title="Projects by status" 
          data={projectsByStatus}
          filterCount={1}
          onSeeAll={handleSeeAll}
        />

        <BarChartComponent 
          title="Projects by completion" 
          data={projectsByCompletion}
          filterCount={1}
          onSeeAll={handleSeeAll}
        />

        <PieChartComponent 
          title="Projects by priority" 
          data={projectsByPriority}
          filterCount={2}
          onSeeAll={handleSeeAll}
        />

        <TimelineBarChart 
          title="Project Timeline"
          projects={projects}
          filterCount={1}
          onSeeAll={handleSeeAll}
        />
      </div>
    </div>
  );
};

export default Dashboard;