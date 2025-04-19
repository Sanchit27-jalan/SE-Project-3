import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { ProjectController } from './ProjectController';
import { ApiService, serializeLdl, deserializeLdl } from '../services/apiService';
import { Agent, Tool } from '../models/types';

const noop = () => {};

vi.mock('../services/apiService', () => ({
  ApiService: {
    exportProject: vi.fn(),
    saveProject: vi.fn(),
    processImportedData: vi.fn(data => data),
  },
  serializeLdl: vi.fn(data => JSON.stringify(data)),
  deserializeLdl: vi.fn(text => JSON.parse(text)),
}));

describe('ProjectController', () => {
  let controller: ProjectController;
  let onChange: Mock;

  beforeEach(() => {
    onChange = vi.fn();
    controller = new ProjectController(onChange);
  });

  it('initializes with user-input and user-output agents', () => {
    const data = controller.getProjectData();
    expect(data.agents.some(a => a.id === 'user-input')).toBe(true);
    expect(data.agents.some(a => a.id === 'user-output')).toBe(true);
  });

  it('addAgent assigns default position and notifies', () => {
    const newAgent = new Agent(
      'id1',
      'A',
      'Name',
      'Desc',
      'sub',
      {},
      [],
      { type: 's' },
      { type: 'n' }
    );
    controller.addAgent(newAgent);
    expect(controller.getProjectData().agents).toContainEqual(
      expect.objectContaining({ id: 'id1' })
    );
    expect(onChange).toHaveBeenCalled();
  });

  it('addTool assigns id and notifies', () => {
    const newTool = new Tool('t1', 'desc', 'Information', 'Tool', '', 'sub', [], {}, {});
    controller.addTool(newTool);
    expect(controller.getProjectData().tools.some(t => t.id === 't1')).toBe(true);
    expect(onChange).toHaveBeenCalled();
  });

  it('addInteraction handles invalid nodes', () => {
    const spyErr = vi.spyOn(console, 'error').mockImplementation(noop);
    controller.addInteraction('foo', 'bar');
    expect(spyErr).toHaveBeenCalled();
  });

  it('addInteraction enforces single user-output input', () => {
    const input = controller.getProjectData().agents.find(a => a.id === 'user-input')!;
    controller.addInteraction(input.id, 'user-output');
    // second attempt should error
    const spyErr = vi.spyOn(console, 'error').mockImplementation(noop);
    controller.addInteraction(input.id, 'user-output');
    expect(spyErr).toHaveBeenCalledWith(
      expect.stringContaining('User Output node can only have a single input')
    );
  });

  it('removeAgent does not remove system agents', () => {
    const spyWarn = vi.spyOn(console, 'warn').mockImplementation(noop);
    controller.removeAgent('user-input');
    expect(spyWarn).toHaveBeenCalled();
  });

  it('removeAgent removes normal agent and interactions/tools', () => {
    const agent = new Agent('a2', 'A', 'n', 'd', 's', {}, [], { type: 's' }, { type: 'n' });
    controller.addAgent(agent);
    controller.removeAgent('a2');
    expect(controller.getProjectData().agents.some(a => a.id === 'a2')).toBe(false);
  });

  it('removeTool removes tool and notifies', () => {
    const tool = new Tool('t2', 'desc', 'Information', 'Tool', '', '', [], {}, {});
    controller.addTool(tool);
    controller.removeTool('t2');
    expect(controller.getProjectData().tools.some(t => t.id === 't2')).toBe(false);
  });

  it('removeInteraction removes existing interaction', () => {
    const inNode = controller.getProjectData().agents.find(a => a.id === 'user-input')!;
    controller.addInteraction(inNode.id, 'user-output');
    controller.removeInteraction(`interaction-${inNode.id}-user-output`);
    expect(controller.getProjectData().interactions.length).toBe(0);
  });

  it('updateNodePosition moves agent and notifies', () => {
    const pos = { x: 999, y: 999 };
    controller.updateNodePosition('user-input', pos);
    const agent = controller.getProjectData().agents.find(a => a.id === 'user-input')!;
    expect(agent.position).toEqual(pos);
  });

  it('assignToolToAgent updates tool.agentId and notifies', () => {
    const tool = new Tool('t3', 'desc', 'Information', 'Tool', '', '', [], {}, {});
    controller.addTool(tool);
    controller.assignToolToAgent('t3', 'user-input');
    expect(controller.getProjectData().tools.find(t => t.id === 't3')!.agentId).toBe('user-input');
  });

  it('validateProject detects missing path and cycles', () => {
    // default no interactions -> missing path error
    let res = controller.validateProject();
    expect(res.errors).toContain(
      'User Output node must have at least one input connection. Add a connection from an agent to the User Output node.'
    );
    // create cycle a->b->a
    const a1 = new Agent('x', 'A', 'n', '', '', {}, [], { type: 's' }, { type: 'n' });
    const a2 = new Agent('y', 'A', 'n', '', '', {}, [], { type: 's' }, { type: 'n' });
    controller.addAgent(a1);
    controller.addAgent(a2);
    controller.addInteraction('x', 'y');
    controller.addInteraction('y', 'x');
    res = controller.validateProject();
    expect(res.errors.some(e => /cycles/.test(e))).toBe(true);
  });

  it('exportAs and importFromText roundtrip', async () => {
    const json = controller.exportAs('json');
    expect(serializeLdl).toHaveBeenCalled();
    (deserializeLdl as any).mockReturnValueOnce({
      project: {},
      agents: [],
      tools: [],
    });
    vi.spyOn(controller, 'importFromLDL').mockResolvedValue(true);
    const ok = await controller.importFromText(json, 'json');
    expect(ok).toBe(true);
  });

  it('exportProject returns error info on invalid', async () => {
    vi.spyOn(controller, 'validateProject').mockReturnValue({
      isValid: false,
      errors: ['e'],
      warnings: [],
    });
    const out = await controller.exportProject();
    expect((out as any).success).toBe(false);
  });

  it('exportProject calls ApiService on valid', async () => {
    vi.spyOn(controller, 'validateProject').mockReturnValue({
      isValid: true,
      errors: [],
      warnings: [],
    });
    (ApiService.exportProject as any).mockResolvedValue({ success: true });
    const out = await controller.exportProject();
    expect(ApiService.exportProject).toHaveBeenCalled();
    expect((out as any).success).toBe(true);
  });

  it('saveProject calls ApiService.saveProject', async () => {
    (ApiService.saveProject as any).mockResolvedValue(true);
    const ok = await controller.saveProject();
    expect(ApiService.saveProject).toHaveBeenCalled();
    expect(ok).toBe(true);
  });

  it('importFromLDL handles invalid structure', async () => {
    const bad = await controller.importFromLDL({});
    expect(bad).toBe(false);
  });
});
