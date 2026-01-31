class RecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.recording = false;
    this.port.onmessage = (event) => {
      if (event.data.command === 'START') {
        this.recording = true;
      }
      
      if (event.data.command === 'STOP') {
        this.recording = false;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]; 
    if (this.recording && input.length > 0) {
      // Send the raw Float32Array channel data back to the main thread
      this.port.postMessage({
        command: 'DATA',
        buffer: input[0] // Captures mono audio
      });
    }
    return true; // Keep the processor alive
  }
}

registerProcessor('recorder-processor', RecorderProcessor);