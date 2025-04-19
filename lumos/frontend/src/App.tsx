import { useState, useEffect } from "react";
import { Box, CssBaseline, ThemeProvider, Typography, Button, Tooltip, Stack } from "@mui/material";
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { ReactFlowProvider } from "reactflow";
import theme from "./theme.ts";
import Canvas from "./components/Canvas";
import ElementPalette from "./components/ElementPalette";
import ExportButton from "./components/ExportButton";
import ProjectInfoPanel from "./components/ProjectInfoPanel";
import { ProjectController } from "./controllers/ProjectController";
import { ProjectData, Agent, Tool, Position, Project } from "./models/types";
import { CanvasObjectFactory } from "./models/CanvasObjectFactory";
import { heartbeat } from "./services/Heartbeat";

// Monolithic custom hooks
function useProjectControllerHook() {
  const initialState = {
    project: { id: "new-project", name: "New Project", version: "1.0.0", description: "Create a new project or select an existing one.", authors: [] },
    agents: [],
    tools: [],
    interactions: []
  };
  const [projectData, setProjectData] = useState<ProjectData>(initialState);
  const [projectController, setProjectController] = useState<ProjectController | null>(null);
  const [isLongOp, setIsLongOp] = useState(false);

  useEffect(() => {
    const controller = new ProjectController((updated: ProjectData) => {
      setProjectData({ project: updated.project, agents: updated.agents, tools: updated.tools, interactions: updated.interactions });
    });
    setProjectController(controller);
    const init = controller.getProjectData();
    setProjectData({ project: init.project, agents: init.agents, tools: init.tools, interactions: init.interactions });
  }, []);

  const startLong = () => setIsLongOp(true);
  const endLong = () => setIsLongOp(false);

  const handleExport = async () => { startLong(); try { if (projectController) return await projectController.exportProject(); return false; } finally { endLong(); } };
  const handleSave = async () => { if (projectController) return await projectController.saveProject(); return false; };
  const handleImport = async (ldlData: any) => { startLong(); try { if (projectController) return await projectController.importFromLDL(ldlData); return false; } finally { endLong(); } };
  const handleDownload = (format: "json" | "yaml") => {
    if (!projectController) return;
    const text = projectController.exportAs(format);
    const mime = format === "json" ? "application/json" : "application/x-yaml";
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `project.${format}`; a.click(); URL.revokeObjectURL(url);
  };
  const handleUpdate = (upd: Project) => { if (projectController) projectController.updateProject(upd); };

  return { projectData, projectController, isLongOp, handleExport, handleSave, handleImport, handleDownload, handleUpdate };
}

function usePaletteHook() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    setAgents([
      new Agent("library-agent-1", "AI", "Chat Assistant", "General purpose chat assistant", "assistant", { llmType: "gpt-4" }, ["conversation", "information-retrieval"], { type: "short-term" }, { type: "none" }),
      new Agent("library-agent-2", "AI", "Translator", "Language translation specialist", "translator", { llmType: "gpt-4" }, ["translation"], { type: "short-term" }, { type: "none" })
    ]);
    setTools([
      new Tool("library-tool-1", "Search the web for information", "Information", "Web Search", "", "search", [], {}, {}),
      new Tool("library-tool-2", "Convert text between languages", "Interaction", "Language Translator", "", "translator", [], {}, {})
    ]);
    setProjects([{ id: "project1", name: "Project One" }, { id: "project2", name: "Project Two" }]);
  }, []);

  const addAgent = (agent: Agent) => setAgents(prev => [...prev, agent]);
  const addTool = (tool: Tool) => setTools(prev => [...prev, tool]);
  const editAgent = (id: string, upd: Agent) => setAgents(prev => prev.map(a => a.id === id ? upd : a));
  const deleteAgent = (id: string) => setAgents(prev => prev.filter(a => a.id !== id));
  const editTool = (id: string, upd: Tool) => setTools(prev => prev.map(t => t.id === id ? upd : t));
  const deleteTool = (id: string) => setTools(prev => prev.filter(t => t.id !== id));

  return { agents, tools, projects, addAgent, addTool, editAgent, deleteAgent, editTool, deleteTool };
}

function useHeartbeatStatus() {
  const [alive, setAlive] = useState(true);
  useEffect(() => {
    heartbeat.subscribe(setAlive);
    heartbeat.startHeartbeat();
    return () => heartbeat.unsubscribe(setAlive);
  }, []);
  return alive;
}

// Monolithic canvas management hook
function useCanvasManager(projectController: ProjectController | null, agents: Agent[]) {
  const handleAddAgentToCanvas = (agent: Agent) => {
    if (projectController) {
      const newAgent = CanvasObjectFactory.createAgentForCanvas(agent);
      projectController.addAgent(newAgent);
    }
  };
  const handleAddToolToAgent = (tool: Tool, agentId: string) => {
    if (projectController) {
      const newTool = CanvasObjectFactory.createToolForAgent(tool, agentId);
      projectController.addTool(newTool);
    }
  };
  const handleConnect = (sourceId: string, targetId: string) => {
    if (projectController) projectController.addInteraction(sourceId, targetId);
  };
  const handleNodePositionChange = (nodeId: string, position: Position) => {
    if (projectController) projectController.updateNodePosition(nodeId, position);
  };
  const handleNodeDelete = (nodeId: string) => {
    if (projectController && nodeId.startsWith("agent-")) projectController.removeAgent(nodeId);
  };
  const handleEdgeDelete = (interactionId: string) => {
    if (projectController) projectController.removeInteraction(interactionId);
  };
  const handleClearCanvas = () => {
    if (projectController) projectController.clearCanvas();
  };
  const handleAgentConfigChange = (agentId: string, config: any) => {
    if (projectController) {
      const agent = agents.find(a => a.id === agentId);
      if (agent) {
        agent.model = config.model;
        agent.subtype = config.subtype;
        projectController.updateNodePosition(agentId, agent.position);
      }
    }
  };
  return { handleAddAgentToCanvas, handleAddToolToAgent, handleConnect, handleNodePositionChange, handleNodeDelete, handleEdgeDelete, handleClearCanvas, handleAgentConfigChange };
}

function App() {
  const { projectData, projectController, handleExport, handleSave, handleImport, handleDownload, handleUpdate } = useProjectControllerHook();
  const { agents: availableAgents, tools: availableTools, projects: availableProjects, addAgent, addTool, editAgent, deleteAgent, editTool, deleteTool } = usePaletteHook();
  const isBackendAlive = useHeartbeatStatus();
  const canvasManager = useCanvasManager(projectController, projectData.agents);

  const handleSelectProject = (project: { id: string; name: string }) => {
    console.log(`Selected project: ${project.name} (${project.id})`);
    const updatedProject = { ...projectData.project, id: project.id, name: project.name };
    handleUpdate(updatedProject);
    // clear canvas after selecting a new project
    canvasManager.handleClearCanvas();
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          position: "relative",
          height: "100vh",
          width: "100vw",
          overflow: "hidden",
        }}
      >
        {!isBackendAlive && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "1.5rem",
            }}
          >
            <Typography variant="h5">
              Connection to server lost. Reconnecting...
            </Typography>
          </Box>
        )}
        <Box sx={{ pointerEvents: isBackendAlive ? "auto" : "none" }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "100vh",
              width: "100vw",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                flexGrow: 1,
                width: "100%",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  width: "auto",
                  minWidth: 200,
                  maxWidth: 600,
                  height: "100%",
                  resize: "horizontal",
                  overflow: "hidden",
                  borderRight: "1px solid rgba(255, 255, 255, 0.12)",
                  boxSizing: "border-box",
                  padding: 0,
                  margin: 0,
                }}
              >
                <ElementPalette
                  agents={availableAgents}
                  tools={availableTools}
                  availableProjects={availableProjects}
                  onSelectProject={handleSelectProject}
                  onAddAgent={addAgent}
                  onAddTool={addTool}
                  onAddAgentToCanvas={canvasManager.handleAddAgentToCanvas}
                  onAddToolToCanvas={(tool: Tool) => {
                    if (tool.agentId) {
                      canvasManager.handleAddToolToAgent(tool, tool.agentId);
                    }
                  }}
                  onEditAgent={editAgent}
                  onDeleteAgent={deleteAgent}
                  onEditTool={editTool}
                  onDeleteTool={deleteTool}
                  canvasAgents={projectData.agents}
                  onImportProject={handleImport}
                  sx={{ width: "100%" }}
                />
              </Box>
              <Box
                sx={{
                  width: "80%",
                  height: "100%",
                  position: "relative",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    zIndex: 10,
                  }}
                >
                  <ProjectInfoPanel
                    project={projectData.project}
                    onUpdate={handleUpdate}
                  />
                </Box>
                <Box
                  sx={{
                    flexGrow: 1,
                    position: "relative",
                  }}
                >
                  <ReactFlowProvider>
                    <Canvas
                      agents={projectData.agents}
                      tools={projectData.tools}
                      interactions={projectData.interactions}
                      onConnect={canvasManager.handleConnect}
                      onNodePositionChange={canvasManager.handleNodePositionChange}
                      onNodeDelete={canvasManager.handleNodeDelete}
                      onAgentConfigChange={canvasManager.handleAgentConfigChange}
                      onEdgeDelete={canvasManager.handleEdgeDelete}
                    />
                    <Box
                      sx={{
                        position: "absolute",
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
                            onClick={canvasManager.handleClearCanvas}
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
