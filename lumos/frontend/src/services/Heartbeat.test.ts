import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { heartbeat } from "./Heartbeat";

describe("Heartbeat", () => {
  let observer1: ReturnType<typeof vi.fn>;
  let observer2: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    observer1 = vi.fn();
    observer2 = vi.fn();
    heartbeat.subscribe(observer1);
    heartbeat.subscribe(observer2);
  });

  afterEach(() => {
    // Unsubscribe all observers after each test
    heartbeat.unsubscribe(observer1);
    heartbeat.unsubscribe(observer2);
    vi.restoreAllMocks();
  });

  it("should notify all subscribed observers on status change", () => {
    // Access private notify method
    (heartbeat as any).isAlive = false;
    (heartbeat as any).notify();
    expect(observer1).toHaveBeenCalledWith(false);
    expect(observer2).toHaveBeenCalledWith(false);
  });

  it("should not notify unsubscribed observers", () => {
    heartbeat.unsubscribe(observer2);
    (heartbeat as any).isAlive = true;
    (heartbeat as any).notify();
    expect(observer1).toHaveBeenCalledWith(true);
    expect(observer2).not.toHaveBeenCalled();
  });
});
