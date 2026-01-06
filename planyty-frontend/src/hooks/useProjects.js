// src/hooks/useProjects.js
import { useState, useEffect } from 'react';
import { mockProjects } from '../data/mockProjects';

export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);

  useEffect(() => {
    // Load projects from localStorage or use mock data
    const savedProjects = localStorage.getItem('planyty_projects');
    if (savedProjects) {
      const parsedProjects = JSON.parse(savedProjects);
      setProjects(parsedProjects);
      setAvailableProjects(parsedProjects.filter(p => p.status !== 'completed'));
    } else {
      setProjects(mockProjects);
      setAvailableProjects(mockProjects.filter(p => p.status !== 'completed'));
      localStorage.setItem('planyty_projects', JSON.stringify(mockProjects));
    }
  }, []);

  const createProject = (projectData) => {
    const newProject = {
      id: Date.now(),
      ...projectData,
      status: 'not-started'
    };

    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    setAvailableProjects(updatedProjects.filter(p => p.status !== 'completed'));
    localStorage.setItem('planyty_projects', JSON.stringify(updatedProjects));
    
    return newProject;
  };

  const updateProject = (projectId, updates) => {
    const updatedProjects = projects.map(project => 
      project.id === projectId ? { ...project, ...updates } : project
    );
    
    setProjects(updatedProjects);
    setAvailableProjects(updatedProjects.filter(p => p.status !== 'completed'));
    localStorage.setItem('planyty_projects', JSON.stringify(updatedProjects));
  };

  const getProjectById = (id) => {
    return projects.find(project => project.id === id);
  };

  const getProjectsByIds = (ids) => {
    return projects.filter(project => ids.includes(project.id));
  };

  return {
    projects,
    availableProjects,
    createProject,
    updateProject,
    getProjectById,
    getProjectsByIds
  };
};