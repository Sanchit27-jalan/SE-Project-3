import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  TextField,
  Button,
  Chip,
  Divider,
  Tooltip,
  Collapse,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { Project } from "../models/types";

interface ProjectInfoPanelProps {
  project: Project;
  onUpdate: (updatedProject: Project) => void;
}

const ProjectInfoPanel: React.FC<ProjectInfoPanelProps> = ({
  project,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editedProject, setEditedProject] = useState<Project>({ ...project });
  const [newAuthor, setNewAuthor] = useState("");

  // Handle changes to the project fields
  const handleChange = (field: keyof Project, value: any) => {
    setEditedProject((prev) => ({ ...prev, [field]: value }));
  };

  // Handle adding a new author
  const handleAddAuthor = () => {
    if (newAuthor.trim()) {
      setEditedProject((prev) => ({
        ...prev,
        authors: [...(prev.authors || []), newAuthor.trim()],
      }));
      setNewAuthor("");
    }
  };

  // Handle removing an author
  const handleRemoveAuthor = (index: number) => {
    const updatedAuthors = [...editedProject.authors];
    updatedAuthors.splice(index, 1);
    setEditedProject((prev) => ({
      ...prev,
      authors: updatedAuthors,
    }));
  };

  // Handle save button click
  const handleSave = () => {
    onUpdate(editedProject);
    setIsEditing(false);
  };

  // Handle cancel button click
  const handleCancel = () => {
    setEditedProject({ ...project });
    setIsEditing(false);
  };

  // Toggle expand/collapse
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    // If going from editing to collapsed, exit edit mode
    if (isEditing && !isExpanded) {
      setIsEditing(false);
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        backgroundColor: "background.paper",
        color: "text.primary",
        borderRadius: "0 0 8px 8px",
        overflow: "hidden",
        transition: "all 0.3s ease",
      }}
    >
      {/* Collapsed Header - Always Visible */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 2,
          py: 1,
          cursor: "pointer",
          "&:hover": {
            backgroundColor: "action.hover",
          },
        }}
        onClick={toggleExpand}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            {project.name || "Untitled Project"}
          </Typography>
          {project.version && (
            <Typography variant="body2" sx={{ color: "text.secondary", ml: 1 }}>
              v{project.version}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center" }}>
          {!isEditing ? (
            <Tooltip title="Edit project info">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                  setIsExpanded(true);
                }}
                size="small"
                color="primary"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null}
          <IconButton size="small" onClick={toggleExpand}>
            {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Expandable Content */}
      <Collapse in={isExpanded}>
        <Divider />
        <Box sx={{ p: 2 }}>
          {isEditing ? (
            // Edit mode
            <Box>
              <TextField
                label="Project Name"
                variant="outlined"
                fullWidth
                size="small"
                value={editedProject.name}
                onChange={(e) => handleChange("name", e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                label="Version"
                variant="outlined"
                fullWidth
                size="small"
                value={editedProject.version}
                onChange={(e) => handleChange("version", e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                label="Description"
                variant="outlined"
                fullWidth
                multiline
                rows={2}
                value={editedProject.description}
                onChange={(e) => handleChange("description", e.target.value)}
                sx={{ mb: 2 }}
              />

              <Typography variant="subtitle2" gutterBottom>
                Authors:
              </Typography>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                {editedProject.authors?.map((author, index) => (
                  <Chip
                    key={index}
                    label={author}
                    onDelete={() => handleRemoveAuthor(index)}
                    size="small"
                  />
                ))}
              </Box>

              <Box sx={{ display: "flex", alignItems: "center" }}>
                <TextField
                  label="Add Author"
                  variant="outlined"
                  size="small"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  sx={{ flex: 1 }}
                />
                <Button
                  startIcon={<PersonAddIcon />}
                  onClick={handleAddAuthor}
                  sx={{ ml: 1 }}
                  disabled={!newAuthor.trim()}
                  size="small"
                >
                  Add
                </Button>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Button onClick={handleCancel} size="small" sx={{ mr: 1 }}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={!editedProject.name}
                  size="small"
                >
                  Save
                </Button>
              </Box>
            </Box>
          ) : (
            // View mode
            <Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                <Box sx={{ flexGrow: 1, minWidth: "200px" }}>
                  {project.description && (
                    <Typography
                      variant="body2"
                      color="text.primary"
                      sx={{ mb: 2 }}
                    >
                      {project.description}
                    </Typography>
                  )}
                </Box>

                {project.authors && project.authors.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Authors
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {project.authors.map((author, index) => (
                        <Chip
                          key={index}
                          label={author}
                          variant="outlined"
                          size="small"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default ProjectInfoPanel;
