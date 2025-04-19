import React, { useState } from 'react';
import {
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Stack,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Link,
  Box,
  Divider,
  Menu,
  MenuItem,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PublishIcon from '@mui/icons-material/Publish';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LinkIcon from '@mui/icons-material/Link';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import GetAppIcon from '@mui/icons-material/GetApp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

interface ExportButtonProps {
  onExport: () => Promise<
    | boolean
    | {
        success: boolean;
        errors?: string[];
        warnings?: string[];
        runtimeUrl?: string;
      }
  >;
  onSave: () => Promise<boolean>;
  onDownload: (format: 'json' | 'yaml') => void;
}

const ExportButton: React.FC<ExportButtonProps> = ({ onExport, onSave, onDownload }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // State for export status dialog
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [runtimeUrl, setRuntimeUrl] = useState<string | undefined>(undefined);
  const [exportSuccess, setExportSuccess] = useState(false);

  // State for download menu
  const [downloadAnchorEl, setDownloadAnchorEl] = useState<HTMLElement | null>(null);
  const isDownloadMenuOpen = Boolean(downloadAnchorEl);

  const handleDownloadClick = (event: React.MouseEvent<HTMLElement>) => {
    setDownloadAnchorEl(event.currentTarget);
  };
  const handleDownloadMenuClose = () => {
    setDownloadAnchorEl(null);
  };
  const handleDownloadFormat = (format: 'json' | 'yaml') => {
    onDownload(format);
    handleDownloadMenuClose();
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await onExport();

      // Reset validation state
      setValidationErrors([]);
      setValidationWarnings([]);
      setRuntimeUrl(undefined);

      if (typeof result === 'object') {
        // Handle detailed response
        if (result.success) {
          setExportSuccess(true);
          if (result.warnings && result.warnings.length > 0) {
            setValidationWarnings(result.warnings);
          }
          if (result.runtimeUrl) {
            setRuntimeUrl(result.runtimeUrl);
            alert(result.runtimeUrl);
          }
          setShowStatusDialog(true);
        } else {
          setExportSuccess(false);
          if (result.errors && result.errors.length > 0) {
            setValidationErrors(result.errors);
          }
          if (result.warnings && result.warnings.length > 0) {
            setValidationWarnings(result.warnings);
          }
          setShowStatusDialog(true);
        }
      } else if (result === true) {
        // Handle simple success response
        // setStatusMessage("Project exported successfully! URL:"+result.url);
        setShowSuccess(true);
        setExportSuccess(true);
      } else {
        // Handle simple error response
        setStatusMessage('Export failed. Please check console for details.');
        setShowError(true);
        setExportSuccess(false);
      }
    } catch (error) {
      console.error('Error during export:', error);
      setStatusMessage('Export failed. Please check console for details.');
      setShowError(true);
      setExportSuccess(false);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await onSave();
      if (success) {
        setStatusMessage('Project checkpoint saved successfully!');
        setShowSuccess(true);
      } else {
        setStatusMessage('Save failed. Please check console for details.');
        setShowError(true);
      }
    } catch (error) {
      console.error('Error during save:', error);
      setStatusMessage('Save failed. Please check console for details.');
      setShowError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const copyRuntimeUrl = () => {
    if (runtimeUrl) {
      navigator.clipboard
        .writeText(runtimeUrl)
        .then(() => {
          setStatusMessage('Runtime URL copied to clipboard!');
          setShowSuccess(true);
        })
        .catch(err => {
          console.error('Failed to copy URL:', err);
          setStatusMessage('Failed to copy URL to clipboard');
          setShowError(true);
        });
    }
  };

  return (
    <>
      <Stack
        direction="row"
        spacing={2}
        sx={{
          zIndex: 2,
        }}
      >
        <Tooltip title="Download project as file">
          <Button
            variant="outlined"
            startIcon={<GetAppIcon />}
            endIcon={<ArrowDropDownIcon />}
            onClick={handleDownloadClick}
            disabled={isSaving || isExporting}
          >
            Download
          </Button>
        </Tooltip>
        <Menu
          anchorEl={downloadAnchorEl}
          open={isDownloadMenuOpen}
          onClose={handleDownloadMenuClose}
        >
          <MenuItem onClick={() => handleDownloadFormat('json')}>Export JSON</MenuItem>
          <MenuItem onClick={() => handleDownloadFormat('yaml')}>Export YAML</MenuItem>
        </Menu>

        <Tooltip title="Save checkpoint without validation">
          <Button
            variant="contained"
            color="primary"
            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={isSaving || isExporting}
          >
            {isSaving ? 'Saving...' : 'Save Checkpoint'}
          </Button>
        </Tooltip>

        <Tooltip title="Export validated project to runtime">
          <Button
            variant="contained"
            color="success"
            startIcon={
              isExporting ? <CircularProgress size={20} color="inherit" /> : <PublishIcon />
            }
            onClick={handleExport}
            disabled={isSaving || isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export Project'}
          </Button>
        </Tooltip>
      </Stack>

      {/* Export Status Dialog */}
      <Dialog
        open={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{exportSuccess ? 'Export Successful' : 'Export Failed'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2}>
            {/* Success or Error Icon */}
            <Box display="flex" alignItems="center" mt={1} mb={1}>
              {exportSuccess ? (
                <CheckCircleOutlineIcon color="success" fontSize="large" sx={{ mr: 1 }} />
              ) : (
                <ErrorOutlineIcon color="error" fontSize="large" sx={{ mr: 1 }} />
              )}
              <Typography variant="h6">
                {exportSuccess
                  ? 'Your multi-agent system has been successfully exported.'
                  : 'Export failed due to validation errors.'}
              </Typography>
            </Box>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Box>
                <Typography variant="subtitle1" color="error" fontWeight="bold" gutterBottom>
                  Errors that must be fixed:
                </Typography>
                <List dense>
                  {validationErrors.map((error, index) => (
                    <ListItem key={index}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <ErrorOutlineIcon color="error" />
                      </ListItemIcon>
                      <ListItemText primary={error} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Validation Warnings */}
            {validationWarnings.length > 0 && (
              <Box>
                <Typography variant="subtitle1" color="warning.main" fontWeight="bold" gutterBottom>
                  Warnings (may affect system behavior):
                </Typography>
                <List dense>
                  {validationWarnings.map((warning, index) => (
                    <ListItem key={index}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <WarningAmberIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText primary={warning} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Runtime URL */}
            {runtimeUrl && (
              <Box mt={2}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Runtime Environment:
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 2,
                    gap: 1,
                  }}
                >
                  <LinkIcon color="primary" />
                  <Link
                    href={runtimeUrl}
                    target="_blank"
                    rel="noopener"
                    sx={{ flexGrow: 1, wordBreak: 'break-all' }}
                  >
                    {runtimeUrl}
                  </Link>
                  <Tooltip title="Copy URL to clipboard">
                    <Button onClick={copyRuntimeUrl} size="small" startIcon={<ContentCopyIcon />}>
                      Copy
                    </Button>
                  </Tooltip>
                </Box>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Your multi-agent system is now hosted at this URL. Click the link to interact with
                  it.
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStatusDialog(false)}>Close</Button>
          {runtimeUrl && (
            <Button variant="contained" color="primary" href={runtimeUrl} target="_blank">
              Open Runtime
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Simple toast notifications */}
      <Snackbar open={showSuccess} autoHideDuration={4000} onClose={() => setShowSuccess(false)}>
        <Alert
          onClose={() => setShowSuccess(false)}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {statusMessage}
        </Alert>
      </Snackbar>

      <Snackbar open={showError} autoHideDuration={4000} onClose={() => setShowError(false)}>
        <Alert
          onClose={() => setShowError(false)}
          severity="error"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {statusMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ExportButton;
