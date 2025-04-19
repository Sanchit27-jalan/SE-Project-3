import React, { useCallback, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  Connection,
  NodeTypes,
  ConnectionLineType,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Box,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import AgentNode from "./nodes/AgentNode";
import { Agent, Tool, Position, Interaction } from "../models/types";

interface CanvasProps {
  agents: Agent[];
  tools: Tool[];
  interactions: Interaction[];
  onConnect: (sourceId: string, targetId: string) => void;
  onNodePositionChange: (nodeId: string, position: Position) => void;
  onNodeDelete: (nodeId: string) => void;
  onAgentConfigChange: (agentId: string, config: any) => void;
  onEdgeDelete: (interactionId: string) => void; // add prop
}

// Custom node types
const nodeTypes: NodeTypes = {
  agent: AgentNode,
};

const Canvas: React.FC<CanvasProps> = ({
  agents,
  tools,
  interactions,
  onConnect,
  onNodePositionChange,
  onNodeDelete,
  onAgentConfigChange,
  onEdgeDelete,
}) => {
  const theme = useTheme();
  const [pendingEdgeDeleteId, setPendingEdgeDeleteId] = useState<string | null>(null);

  // Convert agents to ReactFlow nodes
  const initialNodes: Node[] = agents.map((agent) => ({
    id: agent.id,
    type: "agent",
    position: { x: agent.position.x, y: agent.position.y },
    data: {
      agent: agent,
      tools: tools.filter((tool) => tool.agentId === agent.id),
      onDelete: onNodeDelete,
      onConnect: onConnect,
      onConfigChange: onAgentConfigChange,
    },
  }));

  // Convert interactions to ReactFlow edges
  const initialEdges: Edge[] = interactions
    .map((interaction) => {
      // For each interaction, create an edge from source to target
      // Assuming first participant is source and second is target for directed interactions
      if (interaction.participants.length < 2) return null;

      const [source, target] = interaction.participants;

      return {
        id: interaction.id,
        source: source,
        target: target,
        type: "default",
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        style: {
          stroke: theme.palette.primary.main,
        },
        label: interaction.protocol?.type || "Interaction",
      };
    })
    .filter(Boolean) as Edge[];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges when props change
  React.useEffect(() => {
    const updatedNodes: Node[] = agents.map((agent) => ({
      id: agent.id,
      type: "agent",
      position: { x: agent.position.x, y: agent.position.y },
      data: {
        agent: agent,
        tools: tools.filter((tool) => tool.agentId === agent.id),
        onDelete: onNodeDelete,
        onConnect: onConnect,
        onConfigChange: onAgentConfigChange,
      },
    }));

    const updatedEdges: Edge[] = interactions
      .map((interaction) => {
        if (interaction.participants.length < 2) return null;

        const [source, target] = interaction.participants;

        return {
          id: interaction.id,
          source,
          target,
          type: "default",
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          style: {
            stroke: theme.palette.primary.main,
          },
          label: interaction.protocol?.type || "Interaction",
        };
      })
      .filter(Boolean) as Edge[];

    setNodes(updatedNodes);
    setEdges(updatedEdges);
  }, [
    agents,
    tools,
    interactions,
    theme.palette.primary.main,
    onNodeDelete,
    onConnect,
    onAgentConfigChange,
  ]);

  // Handle connection between nodes
  const handleConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        onConnect(params.source, params.target);
      }
    },
    [onConnect],
  );

  // Handle node drag
  const handleNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodePositionChange(node.id, node.position);
    },
    [onNodePositionChange],
  );

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        position: "relative", // Change from absolute to relative
        bgcolor: "#0a1929",
        "& .react-flow__node": { zIndex: 1 },
        "& .react-flow__handle": { zIndex: 2 },
        overflow: "hidden", // Add this to prevent overflow
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        snapToGrid
        fitView
        style={{ width: "100%", height: "100%" }}
        onEdgeClick={(event, edge) => {
          event.preventDefault();
          setPendingEdgeDeleteId(edge.id);
        }}
      >
        <Background color="rgba(255, 255, 255, 0.1)" gap={16} />
        <Controls />
      </ReactFlow>
      {/* Confirmation dialog for edge deletion */}
      <Dialog
        open={Boolean(pendingEdgeDeleteId)}
        onClose={() => setPendingEdgeDeleteId(null)}
      >
        <DialogTitle>Delete Interaction</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this interaction?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingEdgeDeleteId(null)}>
            Cancel
          </Button>
          <Button
            color="error"
            onClick={() => {
              if (pendingEdgeDeleteId) onEdgeDelete(pendingEdgeDeleteId);
              setPendingEdgeDeleteId(null);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Canvas;
