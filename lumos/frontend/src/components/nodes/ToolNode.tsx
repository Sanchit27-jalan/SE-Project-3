import React from "react";
import { Box, Typography, IconButton, Chip } from "@mui/material";
import BuildIcon from "@mui/icons-material/Build";
import DeleteIcon from "@mui/icons-material/Delete";
import { Tool } from "../../models/types";

interface ToolNodeProps {
  id: string;
  data: {
    tool: Tool;
    onDelete: (id: string) => void;
  };
  selected: boolean;
}

const ToolNode: React.FC<ToolNodeProps> = ({ id, data, selected }) => {
  const { tool, onDelete } = data;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(id);
  };

  return (
    <Box
      sx={{
        position: "relative",
        padding: 1.5,
        minWidth: 180,
        maxWidth: 250,
        border: `2px solid ${selected ? "#4caf50" : "rgba(76, 175, 80, 0.5)"}`,
        borderRadius: 2,
        bgcolor: "rgba(76, 175, 80, 0.1)",
        textAlign: "center",
        userSelect: "none",
        color: "white",
      }}
    >
      {/* Delete button */}
      <IconButton
        onClick={handleDelete}
        size="small"
        sx={{
          position: "absolute",
          top: 2,
          right: 2,
          color: "white",
          "&:hover": {
            color: "red",
            backgroundColor: "rgba(255, 0, 0, 0.1)",
          },
        }}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>

      {/* Tool header */}
      <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
        <BuildIcon sx={{ mr: 1, color: "#4caf50" }} />
        <Typography variant="subtitle2" fontWeight="bold">
          {tool.name}
        </Typography>
      </Box>

      {/* Tool description */}
      <Typography
        variant="body2"
        color="text.secondary"
        gutterBottom
        fontSize="0.75rem"
      >
        {tool.description}
      </Typography>

      {/* Tool type */}
      <Chip
        label={tool.type}
        size="small"
        sx={{
          mt: 1,
          bgcolor: "rgba(76, 175, 80, 0.2)",
          fontSize: "0.7rem",
          height: 22,
        }}
      />

      {/* Agent association if present */}
      {tool.agentId && (
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mt={1}
        >
          Linked to: {tool.agentId}
        </Typography>
      )}
    </Box>
  );
};

export default ToolNode;
