import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useTeams = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE = "http://localhost:5000/api/teams";

  const fetchTeams = useCallback(async () => {
    // Check for ID specifically to prevent infinite loops if user object changes
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem("planyty_token");
      const response = await fetch(`${API_BASE}/user/${user.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.status === 401) {
        throw new Error("Unauthorized: Please log in again.");
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch teams");
      }
      
      const data = await response.json();
      setTeams(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching teams:", error);
      setTeams([]);
    } finally {
      setLoading(false);
    }
    // Only re-run if user.id or API_BASE changes
  }, [user?.id]); 

  useEffect(() => { 
    fetchTeams(); 
  }, [fetchTeams]);

  const updateTeam = async (teamId, updatedData) => {
    try {
      const token = localStorage.getItem("planyty_token");
      const response = await fetch(`${API_BASE}/${teamId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });
      if (!response.ok) throw new Error("Update failed");
      await fetchTeams();
    } catch (error) {
      alert(error.message);
    }
  };
const deleteTeam = async (teamId) => {
  const token = localStorage.getItem("planyty_token");
  try {
    const response = await fetch(`${API_BASE}/${teamId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Delete failed on server");
    }

    // Only update the UI if the server actually deleted it
    setTeams(prev => prev.filter(t => t.id !== teamId));
    console.log("Team deleted from DB and UI");
  } catch (error) {
    console.error("Error deleting team:", error);
    alert("Could not delete team: " + error.message);
    // Refresh teams to bring back the one that failed to delete
    await fetchTeams(); 
  }
};
  const createTeam = async (teamData) => {
    const token = localStorage.getItem("planyty_token");
    const response = await fetch(`${API_BASE}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      // Ensure creatorId is passed from user context
      body: JSON.stringify({ ...teamData, creatorId: user?.id }),
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create team');
    }
    
    const result = await response.json();
    await fetchTeams();
    return result;
  };

  const inviteMember = async (teamId, inviteData) => {
    const token = localStorage.getItem("planyty_token");
    const response = await fetch(`${API_BASE}/${teamId}/members`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify(inviteData)
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to invite member");
    }
    await fetchTeams(); 
  };

  const removeMember = async (teamId, memberId) => {
    try {
      const token = localStorage.getItem("planyty_token");
      const response = await fetch(`${API_BASE}/${teamId}/members/${memberId}`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Remove member failed");
      await fetchTeams();
    } catch (error) {
      alert(error.message);
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