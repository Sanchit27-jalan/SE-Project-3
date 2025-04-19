import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Divider,
  Alert,
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { ApiService } from '../services/apiService';
import { CanvasObjectFactory } from '../models/CanvasObjectFactory';

interface PromptGenerationDialogProps {
  open: boolean;
  onClose: () => void;
  type: 'agent' | 'tool';
  onGenerated: (data: any) => void;
}

const PromptGenerationDialog: React.FC<PromptGenerationDialogProps> = ({
  open,
  onClose,
  type,
  onGenerated,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(e.target.value);
    if (error) setError(null);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt to generate content');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      let gen: any = null;
      if (type === 'agent') {
        const res = await ApiService.generateAgent(prompt);
        if (res.success && res.agent) {
          gen = CanvasObjectFactory.createAgentFromGeneration(res.agent);
        }
      } else {
        const res = await ApiService.generateTool(prompt);
        if (res.success && res.tool) {
          gen = CanvasObjectFactory.createToolFromGeneration(res.tool);
        }
      }

      if (gen) {
        onGenerated(gen);
        setPrompt('');
        onClose();
      } else {
        setError('Failed to generate content. Please try again.');
      }
    } catch (err) {
      console.error(`Error generating ${type}:`, err);
      setError(`An error occurred while generating the ${type}.`);
    } finally {
      setIsGenerating(false);
    }
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
          backgroundImage: 'linear-gradient(rgba(41, 41, 64, 0.7), rgba(20, 20, 30, 0.8))',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoFixHighIcon color="primary" />
        <Typography variant="h6">
          Generate {type === 'agent' ? 'AI Agent' : 'Tool'} Using Prompt
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3, mt: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {type === 'agent'
              ? 'Describe the agent you want to create. Include details about its purpose, capabilities, and any specific attributes.'
              : 'Describe the tool you want to create. Specify its function, input parameters, and how it should work.'}
          </Typography>
        </Box>

        <TextField
          autoFocus
          fullWidth
          label={`Enter your ${type} prompt`}
          multiline
          rows={6}
          variant="outlined"
          value={prompt}
          onChange={handlePromptChange}
          placeholder={
            type === 'agent'
              ? 'Example: Create an AI agent that can analyze news articles and summarize key points while identifying political bias.'
              : 'Example: Create a data visualization tool that can analyze CSV data and generate bar charts based on selected columns.'
          }
          InputProps={{
            sx: {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.2)',
              },
            },
          }}
        />

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            This will generate a {type === 'agent' ? 'new AI agent' : 'new tool'} based on your
            description.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined" disabled={isGenerating}>
          Cancel
        </Button>
        <Button
          onClick={handleGenerate}
          variant="contained"
          color="primary"
          disabled={isGenerating || !prompt.trim()}
          startIcon={
            isGenerating ? <CircularProgress size={20} thickness={4} /> : <AutoFixHighIcon />
          }
        >
          {isGenerating ? 'Generating...' : `Generate ${type === 'agent' ? 'Agent' : 'Tool'}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PromptGenerationDialog;
