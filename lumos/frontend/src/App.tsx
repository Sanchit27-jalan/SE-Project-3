import { useState, useEffect } from 'react';
import { Box, CssBaseline, ThemeProvider, Typography, Button, Tooltip, Stack } from '@mui/material';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { ReactFlowProvider } from 'reactflow';
import theme from './theme.ts';
import Canvas from './components/Canvas';
import ElementPalette from './components/ElementPalette';
import ExportButton from './components/ExportButton';
import ProjectInfoPanel from './components/ProjectInfoPanel';
import { ProjectController } from './controllers/ProjectController';
import { ProjectData, Agent, Tool, Position, Project } from './models/types';
import { CanvasObjectFactory } from './models/CanvasObjectFactory';
// import { AgentBuilder } from './models/AgentBuilder';
// import { ToolBuilder } from './models/ToolBuilder';
import { heartbeat } from './services/Heartbeat';

function App() {
  const [projectData, setProjectData] = useState<{
    project: {
      id: string;
      name: string;
      version: string;
      description: string;
      authors: string[];
    };
    agents: any[];
    tools: any[];
    interactions: any[];
  }>({
    project: {
      id: 'new-project',
      name: 'New Project',
      version: '1.0.0',
      description: 'Create a new project or select an existing one.',
      authors: [],
    },
    agents: [],
    tools: [],
    interactions: [],
  });
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [projectController, setProjectController] = useState<ProjectController | null>(null);
  const [isBackendAlive, setIsBackendAlive] = useState(true);
  const [availableProjects, setAvailableProjects] = useState<{ id: string; name: string }[]>([]);
  const [isLongOperationInProgress, setIsLongOperationInProgress] = useState(false);

  // Initialize project controller
  useEffect(() => {
    const controller = new ProjectController((updatedProject: ProjectData) => {
      setProjectData({
        project: {
          id: updatedProject.project.id,
          name: updatedProject.project.name,
          version: updatedProject.project.version,
          description: updatedProject.project.description,
          authors: updatedProject.project.authors,
        },
        agents: updatedProject.agents,
        tools: updatedProject.tools,
        interactions: updatedProject.interactions,
      });
    });

    setProjectController(controller);
    setProjectData({
      project: {
        id: controller.getProjectData().project.id,
        name: controller.getProjectData().project.name,
        version: controller.getProjectData().project.version,
        description: controller.getProjectData().project.description,
        authors: controller.getProjectData().project.authors,
      },
      agents: controller.getProjectData().agents,
      tools: controller.getProjectData().tools,
      interactions: controller.getProjectData().interactions,
    });

    // Populate some predefined agents and tools for the palette
    const predefinedAgents = [
      new Agent(
        'library-agent-1',
        'AI',
        'Chat Assistant',
        'General purpose chat assistant',
        'assistant',
        { llmType: 'gpt-4' },
        ['conversation', 'information-retrieval'],
        { type: 'short-term' },
        { type: 'none' }
      ),
      new Agent(
        'library-agent-2',
        'AI',
        'Translator',
        'Language translation specialist',
        'translator',
        { llmType: 'gpt-4' },
        ['translation'],
        { type: 'short-term' },
        { type: 'none' }
      ),
    ];

    const predefinedTools = [
      new Tool(
        'library-tool-1',
        'Search the web for information',
        'Information',
        'Web Search',
        '',
        'search',
        [],
        {},
        {}
      ),
      new Tool(
        'library-tool-2',
        'Convert text between languages',
        'Interaction',
        'Language Translator',
        '',
        'translator',
        [],
        {},
        {}
      ),
    ];

    setAvailableAgents(predefinedAgents);
    setAvailableTools(predefinedTools);
    setAvailableProjects([
      { id: 'project1', name: 'Project One' },
      { id: 'project2', name: 'Project Two' },
    ]);
  }, []);

  useEffect(() => {
    // Subscribe to the heartbeat service
    const handleBackendStatusChange = (isAlive: boolean) => {
      setIsBackendAlive(isAlive);
    };

    heartbeat.subscribe(handleBackendStatusChange);

    // Start the heartbeat mechanism
    heartbeat.startHeartbeat();

    // Cleanup: Unsubscribe when the component unmounts
    return () => {
      heartbeat.unsubscribe(handleBackendStatusChange);
    };
  }, []);

  const startLongOperation = () => {
    console.log('Starting long operation, suspending heartbeat...');
    setIsLongOperationInProgress(true);
  };

  const endLongOperation = () => {
    console.log('Long operation completed, resuming heartbeat...');
    setIsLongOperationInProgress(false);
  };

  // Handle adding an agent to the palette
  const handleAddAgent = (agent: Agent) => {
    setAvailableAgents([...availableAgents, agent]);
  };

  // Handle adding a tool to the palette
  const handleAddTool = (tool: Tool) => {
    setAvailableTools([...availableTools, tool]);
  };

  // Handle editing an agent in the palette
  const handleEditAgent = (agentId: string, updatedAgent: Agent) => {
    setAvailableAgents(availableAgents.map(agent => (agent.id === agentId ? updatedAgent : agent)));
  };

  // Handle deleting an agent from the palette
  const handleDeleteAgent = (agentId: string) => {
    setAvailableAgents(availableAgents.filter(agent => agent.id !== agentId));
  };

  // Handle editing a tool in the palette
  const handleEditTool = (toolId: string, updatedTool: Tool) => {
    setAvailableTools(availableTools.map(tool => (tool.id === toolId ? updatedTool : tool)));
  };

  // Handle deleting a tool from the palette
  const handleDeleteTool = (toolId: string) => {
    setAvailableTools(availableTools.filter(tool => tool.id !== toolId));
  };

  // Handle adding an agent to the canvas
  const handleAddAgentToCanvas = (agent: Agent) => {
    if (projectController) {
      // Use CanvasObjectFactory to create a new agent for the canvas
      const newAgent = CanvasObjectFactory.createAgentForCanvas(agent);
      projectController.addAgent(newAgent);
    }
  };

  // Handle adding a tool to an agent
  const handleAddToolToAgent = (tool: Tool, agentId: string) => {
    if (projectController) {
      // Use CanvasObjectFactory to create a tool for a specific agent
      const newTool = CanvasObjectFactory.createToolForAgent(tool, agentId);
      projectController.addTool(newTool);
    }
  };

  // Handle connecting nodes on the canvas (creating an interaction)
  const handleConnect = (sourceId: string, targetId: string) => {
    if (projectController) {
      projectController.addInteraction(sourceId, targetId);
    }
  };

  // Handle node position changes
  const handleNodePositionChange = (nodeId: string, position: Position) => {
    if (projectController) {
      projectController.updateNodePosition(nodeId, position);
    }
  };

  // Handle deleting an agent
  const handleNodeDelete = (nodeId: string) => {
    if (projectController) {
      if (nodeId.startsWith('agent-')) {
        projectController.removeAgent(nodeId);
      }
    }
  };

  // Handle deleting an interaction
  const handleEdgeDelete = (interactionId: string) => {
    if (projectController) {
      projectController.removeInteraction(interactionId);
    }
  };

  // Handle clearing the canvas
  const handleClearCanvas = () => {
    if (projectController) {
      projectController.clearCanvas();
    }
  };

  // Handle agent configuration changes
  const handleAgentConfigChange = (agentId: string, config: any) => {
    if (projectController && projectData) {
      const agent = projectData.agents.find(a => a.id === agentId);
      if (agent) {
        // Update agent configuration
        agent.model = config.model;
        agent.subtype = config.subtype;

        // Notify project controller of changes
        projectController.updateNodePosition(agentId, agent.position); // This will trigger a state update
      }
    }
  };

  // Handle project export
  const handleExport = async () => {
    startLongOperation();
    try {
      if (projectController) {
        return await projectController.exportProject();
      }
      return false;
    } catch (error) {
      console.error('Export failed:', error);
      return false;
    } finally {
      endLongOperation();
    }
  };

  // Handle project save
  const handleSave = async () => {
    if (projectController) {
      return await projectController.saveProject();
    }
    return false;
  };

  // Handle project import
  const handleImportProject = async (ldlData: any) => {
    startLongOperation();
    try {
      if (projectController) {
        return await projectController.importFromLDL(ldlData);
      }
      return false;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    } finally {
      endLongOperation();
    }
  };

  // Handle project download in JSON or YAML
  const handleDownload = (format: 'json' | 'yaml') => {
    if (projectController) {
      const text = projectController.exportAs(format);
      const mime = format === 'json' ? 'application/json' : 'application/x-yaml';
      const blob = new Blob([text], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Handle project metadata update
  const handleProjectUpdate = (updatedProject: Project) => {
    if (projectController) {
      projectController.updateProject(updatedProject);
    }
  };

  // Handle project selection
  const handleSelectProject = async (project: { id: string | number; name: string; /* other fields */ }) => {
    console.log(`Selected project: ${project.name} (ID: ${project.id})`);
  
    // Ensure ID is a number
    const projectId = typeof project.id === 'string' ? parseInt(project.id, 10) : project.id;
  
    if (projectController) {
      startLongOperation();
      try {
        // Add detailed logging before loading
        console.log("Attempting to load project with ID:", projectId);
        
        // Load the project data from the API
        const success = await projectController.loadProjectById(projectId);
        
        if (success) {
          console.log("Project loaded successfully");
          
          // Print the full project data after loading
          const loadedData = projectController.getProjectData();
          console.log("Loaded project data:", {
            project: loadedData.project,
            agents: loadedData.agents,
            tools: loadedData.tools,
            interactions: loadedData.interactions
          });
          
          // Check specific agent properties to find the issue
          if (loadedData.agents.length > 0) {
            console.log("First agent ID:", loadedData.agents[0].id);
            console.log("First agent ID type:", typeof loadedData.agents[0].id);
          }
        } else {
          console.error("Failed to load project");
        }
      } catch (error) {
        console.error("Error loading project:", error);
      } finally {
        endLongOperation();
      }
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          position: 'relative',
          height: '100vh',
          width: '100vw',
          overflow: 'hidden',
        }}
      >
        {!isBackendAlive && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.5rem',
            }}
          >
            <Typography variant="h5">Connection to server lost. Reconnecting...</Typography>
          </Box>
        )}
        <Box sx={{ pointerEvents: isBackendAlive ? 'auto' : 'none' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              height: '100vh',
              width: '100vw',
              overflow: 'hidden',
            }}
          >
            {/* Main Content Area - takes full width and remaining height */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                flexGrow: 1,
                width: '100%',
                overflow: 'hidden',
              }}
            >
              {/* Left Sidebar - resizable panel */}
              <Box
                sx={{
                  width: 'auto',
                  minWidth: 200,
                  maxWidth: 600,
                  height: '100%',
                  resize: 'horizontal', // allow user to drag width
                  overflow: 'hidden', // hide native scrollbars
                  borderRight: '1px solid rgba(255, 255, 255, 0.12)',
                  boxSizing: 'border-box',
                  padding: 0,
                  margin: 0,
                }}
              >
                <ElementPalette
                  agents={availableAgents}
                  tools={availableTools}
                  availableProjects={availableProjects}
                  onSelectProject={handleSelectProject}
                  onAddAgent={handleAddAgent}
                  onAddTool={handleAddTool}
                  onAddAgentToCanvas={handleAddAgentToCanvas}
                  onAddToolToCanvas={(tool: Tool) => {
                    if (tool.agentId) {
                      handleAddToolToAgent(tool, tool.agentId);
                    }
                  }}
                  onEditAgent={handleEditAgent}
                  onDeleteAgent={handleDeleteAgent}
                  onEditTool={handleEditTool}
                  onDeleteTool={handleDeleteTool}
                  canvasAgents={projectData.agents}
                  onImportProject={handleImportProject}
                  sx={{ width: '100%' }}
                />
              </Box>

              {/* Canvas Area - exactly 80% of screen width */}
              <Box
                sx={{
                  width: '80%',
                  height: '100%',
                  position: 'relative',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Project Info Panel */}
                <Box
                  sx={{
                    position: 'relative',
                    zIndex: 10,
                  }}
                >
                  <ProjectInfoPanel
                    project={projectData.project}
                    onUpdate={handleProjectUpdate}
                  />
                </Box>

                {/* Canvas */}
                <Box
                  sx={{
                    flexGrow: 1,
                    position: 'relative',
                  }}
                >
                  <ReactFlowProvider>
                    <Canvas
                      agents={projectData.agents}
                      tools={projectData.tools}
                      interactions={projectData.interactions}
                      onConnect={handleConnect}
                      onNodePositionChange={handleNodePositionChange}
                      onNodeDelete={handleNodeDelete}
                      onAgentConfigChange={handleAgentConfigChange}
                      onEdgeDelete={handleEdgeDelete}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        right: 30,
                        bottom: 30,
                        zIndex: 1000,
                      }}
                    >
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="Clear all elements except system nodes">
                          <Button
                            variant="outlined"
                            color="secondary"
                            startIcon={<DeleteSweepIcon />}
                            onClick={handleClearCanvas}
                          >
                            Clear Canvas
                          </Button>
                        </Tooltip>
                        <ExportButton
                          onExport={handleExport}
                          onSave={handleSave}
                          onDownload={handleDownload}
                        />
                      </Stack>
                    </Box>
                  </ReactFlowProvider>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
