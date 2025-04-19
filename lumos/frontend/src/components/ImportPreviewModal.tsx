import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Paper,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import BuildIcon from '@mui/icons-material/Build';
import ConnectionsIcon from '@mui/icons-material/CompareArrows';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Agent, Tool, Interaction, Project } from '../models/types';
import { serializeLdl } from '../services/apiService';

interface ImportPreviewModalProps {
  open: boolean;
  onClose: () => void;
  onImport: () => void;
  ldlData: {
    project?: Project;
    agents?: Agent[];
    tools?: Tool[];
    interactions?: Interaction[];
  };
}

const ImportPreviewModal: React.FC<ImportPreviewModalProps> = ({
  open,
  onClose,
  onImport,
  ldlData,
}) => {
  const [activeTab, setActiveTab] = React.useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Check for required User Input and User Output nodes
  const hasInputNode = ldlData.agents?.some(agent => agent.id === 'user-input');
  const hasOutputNode = ldlData.agents?.some(agent => agent.id === 'user-output');

  // Count elements
  const agentCount = ldlData.agents?.length || 0;
  const toolCount = ldlData.tools?.length || 0;
  const interactionCount = ldlData.interactions?.length || 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Import Preview</DialogTitle>
      <DialogContent>
        {/* Project Info */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {ldlData.project?.name || 'Unnamed Project'}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {ldlData.project?.description || 'No description provided'}
          </Typography>
          <Box display="flex" gap={1}>
            {ldlData.project?.version && (
              <Chip
                label={`Version: ${ldlData.project.version}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            <Chip label={`${agentCount} Agents`} size="small" variant="outlined" />
            <Chip label={`${toolCount} Tools`} size="small" variant="outlined" />
            <Chip label={`${interactionCount} Connections`} size="small" variant="outlined" />
          </Box>
        </Box>

        {/* Validation Notice */}
        <Paper
          sx={{
            p: 2,
            mb: 3,
            bgcolor: !hasInputNode || !hasOutputNode ? 'warning.light' : 'success.light',
            color:
              !hasInputNode || !hasOutputNode ? 'warning.contrastText' : 'success.contrastText',
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            {!hasInputNode || !hasOutputNode ? (
              <WarningIcon color="warning" />
            ) : (
              <CheckCircleIcon color="success" />
            )}
            <Typography>
              {!hasInputNode && !hasOutputNode
                ? 'Missing User Input and User Output nodes. They will be automatically added.'
                : !hasInputNode
                  ? 'Missing User Input node. It will be automatically added.'
                  : !hasOutputNode
                    ? 'Missing User Output node. It will be automatically added.'
                    : 'Project contains required User Input and User Output nodes.'}
            </Typography>
          </Box>
        </Paper>

        {/* Content Tabs */}
        <Box sx={{ width: '100%', mb: 2 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="import preview tabs">
              <Tab icon={<SmartToyIcon />} label="Agents" />
              <Tab icon={<BuildIcon />} label="Tools" />
              <Tab icon={<ConnectionsIcon />} label="Connections" />
              <Tab icon={<InfoIcon />} label="Raw JSON" />
              <Tab icon={<InfoIcon />} label="Raw YAML" />
            </Tabs>
          </Box>

          {/* Agents Tab */}
          <TabPanel value={activeTab} index={0}>
            {ldlData.agents && ldlData.agents.length > 0 ? (
              <Grid container spacing={2}>
                {ldlData.agents.map(agent => (
                  <Grid item xs={12} sm={6} md={4} key={agent.id}>
                    <Paper
                      sx={{
                        p: 2,
                        height: '100%',
                        border:
                          agent.id === 'user-input' || agent.id === 'user-output'
                            ? '2px solid'
                            : '1px solid',
                        borderColor:
                          agent.id === 'user-input' || agent.id === 'user-output'
                            ? 'primary.main'
                            : 'divider',
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <SmartToyIcon
                          color={
                            agent.id === 'user-input' || agent.id === 'user-output'
                              ? 'primary'
                              : 'inherit'
                          }
                        />
                        <Typography variant="subtitle1" fontWeight="bold">
                          {agent.name || agent.id}
                          {(agent.id === 'user-input' || agent.id === 'user-output') && (
                            <Chip
                              label={agent.id === 'user-input' ? 'Input' : 'Output'}
                              size="small"
                              color="primary"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {agent.description || 'No description'}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="caption" color="text.secondary" component="div">
                        Type: {agent.type || 'Not specified'}
                        {agent.subtype && ` / ${agent.subtype}`}
                      </Typography>
                      {agent.capabilities && agent.capabilities.length > 0 && (
                        <Box mt={1}>
                          <Typography variant="caption" color="text.secondary" component="div">
                            Capabilities:
                          </Typography>
                          <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                            {agent.capabilities.map((cap, idx) => (
                              <Chip key={idx} label={cap} size="small" />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body1" color="text.secondary" align="center" py={4}>
                No agents defined in this project.
              </Typography>
            )}
          </TabPanel>

          {/* Tools Tab */}
          <TabPanel value={activeTab} index={1}>
            {ldlData.tools && ldlData.tools.length > 0 ? (
              <Grid container spacing={2}>
                {ldlData.tools.map(tool => (
                  <Grid item xs={12} sm={6} md={4} key={tool.id}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <BuildIcon color="success" />
                        <Typography variant="subtitle1" fontWeight="bold">
                          {tool.name || tool.id}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {tool.description || 'No description'}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="caption" color="text.secondary" component="div">
                        Type: {tool.type || 'Not specified'}
                        {tool.subtype && ` / ${tool.subtype}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" component="div" mt={1}>
                        Assigned to: {tool.agentId || 'Not assigned'}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body1" color="text.secondary" align="center" py={4}>
                No tools defined in this project.
              </Typography>
            )}
          </TabPanel>

          {/* Connections Tab */}
          <TabPanel value={activeTab} index={2}>
            {ldlData.interactions && ldlData.interactions.length > 0 ? (
              <List>
                {ldlData.interactions.map(interaction => (
                  <ListItem key={interaction.id}>
                    <ListItemIcon>
                      <ConnectionsIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography>
                          {interaction.name || `Connection ${interaction.id}`}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary">
                            {interaction.participants.length >= 2
                              ? `From: ${interaction.participants[0]} → To: ${interaction.participants[1]}`
                              : 'Incomplete connection'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Protocol: {interaction.protocol?.type || 'Not specified'}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body1" color="text.secondary" align="center" py={4}>
                No connections defined in this project.
              </Typography>
            )}
          </TabPanel>

          {/* Raw JSON Tab */}
          <TabPanel value={activeTab} index={3}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Project Information</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                  <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
                    {JSON.stringify(ldlData.project, null, 2)}
                  </pre>
                </Paper>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Agents ({ldlData.agents?.length || 0})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                  <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
                    {JSON.stringify(ldlData.agents, null, 2)}
                  </pre>
                </Paper>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Tools ({ldlData.tools?.length || 0})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                  <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
                    {JSON.stringify(ldlData.tools, null, 2)}
                  </pre>
                </Paper>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Connections ({ldlData.interactions?.length || 0})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                  <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
                    {JSON.stringify(ldlData.interactions, null, 2)}
                  </pre>
                </Paper>
              </AccordionDetails>
            </Accordion>
          </TabPanel>

          {/* YAML Raw Tab */}
          <TabPanel value={activeTab} index={4}>
            <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
              <pre style={{ overflow: 'auto', maxHeight: '400px' }}>
                {serializeLdl(
                  {
                    project: ldlData.project,
                    agents: ldlData.agents,
                    tools: ldlData.tools,
                    interactions: ldlData.interactions,
                  },
                  'yaml'
                )}
              </pre>
            </Paper>
          </TabPanel>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onImport} variant="contained" color="primary">
          Import Project
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Tab Panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`import-tabpanel-${index}`}
      aria-labelledby={`import-tab-${index}`}
      {...other}
      style={{ marginTop: '16px' }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export default ImportPreviewModal;
