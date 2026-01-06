import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkspaceForm from '../../components/workspaces/WorkspaceForm';
import { ArrowLeft, Loader2 } from 'lucide-react';
import api from '../../services/api'; // Import your axios instance

const CreateWorkspace = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (workspaceData) => {
    try {
      setIsSubmitting(true);
      
      // ✅ Actual API Call
      const response = await api.post('/workspaces', {
        name: workspaceData.name,
        description: workspaceData.description,
        color: workspaceData.color || 'purple'
      });

      console.log('Workspace Created:', response.data);
      navigate('/workspaces'); // Navigate back on success
    } catch (err) {
      console.error('Creation failed:', err.response?.data);
      alert(err.response?.data?.error || 'Failed to create workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-[#F8F9FD] min-h-screen">
      <button
        onClick={() => navigate('/workspaces')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Workspaces
      </button>

      <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Workspace</h1>
        <p className="text-gray-600 mb-8">
          Organize your projects and collaborate with your team efficiently.
        </p>

        {isSubmitting ? (
          <div className="flex flex-col items-center py-10">
            <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-2" />
            <p className="text-gray-500">Creating your workspace...</p>
          </div>
        ) : (
          <WorkspaceForm
            isOpen={true}
            onClose={() => navigate('/workspaces')}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
};

export default CreateWorkspace;