import React, { useEffect, useState } from 'react';
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
// import { API_BASE_URL } from '../services/apiService';  // Uncomment when API is ready

// Rename the interface to BasicProject to avoid conflicting with the full Project type.
export interface BasicProject {
  id: string;
  name: string;
}

interface ProjectSelectionMenuProps {
  onSelectProject: (project: BasicProject) => void;
}

const ProjectSelectionMenu: React.FC<ProjectSelectionMenuProps> = ({ onSelectProject }) => {
  const [projects, setProjects] = useState<BasicProject[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Placeholder API call for fetching projects:
    // fetch(`${API_BASE_URL}/projects?user_id=YOUR_USER_ID`)
    //   .then((res) => res.json())
    //   .then((data) => setProjects(data.projects))
    //   .catch((err) => console.error("Failed to fetch projects", err));

    // Dummy data:
    setProjects([
      { id: 'project1', name: 'Project One' },
      { id: 'project2', name: 'Project Two' },
    ]);
  }, []);

  const handleSelect = (project: BasicProject) => {
    // Placeholder API call for selected project:
    // fetch(`${API_BASE_URL}/projects/${project.id}`)
    //   .then((res) => res.json())
    //   .then((data) => onSelectProject(data.project))
    //   .catch((err) => console.error("Failed to fetch project", err));

    onSelectProject(project);
    setIsOpen(false);
  };

  return (
    <>
      <Box sx={{ position: 'fixed', top: 10, left: 10, zIndex: 2000 }}>
        <IconButton onClick={() => setIsOpen(true)} color="inherit">
          <MenuIcon />
        </IconButton>
      </Box>
      <Drawer
        anchor="left"
        open={isOpen}
        onClose={() => setIsOpen(false)}
        PaperProps={{ sx: { width: '15%' } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Existing Projects
          </Typography>
          <List>
            {projects.map(project => (
              <ListItemButton key={project.id} onClick={() => handleSelect(project)}>
                <ListItemText primary={project.name} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default ProjectSelectionMenu;
