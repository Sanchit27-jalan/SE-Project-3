import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  SpyInstance,
} from "vitest";
import { ApiService, API_BASE_URL } from "./apiService";
import { heartbeat } from "./Heartbeat";

// Mock global fetch
let fetchMock: SpyInstance;

beforeEach(() => {
  fetchMock = vi.spyOn(globalThis, "fetch");
  vi.spyOn(heartbeat, "pauseHeartbeat");
  vi.spyOn(heartbeat, "resumeHeartbeat");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ApiService", () => {
  describe("exportProject", () => {
    it("pauses/resumes heartbeat and returns success on ok response", async () => {
      const mockResult = { url: "http://example.com", project_id: "123" };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResult),
      } as any);

      const response = await ApiService.exportProject({ foo: "bar" });
      expect(heartbeat.pauseHeartbeat).toHaveBeenCalled();
      expect(heartbeat.resumeHeartbeat).toHaveBeenCalled();
      expect(response).toEqual({
        success: true,
        runtimeUrl: mockResult.url,
        projectId: mockResult.project_id,
      });
      expect(fetchMock).toHaveBeenCalledWith(
        `${API_BASE_URL}/export`,
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("resumes heartbeat and returns failure on non-ok response", async () => {
      fetchMock.mockResolvedValueOnce({ ok: false } as any);
      const response = await ApiService.exportProject({});
      expect(response.success).toBe(false);
      expect(heartbeat.resumeHeartbeat).toHaveBeenCalled();
    });
  });

  describe("saveProject", () => {
    it("pauses/resumes heartbeat and returns true on ok response", async () => {
      fetchMock.mockResolvedValueOnce({ ok: true } as any);
      const response = await ApiService.saveProject({
        project: {},
        agents: [],
        tools: [],
        interactions: [],
      });
      expect(heartbeat.pauseHeartbeat).toHaveBeenCalled();
      expect(heartbeat.resumeHeartbeat).toHaveBeenCalled();
      expect(response).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        `${API_BASE_URL}/save`,
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("resumes heartbeat and returns false on error", async () => {
      fetchMock.mockRejectedValueOnce(new Error("network error"));
      const response = await ApiService.saveProject({
        project: {},
        agents: [],
        tools: [],
        interactions: [],
      });
      expect(response).toBe(false);
      expect(heartbeat.resumeHeartbeat).toHaveBeenCalled();
    });
  });

  describe("generateAgent", () => {
    it("returns agent object on success", async () => {
      const agentObj = { id: "a1" };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ agent: agentObj }),
      } as any);
      const res = await ApiService.generateAgent("prompt");
      expect(res).toEqual({ success: true, agent: agentObj });
    });

    it("returns success false on non-ok response", async () => {
      fetchMock.mockResolvedValueOnce({ ok: false } as any);
      const res = await ApiService.generateAgent("prompt");
      expect(res.success).toBe(false);
    });
  });

  describe("generateTool", () => {
    it("returns tool object on success", async () => {
      const toolObj = { id: "t1" };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ tool: toolObj }),
      } as any);
      const res = await ApiService.generateTool("prompt");
      expect(res).toEqual({ success: true, tool: toolObj });
    });

    it("returns success false on error", async () => {
      fetchMock.mockRejectedValueOnce(new Error("network fail"));
      const res = await ApiService.generateTool("prompt");
      expect(res.success).toBe(false);
    });
  });
});
