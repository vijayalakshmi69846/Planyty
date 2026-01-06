import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api'; // CRITICAL: Import your axios instance

export const useTeams = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTeams = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      // api instance automatically adds Authorization header and handles 401s
      const response = await api.get(`/teams/user/${user.id}`);
      setTeams(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      // If error is 401, interceptor handles it. We only log other errors.
      if (error.response?.status !== 401) {
        console.error("Error fetching teams:", error);
      }
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]); 

  useEffect(() => { 
    fetchTeams(); 
  }, [fetchTeams]);

  const updateTeam = async (teamId, updatedData) => {
    try {
      await api.put(`/teams/${teamId}`, updatedData);
      await fetchTeams();
    } catch (error) {
      alert("Update failed: " + (error.response?.data?.error || error.message));
    }
  };

  const deleteTeam = async (teamId) => {
    try {
      await api.delete(`/teams/${teamId}`);
      setTeams(prev => prev.filter(t => t.id !== teamId));
    } catch (error) {
      console.error("Error deleting team:", error);
      alert("Could not delete team.");
      await fetchTeams(); 
    }
  };

  const createTeam = async (teamData) => {
    try {
      const response = await api.post(`/teams`, { 
        ...teamData, 
        creatorId: user?.id 
      });
      await fetchTeams();
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create team');
    }
  };

  const inviteMember = async (teamId, inviteData) => {
    try {
      await api.post(`/teams/${teamId}/members`, inviteData);
      await fetchTeams();
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to invite member");
    }
  };

  const removeMember = async (teamId, memberId) => {
    try {
      await api.delete(`/teams/${teamId}/members/${memberId}`);
      await fetchTeams();
    } catch (error) {
      alert(error.response?.data?.error || "Remove member failed");
    }
  };

  return { 
    teams, 
    loading, 
    createTeam, 
    updateTeam, 
    deleteTeam, 
    inviteMember, 
    removeMember, 
    refreshTeams: fetchTeams 
  };
};