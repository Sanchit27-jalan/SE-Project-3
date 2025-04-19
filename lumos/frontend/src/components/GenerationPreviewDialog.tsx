import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  Grid,
} from '@mui/material';
import PreviewIcon from '@mui/icons-material/Preview';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import { Agent, Tool } from '../models/types';
import { AgentBuilder } from '../models/AgentBuilder';
import { ToolBuilder } from '../models/ToolBuilder';

interface GenerationPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  type: 'agent' | 'tool';
  generatedData: any;
  onConfirm: (data: Agent | Tool) => void;
}

const GenerationPreviewDialog: React.FC<GenerationPreviewDialogProps> = ({
  open,
  onClose,
  type,
  generatedData,
  onConfirm,
}) => {
  const [editedData, setEditedData] = useState<any>(null);
  const [newCapability, setNewCapability] = useState('');

  // Initialize edited data when the generated data changes
  useEffect(() => {
    if (generatedData) {
      if (type === 'agent') {
        setEditedData({
          name: generatedData.name || '',
          description: generatedData.description || '',
          type: generatedData.type || 'AI',
          subtype: generatedData.subtype || '',
          capabilities: generatedData.capabilities || [],
          model: { llmType: generatedData.type === 'AI' ? 'gpt-4' : '' },
        });
      } else {
        setEditedData({
          name: generatedData.name || '',
          description: generatedData.description || '',
          type: generatedData.type || 'Information',
          subtype: generatedData.subtype || '',
          parameters: generatedData.parameters || {},
        });
      }
    }
  }, [generatedData, type]);

  if (!editedData) {
    return null;
  }

  const handleInputChange = (field: string, value: any) => {
    setEditedData({
      ...editedData,
      [field]: value,
    });
  };

  const handleNestedInputChange = (parent: string, field: string, value: any) => {
    setEditedData({
      ...editedData,
      [parent]: {
        ...editedData[parent],
        [field]: value,
      },
    });
  };

  const handleAddCapability = () => {
    if (newCapability.trim() && !editedData.capabilities.includes(newCapability.trim())) {
      setEditedData({
        ...editedData,
        capabilities: [...editedData.capabilities, newCapability.trim()],
      });
      setNewCapability('');
    }
  };

  const handleRemoveCapability = (index: number) => {
    const updatedCapabilities = [...editedData.capabilities];
    updatedCapabilities.splice(index, 1);
    setEditedData({
      ...editedData,
      capabilities: updatedCapabilities,
    });
  };

  const handleConfirm = () => {
    if (type === 'agent') {
      const agent = AgentBuilder.create(editedData.type)
        .withId(`agent-${Date.now()}`)
        .withName(editedData.name)
        .withDescription(editedData.description)
        .withSubtype(editedData.subtype)
        .withModel(editedData.model)
        .withCapabilities(editedData.capabilities)
        .withMemory({ type: 'short-term' })
        .withLearning({ type: 'none' })
        .build();
      onConfirm(agent);
    } else {
      const tool = ToolBuilder.create(editedData.description, editedData.type)
        .withId(`tool-${Date.now()}`)
        .withName(editedData.name)
        .withSubtype(editedData.subtype)
        .withParameters(editedData.parameters)
        .build();
      onConfirm(tool);
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          backgroundColor: '#1a1a2e',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PreviewIcon color="primary" />
        <Typography variant="h6">Review Generated {type === 'agent' ? 'Agent' : 'Tool'}</Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2, mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Review and edit the {type === 'agent' ? 'agent' : 'tool'} details before adding it to
            your project.
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {/* Name Field */}
          <Grid item xs={12}>
            <TextField
              label="Name"
              fullWidth
              value={editedData.name}
              onChange={e => handleInputChange('name', e.target.value)}
              variant="outlined"
              required
            />
          </Grid>

          {/* Description Field */}
          <Grid item xs={12}>
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={editedData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              variant="outlined"
              required
            />
          </Grid>

          {/* Type Field */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>{type === 'agent' ? 'Agent Type' : 'Tool Type'}</InputLabel>
              <Select
                value={editedData.type}
                label={type === 'agent' ? 'Agent Type' : 'Tool Type'}
                onChange={e => handleInputChange('type', e.target.value)}
              >
                {type === 'agent' ? (
                  <>
                    <MenuItem value="AI">AI</MenuItem>
                    <MenuItem value="Deterministic">Deterministic</MenuItem>
                    <MenuItem value="Hybrid">Hybrid</MenuItem>
                  </>
                ) : (
                  <>
                    <MenuItem value="Information">Information</MenuItem>
                    <MenuItem value="Computational">Computational</MenuItem>
                    <MenuItem value="Interaction">Interaction</MenuItem>
                    <MenuItem value="Development">Development</MenuItem>
                  </>
                )}
              </Select>
            </FormControl>
          </Grid>

          {/* Subtype Field */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Subtype/Role"
              fullWidth
              value={editedData.subtype}
              onChange={e => handleInputChange('subtype', e.target.value)}
              variant="outlined"
            />
          </Grid>

          {/* Agent-specific fields */}
          {type === 'agent' && (
            <>
              {/* LLM Type - Only for AI agents */}
              {editedData.type === 'AI' && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>LLM Type</InputLabel>
                    <Select
                      value={editedData.model?.llmType || 'gpt-4'}
                      label="LLM Type"
                      onChange={e => handleNestedInputChange('model', 'llmType', e.target.value)}
                    >
                      <MenuItem value="gpt-4">GPT-4</MenuItem>
                      <MenuItem value="gemini">Gemini</MenuItem>
                      <MenuItem value="claude">Claude</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* Capabilities */}
              <Grid item xs={12}>
                <Divider textAlign="left" sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Capabilities
                  </Typography>
                </Divider>

                <Box sx={{ display: 'flex', mb: 2 }}>
                  <TextField
                    label="Add Capability"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={newCapability}
                    onChange={e => setNewCapability(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleAddCapability()}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleAddCapability}
                    disabled={!newCapability.trim()}
                    sx={{ ml: 1 }}
                    startIcon={<AddIcon />}
                  >
                    Add
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {editedData.capabilities?.map((capability: string, index: number) => (
                    <Chip
                      key={index}
                      label={capability}
                      onDelete={() => handleRemoveCapability(index)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                  {editedData.capabilities?.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No capabilities added yet
                    </Typography>
                  )}
                </Box>
              </Grid>
            </>
          )}

          {/* Tool-specific fields - Parameters preview */}
          {type === 'tool' && (
            <Grid item xs={12}>
              <Divider textAlign="left" sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Parameters
                </Typography>
              </Divider>

              <Box
                sx={{
                  p: 2,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: 1,
                  overflowX: 'auto',
                }}
              >
                <pre style={{ margin: 0 }}>
                  {JSON.stringify(editedData.parameters || {}, null, 2)}
                </pre>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Parameters will be configurable when the tool is used.
              </Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          startIcon={<CheckCircleIcon />}
          disabled={!editedData.name || !editedData.description}
        >
          Add to Project
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GenerationPreviewDialog;
