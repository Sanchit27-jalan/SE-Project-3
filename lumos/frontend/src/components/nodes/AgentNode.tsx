import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Popover,
  Chip,
  Badge,
  Divider,
  Paper,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import BuildIcon from '@mui/icons-material/Build';
// import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
import CallMadeIcon from '@mui/icons-material/CallMade';
import CallReceivedIcon from '@mui/icons-material/CallReceived';
// import InfoIcon from "@mui/icons-material/Info";
import { Agent, Tool } from '../../models/types';

interface AgentNodeProps {
  id: string;
  data: {
    agent: Agent;
    tools: Tool[];
    onDelete: (id: string) => void;
    onConnect: (sourceId: string, targetId: string) => void;
    onConfigChange: (agentId: string, config: any) => void;
  };
  selected: boolean;
}

const AgentNode: React.FC<AgentNodeProps> = ({ id, data, selected }) => {
  const { agent, tools, onDelete } = data;

  // State for tools popover
  const [toolsAnchorEl, setToolsAnchorEl] = useState<HTMLElement | null>(null);
  const showToolsPopover = Boolean(toolsAnchorEl);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(id);
  };

  const handleToolsClick = (event: React.MouseEvent<HTMLElement>) => {
    setToolsAnchorEl(event.currentTarget);
  };

  const handleToolsClose = () => {
    setToolsAnchorEl(null);
  };

  // Determine if this is a system node (input/output)
  const isSystemNode = id === 'user-input' || id === 'user-output';
  const isInputNode = id === 'user-input';
  const isOutputNode = id === 'user-output';

  return (
    <Box
      sx={{
        position: 'relative',
        padding: 2,
        minWidth: 250,
        maxWidth: 350,
        border: `2px solid ${
          isSystemNode ? '#9c27b0' : selected ? '#1976d2' : 'rgba(255, 255, 255, 0.3)'
        }`,
        borderRadius: 2,
        bgcolor: isSystemNode ? 'rgba(156, 39, 176, 0.15)' : 'rgba(25, 118, 210, 0.1)',
        textAlign: 'center',
        userSelect: 'none',
        color: 'white',
      }}
    >
      {/* Enhanced Input Handle with Visual Indicator */}
      {!isInputNode && (
        <Tooltip title="Input: Connect from another agent to this node" placement="left" arrow>
          <Box
            sx={{
              position: 'absolute',
              left: -8,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 16,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
            }}
          >
            <Handle
              type="target"
              position={Position.Left}
              style={{
                width: 12,
                height: 12,
                backgroundColor: '#4CAF50',
                border: '2px solid white',
                zIndex: 10,
              }}
            />
            <Paper
              elevation={0}
              sx={{
                position: 'absolute',
                left: 14,
                width: 14,
                height: 30,
                bgcolor: 'rgba(76, 175, 80, 0.2)',
                borderTopRightRadius: 4,
                borderBottomRightRadius: 4,
                display: selected ? 'block' : 'none',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 'calc(50% - 8px)',
                  left: 4,
                  width: 0,
                  height: 0,
                  borderTop: '8px solid transparent',
                  borderBottom: '8px solid transparent',
                  borderRight: '6px solid rgba(76, 175, 80, 0.4)',
                },
              }}
            />
            <CallReceivedIcon
              sx={{
                position: 'absolute',
                left: 10,
                top: -18,
                fontSize: '1rem',
                color: 'rgba(76, 175, 80, 0.6)',
                opacity: selected ? 1 : 0,
                transition: 'opacity 0.2s',
              }}
            />
          </Box>
        </Tooltip>
      )}

      {/* Enhanced Output Handle with Visual Indicator */}
      {!isOutputNode && (
        <Tooltip title="Output: Connect this agent to another node" placement="right" arrow>
          <Box
            sx={{
              position: 'absolute',
              right: -8,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 16,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            <Handle
              type="source"
              position={Position.Right}
              style={{
                width: 12,
                height: 12,
                backgroundColor: '#2196F3',
                border: '2px solid white',
                zIndex: 10,
              }}
            />
            <Paper
              elevation={0}
              sx={{
                position: 'absolute',
                right: 14,
                width: 14,
                height: 30,
                bgcolor: 'rgba(33, 150, 243, 0.2)',
                borderTopLeftRadius: 4,
                borderBottomLeftRadius: 4,
                display: selected ? 'block' : 'none',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 'calc(50% - 8px)',
                  right: 4,
                  width: 0,
                  height: 0,
                  borderTop: '8px solid transparent',
                  borderBottom: '8px solid transparent',
                  borderLeft: '6px solid rgba(33, 150, 243, 0.4)',
                },
              }}
            />
            <CallMadeIcon
              sx={{
                position: 'absolute',
                right: 10,
                top: -18,
                fontSize: '1rem',
                color: 'rgba(33, 150, 243, 0.6)',
                opacity: selected ? 1 : 0,
                transition: 'opacity 0.2s',
              }}
            />
          </Box>
        </Tooltip>
      )}

      {/* Delete button (only for non-system nodes) */}
      {!isSystemNode && (
        <IconButton
          onClick={handleDelete}
          size="small"
          sx={{
            position: 'absolute',
            top: 5,
            right: 5,
            color: 'white',
            '&:hover': {
              color: 'red',
              backgroundColor: 'rgba(255, 0, 0, 0.1)',
            },
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      )}

      {/* Node header */}
      <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
        <SmartToyIcon sx={{ mr: 1, color: isSystemNode ? '#9c27b0' : '#1976d2' }} />
        <Typography variant="subtitle1" fontWeight="bold">
          {agent.name}
        </Typography>
      </Box>

      {/* Agent ID */}
      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
        ID: {id}
      </Typography>

      {/* Agent description */}
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {agent.description}
      </Typography>

      <Divider sx={{ my: 1.5, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />

      {/* Agent attributes */}
      <Box mt={1} display="flex" flexDirection="column" gap={1}>
        {/* Agent type */}
        <Box display="flex" alignItems="center" justifyContent="center">
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
            Type:
          </Typography>
          <Chip
            label={agent.type}
            size="small"
            sx={{
              fontSize: '0.7rem',
              height: 24,
              bgcolor: 'rgba(25, 118, 210, 0.2)',
            }}
          />
          {agent.subtype && (
            <Chip
              label={agent.subtype}
              size="small"
              sx={{
                fontSize: '0.7rem',
                height: 24,
                bgcolor: 'rgba(25, 118, 210, 0.1)',
                ml: 0.5,
              }}
            />
          )}
        </Box>

        {/* Agent model info */}
        {agent.type === 'AI' && agent.model?.llmType && (
          <Box display="flex" alignItems="center" justifyContent="center">
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              Model:
            </Typography>
            <Chip
              label={agent.model.llmType}
              size="small"
              sx={{
                fontSize: '0.7rem',
                height: 24,
                bgcolor: 'rgba(121, 80, 242, 0.2)',
              }}
            />
          </Box>
        )}

        {/* Memory and learning */}
        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
          {agent.memory?.type && (
            <Tooltip title={`Memory type: ${agent.memory.type}`}>
              <Chip
                label={`Memory: ${agent.memory.type}`}
                size="small"
                sx={{
                  fontSize: '0.65rem',
                  height: 20,
                  bgcolor: 'rgba(255, 152, 0, 0.2)',
                }}
              />
            </Tooltip>
          )}
          {agent.learning?.type && (
            <Tooltip title={`Learning type: ${agent.learning.type}`}>
              <Chip
                label={`Learning: ${agent.learning.type}`}
                size="small"
                sx={{
                  fontSize: '0.65rem',
                  height: 20,
                  bgcolor: 'rgba(233, 30, 99, 0.2)',
                }}
              />
            </Tooltip>
          )}
        </Box>
      </Box>

      <Divider sx={{ my: 1.5, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />

      {/* Tools indicator button with badge */}
      <Box mt={1} mb={1} display="flex" justifyContent="center">
        <Badge
          badgeContent={tools.length}
          color="success"
          sx={{ '.MuiBadge-badge': { fontSize: '0.65rem' } }}
        >
          <Tooltip
            title={`${tools.length} tool${tools.length !== 1 ? 's' : ''} connected to this agent`}
          >
            <IconButton
              onClick={handleToolsClick}
              size="medium"
              sx={{
                color: tools.length > 0 ? '#4caf50' : 'rgba(255, 255, 255, 0.5)',
                border: `1px solid ${tools.length > 0 ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255, 255, 255, 0.2)'}`,
                '&:hover': {
                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                },
              }}
            >
              <BuildIcon />
            </IconButton>
          </Tooltip>
        </Badge>

        <Popover
          open={showToolsPopover}
          anchorEl={toolsAnchorEl}
          onClose={handleToolsClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          PaperProps={{
            sx: {
              p: 2,
              minWidth: 300,
              maxWidth: 400,
              bgcolor: '#1e1e1e',
            },
          }}
        >
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            Tools for {agent.name}
          </Typography>

          {tools.length > 0 ? (
            tools.map(tool => (
              <Box
                key={tool.id}
                sx={{
                  mt: 1,
                  mb: 2,
                  border: '1px solid rgba(76, 175, 80, 0.3)',
                  borderRadius: 1,
                  p: 1.5,
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center">
                    <BuildIcon sx={{ mr: 1, color: '#4caf50' }} />
                    <Typography variant="subtitle2">{tool.name}</Typography>
                  </Box>
                  <Chip
                    label={tool.type}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(76, 175, 80, 0.15)',
                      color: '#4caf50',
                      fontSize: '0.7rem',
                    }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  {tool.description}
                </Typography>
              </Box>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No tools connected to this agent
            </Typography>
          )}
        </Popover>
      </Box>

      {/* Agent capabilities */}
      {agent.capabilities && agent.capabilities.length > 0 && (
        <Box mt={1} display="flex" flexWrap="wrap" justifyContent="center" gap={0.5}>
          {agent.capabilities.slice(0, 3).map((capability, index) => (
            <Chip
              key={index}
              label={capability}
              size="small"
              sx={{
                fontSize: '0.65rem',
                height: 20,
                bgcolor: 'rgba(25, 118, 210, 0.2)',
              }}
            />
          ))}
          {agent.capabilities.length > 3 && (
            <Tooltip title={agent.capabilities.slice(3).join(', ')}>
              <Chip
                label={`+${agent.capabilities.length - 3}`}
                size="small"
                sx={{
                  fontSize: '0.65rem',
                  height: 20,
                  bgcolor: 'rgba(25, 118, 210, 0.1)',
                }}
              />
            </Tooltip>
          )}
        </Box>
      )}
    </Box>
  );
};

export default AgentNode;
