import React, { useCallback, useState } from 'react';
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
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Box,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import AgentNode from './nodes/AgentNode';
import { Agent, Tool, Position, Interaction } from '../models/types';

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

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Update nodes and edges when props change
  React.useEffect(() => {
    // 1) build system nodes
    const systemNodes: Node[] = ["user-input", "user-output"]
      .map((sysId) => agents.find((a) => a.id === sysId))
      .filter((a): a is Agent => !!a)
      .map((agent) => ({
        id: agent.id,
        type: "agent",
        position: { x: agent.position.x, y: agent.position.y },
        draggable: true,
        data: {
          agent,
          tools: tools.filter((t) => t.agentId === agent.id),
          onDelete: onNodeDelete,
          onConnect,
          onConfigChange: onAgentConfigChange,
        },
      }));

    // 2) build the rest of your nodes
    const otherNodes: Node[] = agents
      .filter((a) => a.id !== "user-input" && a.id !== "user-output")
      .map((agent) => ({
        id: agent.id,
        type: "agent",
        position: { x: agent.position.x, y: agent.position.y },
        draggable: true,
        data: {
          agent,
          tools: tools.filter((t) => t.agentId === agent.id),
          onDelete: onNodeDelete,
          onConnect: onConnect,
          onConfigChange: onAgentConfigChange,
        },
      }));

    // 3) compute edges
    const updatedEdges: Edge[] = interactions
      .map(interaction => {
        if (interaction.participants.length < 2) return null;

        const [source, target] = interaction.participants;

        return {
          id: interaction.id,
          source,
          target,
          type: 'default',
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          style: {
            stroke: theme.palette.primary.main,
          },
          label: interaction.protocol?.type || 'Interaction',
        };
      })
      .filter(Boolean) as Edge[];

    // 4) actually update ReactFlow
    setNodes([...systemNodes, ...otherNodes]);
    setEdges(updatedEdges);
  }, [
    agents,
    tools,
    interactions,
    theme.palette.primary.main,
    onConnect,
    onNodeDelete,
    onAgentConfigChange,
  ]);

  // Handle connection between nodes
  const handleConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        onConnect(params.source, params.target);
      }
    },
    [onConnect]
  );

  // Handle node drag
  const handleNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      console.log(`Node ${node.id} dragged to:`, node.position);

      // Call the position change handler with the updated position
      onNodePositionChange(node.id, node.position);
    },
    [onNodePositionChange]
  );

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        position: 'relative', // Change from absolute to relative
        bgcolor: '#0a1929',
        '& .react-flow__node': { zIndex: 1 },
        '& .react-flow__handle': { zIndex: 2 },
        overflow: 'hidden', // Add this to prevent overflow
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
        style={{ width: '100%', height: '100%' }}
        onEdgeClick={(event, edge) => {
          event.preventDefault();
          setPendingEdgeDeleteId(edge.id);
        }}
      >
        <Background color="rgba(255, 255, 255, 0.1)" gap={16} />
        <Controls />
      </ReactFlow>
      {/* Confirmation dialog for edge deletion */}
      <Dialog open={Boolean(pendingEdgeDeleteId)} onClose={() => setPendingEdgeDeleteId(null)}>
        <DialogTitle>Delete Interaction</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this interaction?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingEdgeDeleteId(null)}>Cancel</Button>
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
