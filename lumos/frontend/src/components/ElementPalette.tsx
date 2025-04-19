import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Tabs,
  Tab,
  Tooltip,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder"; // For projects
import SmartToyIcon from "@mui/icons-material/SmartToy"; // For agents
import BuildIcon from "@mui/icons-material/Build"; // For tools
import AddIcon from "@mui/icons-material/Add";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import { Agent, Tool } from "../models/types";
import { AgentBuilder } from "../models/AgentBuilder";
import { ToolBuilder } from "../models/ToolBuilder";
import { CanvasObjectFactory } from "../models/CanvasObjectFactory";
import ImportPreviewModal from "./ImportPreviewModal";
import PromptGenerationDialog from "./PromptGenerationDialog";
import GenerationPreviewDialog from "./GenerationPreviewDialog";
import { deserializeLdl, ApiService } from "../services/apiService";

interface ElementPaletteProps {
  // Existing props
  agents: any[];
  tools: any[];
  canvasAgents: any[];
  availableProjects: { id: string; name: string }[];
  onSelectProject: (project: { id: string; name: string }) => void;
  onAddAgent: (agent: any) => void;
  onAddTool: (tool: any) => void;
  onAddAgentToCanvas: (agent: any) => void;
  onAddToolToCanvas: (tool: any) => void;
  onEditAgent: (agentId: string, updatedAgent: any) => void;
  onDeleteAgent: (agentId: string) => void;
  onEditTool: (toolId: string, updatedTool: any) => void;
  onDeleteTool: (toolId: string) => void;
  onImportProject: (ldlData: any) => Promise<boolean>;
  sx?: any;
}

const ElementPalette: React.FC<ElementPaletteProps> = ({
  agents,
  tools,
  canvasAgents,
  availableProjects,
  onSelectProject,
  onAddAgent,
  onAddTool,
  onAddAgentToCanvas,
  onAddToolToCanvas,
  onEditAgent,
  onDeleteAgent,
  onEditTool,
  onDeleteTool,
  onImportProject,
  sx = {},
}) => {
  // Add state for active tab - default to projects (leftmost)
  const [activeTab, setActiveTab] = useState<'projects' | 'agents' | 'tools'>('projects');

  // Add state for new project dialog
  const [isNewProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  // Add any other existing state variables and handlers
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);
  const [isToolDialogOpen, setIsToolDialogOpen] = useState(false);
  const [showToolAssignDialog, setShowToolAssignDialog] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importLdlData, setImportLdlData] = useState<any>(null);

  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [editingToolId, setEditingToolId] = useState<string | null>(null);

  // New state for AI generation dialogs
  const [showAgentGenerationDialog, setShowAgentGenerationDialog] = useState(false);
  const [showToolGenerationDialog, setShowToolGenerationDialog] = useState(false);
  const [generatedAgentData, setGeneratedAgentData] = useState<any>(null);
  const [generatedToolData, setGeneratedToolData] = useState<any>(null);
  const [showAgentPreviewDialog, setShowAgentPreviewDialog] = useState(false);
  const [showToolPreviewDialog, setShowToolPreviewDialog] = useState(false);

  // Form state for new agent
  const [newAgent, setNewAgent] = useState<Partial<Agent>>({
    name: '',
    description: '',
    type: 'AI',
    subtype: 'assistant',
    model: { llmType: 'gpt-4' },
    capabilities: [],
  });

  // Form state for new tool
  const [newTool, setNewTool] = useState<Partial<Tool>>({
    name: '',
    description: '',
    type: 'Information',
    agentId: '',
  });

  const [capabilityInput, setCapabilityInput] = useState("");

  // Add this near the top of the component
  const [savedProjects, setSavedProjects] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // Add useEffect to fetch projects when the component mounts
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const projects = await ApiService.getAllProjects();
        setSavedProjects(projects);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  // Handle agent form changes
  const handleAgentChange = (field: keyof Agent, value: any) => {
    setNewAgent(prev => ({ ...prev, [field]: value }));
  };

  // Handle tool form changes
  const handleToolChange = (field: keyof Tool, value: any) => {
    setNewTool(prev => ({ ...prev, [field]: value }));
  };

  // Add a capability to the new agent
  const handleAddCapability = () => {
    if (capabilityInput.trim()) {
      setNewAgent(prev => ({
        ...prev,
        capabilities: [...(prev.capabilities || []), capabilityInput.trim()],
      }));
      setCapabilityInput('');
    }
  };

  // Handle edit agent button click
  const handleEditAgent = (agent: Agent, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent adding to canvas when editing
    // Initialize the form with the agent's data
    setNewAgent({
      name: agent.name,
      description: agent.description,
      type: agent.type,
      subtype: agent.subtype,
      model: { ...agent.model },
      capabilities: [...agent.capabilities],
    });
    setEditingAgentId(agent.id);
    setIsAgentDialogOpen(true);
  };

  // Handle delete agent button click
  const handleDeleteAgent = (agentId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent adding to canvas when deleting
    if (onDeleteAgent) {
      onDeleteAgent(agentId);
    }
  };

  // Handle edit tool button click
  const handleEditTool = (tool: Tool, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent adding to canvas when editing
    // Initialize the form with the tool's data
    setNewTool({
      name: tool.name,
      description: tool.description,
      type: tool.type,
      subtype: tool.subtype,
      agentId: tool.agentId,
      parameters: { ...tool.parameters },
    });
    setEditingToolId(tool.id);
    setIsToolDialogOpen(true);
  };

  // Handle delete tool button click
  const handleDeleteTool = (toolId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent adding to canvas when deleting
    if (onDeleteTool) {
      onDeleteTool(toolId);
    }
  };

  // Update create agent handler to handle edits as well
  const handleCreateOrUpdateAgent = () => {
    if (newAgent.name && newAgent.description) {
      if (editingAgentId) {
        // Update existing agent
        if (onEditAgent) {
          const updatedAgent = AgentBuilder.create(newAgent.type || 'AI')
            .withId(editingAgentId)
            .withName(newAgent.name)
            .withDescription(newAgent.description)
            .withSubtype(newAgent.subtype || '')
            .withModel(newAgent.model || {})
            .withCapabilities(newAgent.capabilities || [])
            .withMemory({ type: 'short-term' })
            .withLearning({ type: 'none' })
            .build();
          onEditAgent(editingAgentId, updatedAgent);
          setEditingAgentId(null);
        }
      } else {
        // Create new agent
        const agent = AgentBuilder.create(newAgent.type || 'AI')
          .withId(`agent-${Date.now()}`)
          .withName(newAgent.name)
          .withDescription(newAgent.description)
          .withSubtype(newAgent.subtype || '')
          .withModel(newAgent.model || {})
          .withCapabilities(newAgent.capabilities || [])
          .withMemory({ type: 'short-term' })
          .withLearning({ type: 'none' })
          .build();
        onAddAgent(agent);
      }
      setNewAgent({
        name: '',
        description: '',
        type: 'AI',
        subtype: 'assistant',
        model: { llmType: 'gpt-4' },
        capabilities: [],
      });
      setIsAgentDialogOpen(false);
    }
  };

  // Update create tool handler to handle edits as well
  const handleCreateOrUpdateTool = () => {
    if (newTool.name && newTool.description) {
      if (editingToolId) {
        // Update existing tool
        if (onEditTool) {
          const updatedTool = ToolBuilder.create(
            newTool.description || '',
            newTool.type || 'Information'
          )
            .withId(editingToolId)
            .withName(newTool.name)
            .withAgentId(newTool.agentId || '')
            .withSubtype(newTool.subtype || '')
            .withAccessibleBy([])
            .withAuthentication({})
            .withParameters(newTool.parameters || {})
            .build();
          onEditTool(editingToolId, updatedTool);
          setEditingToolId(null);
        }
      } else {
        // Create new tool
        const tool = ToolBuilder.create(newTool.description || '', newTool.type || 'Information')
          .withId(`tool-${Date.now()}`)
          .withName(newTool.name)
          .withAgentId(newTool.agentId || '')
          .withSubtype(newTool.subtype || '')
          .withAccessibleBy([])
          .withAuthentication({})
          .withParameters({})
          .build();
        onAddTool(tool);
      }
      setNewTool({
        name: '',
        description: '',
        type: 'Information',
        agentId: '',
      });
      setIsToolDialogOpen(false);
    }
  };

  // Handle adding a tool to the canvas
  const handleAddToolToCanvas = (tool: Tool) => {
    setSelectedTool(tool);
    setShowToolAssignDialog(true);
  };

  // Handle assigning a tool to an agent
  const handleAssignToolToAgent = (agentId: string) => {
    if (selectedTool) {
      const toolWithAgent = CanvasObjectFactory.createToolWithAgent(selectedTool, agentId);
      onAddToolToCanvas(toolWithAgent as Tool);
      setSelectedTool(null);
      setShowToolAssignDialog(false);
    }
  };

  // Handle file upload button click
  const handleImportButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file selection
  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const content = e.target?.result as string;
        const ext = file.name.split('.')?.pop()?.toLowerCase();
        const format = ext === 'yaml' || ext === 'yml' ? 'yaml' : 'json';
        const ldlData = deserializeLdl(content, format);

        // Validate basic structure
        if (!ldlData.project || !ldlData.agents) {
          throw new Error('Invalid LDL format: Missing required fields');
        }

        // Store the LDL data and show preview
        setImportLdlData(ldlData);
        setShowImportPreview(true);

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Error parsing LDL file:', error);
      }
    };

    reader.onerror = () => {
      console.error('Error reading file');
    };

    reader.readAsText(file);
  };

  // Handle import confirmation from preview
  const handleImportConfirm = async () => {
    if (importLdlData) {
      try {
        const result = await onImportProject(importLdlData);

        if (result) {
          setShowImportPreview(false);
          setImportLdlData(null);
        } else {
          console.error('Failed to import project. See console for details.');
        }
      } catch (error) {
        console.error('Error during import:', error);
      }
    }
  };

  // Handle generated agent data from prompt
  const handleGeneratedAgent = (agentData: any) => {
    setGeneratedAgentData(agentData);
    setShowAgentPreviewDialog(true);
  };

  // Handle generated tool data from prompt
  const handleGeneratedTool = (toolData: any) => {
    setGeneratedToolData(toolData);
    setShowToolPreviewDialog(true);
  };

  // Handle adding the AI-generated agent to the palette
  const handleAddGeneratedAgent = (agent: Agent) => {
    onAddAgent(agent);
    setGeneratedAgentData(null);
  };

  // Handle adding the AI-generated tool to the palette
  const handleAddGeneratedTool = (tool: Tool) => {
    onAddTool(tool);
    setGeneratedToolData(null);
  };

  // Handler for new project creation
  const handleCreateProject = () => {
    // This would typically make an API call to create the project
    console.log(`Creating new project: ${newProjectName}`);

    // For now, just close the dialog
    setNewProjectDialogOpen(false);
    setNewProjectName('');
    setNewProjectDescription('');

    // In a real implementation, you would create the project and then select it
  };

  return (
    <Box
      sx={{
        width: { xs: '100%', sm: 280 },
        height: '100vh',
        padding: 0,
        margin: 0,
        bgcolor: '#121212',
        resize: 'horizontal', // Allow user to drag and resize width
        overflow: 'hidden', // Hide native scrollbars
        minWidth: 200,
        maxWidth: 600,
        ...sx,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <img
          src="/LUMOS_logo.png"
          alt="LUMOS Logo"
          style={{ height: '40vh', marginBottom: '-10vh', marginTop: '-10vh' }}
        />
      </Box>

      {/* Tab selection - Projects as leftmost tab */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_, newTab) => setActiveTab(newTab)} variant="fullWidth">
          <Tab icon={<FolderIcon />} label="Projects" value="projects" />
          <Tab icon={<SmartToyIcon />} label="Agents" value="agents" />
          <Tab icon={<BuildIcon />} label="Tools" value="tools" />
        </Tabs>
      </Box>

      {/* Tab content */}
      <Box sx={{ p: 2, pb: 1.5 }}>
        {activeTab === "projects" && (
          <>
            <Stack direction="row" spacing={1} width="100%" sx={{ mb: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                sx={{ flex: 1 }}
                onClick={() => window.location.reload()}
              >
                New Project
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<FileUploadIcon />}
                onClick={handleImportButtonClick}
              >
                Import
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.yaml,.yml"
                style={{ display: "none" }}
                onChange={handleFileSelected}
              />
            </Stack>

            {isLoadingProjects ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Box
                sx={{
                  maxHeight: "60vh", // restrict height of just the project list
                  overflowY: "auto", // enable vertical scrollbar
                  pr: 1, // optional padding for scrollbar
                }}
              >
                <List>
                  {savedProjects.map((project) => (
                    <ListItem
                      key={project.id}
                      sx={{
                        borderRadius: 1,
                        mb: 1,
                        mx: 1,
                        cursor: "pointer",
                        transition: "background-color 0.3s",
                        "&:hover": {
                          bgcolor: "rgba(25, 118, 210, 0.1)",
                        },
                      }}
                      onClick={() =>
                        onSelectProject({ ...project, id: Number(project.id) })
                      }
                    >
                      <ListItemIcon>
                        <FolderIcon sx={{ color: "#ffa726" }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={project.name}
                        secondary={
                          <>
                            <Typography
                              variant="caption"
                              component="span"
                              sx={{ display: "block" }}
                            >
                              Version: {project.version}
                            </Typography>
                            <Typography
                              variant="caption"
                              component="span"
                              sx={{ display: "block" }}
                            >
                              Created:{" "}
                              {new Date(project.created_at).toLocaleString()}
                            </Typography>
                          </>
                        }
                        primaryTypographyProps={{
                          variant: "body2",
                          fontWeight: "medium",
                        }}
                      />
                    </ListItem>
                  ))}
                  {savedProjects.length === 0 && (
                    <Typography
                      variant="body2"
                      sx={{ p: 2, textAlign: "center", color: "text.secondary" }}
                    >
                      No saved projects found. Create one to get started.
                    </Typography>
                  )}
                </List>
              </Box>
            )}
          </>
        )}

        {activeTab === "agents" && (
          <Stack direction="row" spacing={1} width="100%">
            <Button
              variant="contained"
              color="primary"
              sx={{ flex: 1 }}
              onClick={() => setIsAgentDialogOpen(true)}
            >
              Create Agent
            </Button>
            <Tooltip title="Generate agent using AI">
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setShowAgentGenerationDialog(true)}
                startIcon={<AutoFixHighIcon />}
              >
                Generate
              </Button>
            </Tooltip>
          </Stack>
        )}

        {activeTab === "tools" && (
          <Stack direction="row" spacing={1} width="100%">
            <Button
              variant="contained"
              color="success"
              sx={{ flex: 1 }}
              onClick={() => setIsToolDialogOpen(true)}
            >
              Create Tool
            </Button>
            <Tooltip title="Generate tool using AI">
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setShowToolGenerationDialog(true)}
                startIcon={<AutoFixHighIcon />}
              >
                Generate
              </Button>
            </Tooltip>
          </Stack>
        )}
      </Box>

      {/* List content based on active tab */}
      <Box
        sx={{
          overflowY: "auto",
          overflowX: "hidden",
          height: "calc(100% - 150px)",
          overscrollBehavior: "none",
          "&::-webkit-scrollbar": {
            width: 0,
            height: 0,
          },
          scrollbarWidth: "none",
          "-ms-overflow-style": "none",
        }}
      >
        {activeTab === "projects" && (
          <List>
            {/* Projects list content already in your code */}
          </List>
        )}

        {activeTab === "agents" && (
          <List>
            {agents.map(agent => (
              <ListItem
                key={agent.id}
                component="div"
                onClick={() => onAddAgentToCanvas(agent)}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  mx: 1,
                  cursor: 'pointer',
                  transition: 'background-color 0.3s',
                  '&:hover': {
                    bgcolor: 'rgba(25, 118, 210, 0.1)',
                  },
                }}
              >
                <ListItemIcon>
                  <SmartToyIcon sx={{ color: '#1976d2' }} />
                </ListItemIcon>
                <ListItemText
                  primary={agent.name || "Unnamed Agent"}
                  secondary={`ID: ${String(agent.id)}`}
                  secondaryTypographyProps={{ variant: "caption" }}
                />
                <Button size="small" onClick={e => handleEditAgent(agent, e)} sx={{ ml: 1 }}>
                  Edit
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={e => handleDeleteAgent(agent.id, e)}
                  sx={{ ml: 1 }}
                >
                  Delete
                </Button>
              </ListItem>
            ))}
            {agents.length === 0 && (
              <Typography
                variant="body2"
                sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}
              >
                No agents available. Create one to get started.
              </Typography>
            )}
          </List>
        )}

        {activeTab === "tools" && (
          <List>
            {tools.map(tool => (
              <ListItem
                key={tool.id}
                component="div"
                onClick={() => handleAddToolToCanvas(tool)}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  mx: 1,
                  cursor: 'pointer',
                  transition: 'background-color 0.3s',
                  '&:hover': {
                    bgcolor: 'rgba(76, 175, 80, 0.1)',
                  },
                }}
              >
                <ListItemIcon>
                  <BuildIcon sx={{ color: '#4caf50' }} />
                </ListItemIcon>
                <ListItemText
                  primary={tool.name}
                  secondary={tool.description}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: 'medium',
                  }}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    noWrap: true,
                  }}
                />
                <Button size="small" onClick={e => handleEditTool(tool, e)} sx={{ ml: 1 }}>
                  Edit
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={e => handleDeleteTool(tool.id, e)}
                  sx={{ ml: 1 }}
                >
                  Delete
                </Button>
              </ListItem>
            ))}
            {tools.length === 0 && (
              <Typography
                variant="body2"
                sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}
              >
                No tools available. Create one to get started.
              </Typography>
            )}
          </List>
        )}
      </Box>

      {/* New Project Dialog */}
      <Dialog open={isNewProjectDialogOpen} onClose={() => setNewProjectDialogOpen(false)}>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Project Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newProjectName}
            onChange={e => setNewProjectName(e.target.value)}
          />
          <TextField
            margin="dense"
            id="description"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={newProjectDescription}
            onChange={e => setNewProjectDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewProjectDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Agent Dialog */}
      <Dialog
        open={isAgentDialogOpen}
        onClose={() => setIsAgentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingAgentId ? 'Edit Agent' : 'Create New Agent'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="agent-name"
            label="Agent Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newAgent.name}
            onChange={e => handleAgentChange('name', e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            id="agent-description"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={2}
            value={newAgent.description}
            onChange={e => handleAgentChange('description', e.target.value)}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Agent Type</InputLabel>
            <Select
              value={newAgent.type || 'AI'}
              onChange={e => handleAgentChange('type', e.target.value)}
              label="Agent Type"
            >
              <MenuItem value="AI">AI</MenuItem>
              <MenuItem value="Deterministic">Deterministic</MenuItem>
              <MenuItem value="Hybrid">Hybrid</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Subtype/Role</InputLabel>
            <Select
              value={newAgent.subtype || 'assistant'}
              onChange={e => handleAgentChange('subtype', e.target.value)}
              label="Subtype/Role"
            >
              <MenuItem value="assistant">Assistant</MenuItem>
              <MenuItem value="summarizer">Summarizer</MenuItem>
              <MenuItem value="translator">Translator</MenuItem>
              <MenuItem value="researcher">Researcher</MenuItem>
              <MenuItem value="custom">Custom</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', mb: 2 }}>
            <TextField
              margin="dense"
              id="capability"
              label="Add Capability"
              type="text"
              fullWidth
              variant="outlined"
              value={capabilityInput}
              onChange={e => setCapabilityInput(e.target.value)}
            />
            <Button sx={{ ml: 1, mt: 1 }} variant="outlined" onClick={handleAddCapability}>
              Add
            </Button>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Capabilities:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {newAgent.capabilities?.map((cap, index) => (
                <Chip
                  key={index}
                  label={cap}
                  onDelete={() => {
                    const caps = [...(newAgent.capabilities || [])];
                    caps.splice(index, 1);
                    handleAgentChange('capabilities', caps);
                  }}
                />
              ))}
              {newAgent.capabilities?.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No capabilities added yet
                </Typography>
              )}
            </Box>
          </Box>

          {newAgent.type === 'AI' && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>LLM Type</InputLabel>
              <Select
                value={newAgent.model?.llmType || 'gpt-4'}
                onChange={e =>
                  handleAgentChange('model', {
                    ...newAgent.model,
                    llmType: e.target.value,
                  })
                }
                label="LLM Type"
              >
                <MenuItem value="gpt-4">GPT-4</MenuItem>
                <MenuItem value="gemini">Gemini</MenuItem>
                <MenuItem value="claude">Claude</MenuItem>
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAgentDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateOrUpdateAgent}
            disabled={!newAgent.name || !newAgent.description}
          >
            {editingAgentId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Tool Dialog */}
      <Dialog
        open={isToolDialogOpen}
        onClose={() => setIsToolDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingToolId ? 'Edit Tool' : 'Create New Tool'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="tool-name"
            label="Tool Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newTool.name}
            onChange={e => handleToolChange('name', e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            id="tool-description"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={2}
            value={newTool.description}
            onChange={e => handleToolChange('description', e.target.value)}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Tool Type</InputLabel>
            <Select
              value={newTool.type || 'Information'}
              onChange={e => handleToolChange('type', e.target.value)}
              label="Tool Type"
            >
              <MenuItem value="Information">Information</MenuItem>
              <MenuItem value="Computational">Computational</MenuItem>
              <MenuItem value="Interaction">Interaction</MenuItem>
              <MenuItem value="Development">Development</MenuItem>
            </Select>
            <FormHelperText>Category of functionality this tool provides</FormHelperText>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsToolDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateOrUpdateTool}
            disabled={!newTool.name || !newTool.description}
          >
            {editingToolId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tool Assignment Dialog */}
      <Dialog
        open={showToolAssignDialog}
        onClose={() => setShowToolAssignDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Select Agent for Tool</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Select an agent on the canvas to assign this tool to:
          </Typography>

          <List>
            {canvasAgents
              .filter((agent) => {
                // Check if agent has id and convert to string if needed
                const agentId =
                  agent && agent.id !== undefined ? String(agent.id) : "";
                return !agentId.startsWith("user-"); // Now safe to call startsWith
              })
              .map((agent) => (
                <ListItem
                  key={agent.id}
                  component="div"
                  onClick={() => handleAssignToolToAgent(agent.id)}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'rgba(25, 118, 210, 0.1)',
                    },
                  }}
                >
                  <ListItemIcon>
                    <SmartToyIcon sx={{ color: '#1976d2' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={agent.name}
                    secondary={`ID: ${agent.id}`}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
            {canvasAgents.filter((agent) => {
              const agentId =
                agent && agent.id !== undefined ? String(agent.id) : "";
              return !agentId.startsWith("user-");
            }).length === 0 && (
              <Typography
                variant="body2"
                sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}
              >
                No agents available on canvas. Create and add an agent to the canvas first.
              </Typography>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowToolAssignDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Import Preview Modal */}
      {importLdlData && (
        <ImportPreviewModal
          open={showImportPreview}
          onClose={() => {
            setShowImportPreview(false);
            setImportLdlData(null);
          }}
          onImport={handleImportConfirm}
          ldlData={importLdlData}
        />
      )}

      {/* Agent Generation Dialog */}
      <PromptGenerationDialog
        open={showAgentGenerationDialog}
        onClose={() => setShowAgentGenerationDialog(false)}
        type="agent"
        onGenerated={handleGeneratedAgent}
      />

      {/* Tool Generation Dialog */}
      <PromptGenerationDialog
        open={showToolGenerationDialog}
        onClose={() => setShowToolGenerationDialog(false)}
        type="tool"
        onGenerated={handleGeneratedTool}
      />

      {/* Agent Preview Dialog */}
      {generatedAgentData && (
        <GenerationPreviewDialog
          open={showAgentPreviewDialog}
          onClose={() => {
            setShowAgentPreviewDialog(false);
            setGeneratedAgentData(null);
          }}
          type="agent"
          generatedData={generatedAgentData}
          onConfirm={data => {
            if ('model' in data && 'capabilities' in data) {
              handleAddGeneratedAgent(data as Agent);
            }
          }}
        />
      )}

      {/* Tool Preview Dialog */}
      {generatedToolData && (
        <GenerationPreviewDialog
          open={showToolPreviewDialog}
          onClose={() => {
            setShowToolPreviewDialog(false);
            setGeneratedToolData(null);
          }}
          type="tool"
          generatedData={generatedToolData}
          onConfirm={data => {
            if ('agentId' in data && 'parameters' in data) {
              handleAddGeneratedTool(data as Tool);
            }
          }}
        />
      )}
    </Box>
  );
};

export default ElementPalette;
