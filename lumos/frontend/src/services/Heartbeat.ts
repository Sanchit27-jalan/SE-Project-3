import { API_BASE_URL } from './apiService'; // Import the backend URL

type Observer = (isAlive: boolean) => void;

class Heartbeat {
  private HEARTBEAT_INTERVAL = 10000;
  private observers: Observer[] = [];
  private isAlive: boolean = true;
  private intervalId: NodeJS.Timeout | null = null; // Store the interval ID
  private isPaused: boolean = false; // Track whether the heartbeat is paused

  // Subscribe an observer
  subscribe(observer: Observer) {
    this.observers.push(observer);
  }

  // Unsubscribe an observer
  unsubscribe(observer: Observer) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  // Notify all observers of a status change
  private notify() {
    this.observers.forEach(observer => observer(this.isAlive));
  }

  // Start the heartbeat mechanism
  startHeartbeat(interval: number = this.HEARTBEAT_INTERVAL) {
    // Clear any existing interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Start a new interval
    this.intervalId = setInterval(async () => {
      if (this.isPaused) return; // Skip sending heartbeat if paused

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000); // Abort after 1 second

      try {
        console.log(`Sending heartbeat request to: ${API_BASE_URL}/heartbeat`);
        const response = await fetch(`${API_BASE_URL}/heartbeat`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId); // Clear the timeout if the request succeeds
        console.log(`Heartbeat response status: ${response.status}`);
        const alive = response.ok;
        if (this.isAlive !== alive) {
          this.isAlive = alive;
          console.log(`Backend status changed: ${this.isAlive ? 'Online' : 'Offline'}`);
          this.notify(); // Notify observers of the status change
        }
      } catch (error) {
        clearTimeout(timeoutId); // Clear the timeout if an error occurs
        console.error('Error during heartbeat request:', error);
        if (this.isAlive) {
          this.isAlive = false;
          console.log('Backend status changed: Offline');
          this.notify(); // Notify observers that the backend is down
        }
      }
    }, interval);
  }

  // Pause the heartbeat mechanism
  pauseHeartbeat() {
    console.log('Pausing heartbeat...');
    this.isPaused = true;
  }

  // Resume the heartbeat mechanism
  resumeHeartbeat() {
    console.log('Resuming heartbeat...');
    this.isPaused = false;
  }
}

export const heartbeat = new Heartbeat();
