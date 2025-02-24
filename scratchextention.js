class FakeRadioExtension {
  constructor() {
    this.stations = {}; // Store active stations
    this.currentStation = null;
    this.lastReceived = null;
    this.audioStream = null;
    this.mediaRecorder = null;
  }

  getInfo() {
    return {
      id: "fakeRadio",
      name: "Gandi Radio Extension",
      blocks: [
        // Reporter Blocks
        { opcode: "getStationID", blockType: "reporter", text: "current station ID" },
        { opcode: "getLastReceived", blockType: "reporter", text: "last received message" },
        { opcode: "getLastSender", blockType: "reporter", text: "last sender ID" },

        // Boolean Blocks
        { opcode: "isValidID", blockType: "Boolean", text: "is station ID [ID] valid?", arguments: { ID: { type: "string" } } },
        { opcode: "isBroadcasting", blockType: "Boolean", text: "is broadcasting?" },
        { opcode: "isReceiving", blockType: "Boolean", text: "is receiving?" },

        // Stack Blocks
        { opcode: "setStation", blockType: "command", text: "set station ID to [ID]", arguments: { ID: { type: "string" } } },
        { opcode: "broadcast", blockType: "command", text: "broadcast file [FILE]", arguments: { FILE: { type: "string" } } },
        { opcode: "startBroadcastVoice", blockType: "command", text: "start live voice broadcast" },
        { opcode: "stopBroadcastVoice", blockType: "command", text: "stop live voice broadcast" },
        { opcode: "receive", blockType: "command", text: "receive data" },
        { opcode: "stopReceiving", blockType: "command", text: "stop receiving" },
        { opcode: "clearReceived", blockType: "command", text: "clear last received data" },
      ],
    };
  }

  getStationID() {
    return this.currentStation || "None";
  }

  getLastReceived() {
    return this.lastReceived || "No data received";
  }

  getLastSender() {
    return this.lastReceived ? this.lastReceived.sender : "Unknown";
  }

  isValidID({ ID }) {
    return typeof ID === "string" && ID.length > 3;
  }

  isBroadcasting() {
    return !!this.currentStation;
  }

  isReceiving() {
    return this.lastReceived !== null;
  }

  setStation({ ID }) {
    if (this.isValidID({ ID })) {
      this.currentStation = ID;
      this.stations[ID] = this.stations[ID] || { listeners: [], messages: [], audioChunks: [] };
    }
  }

  broadcast({ FILE }) {
    if (!this.currentStation) return;
    if (this.stations[this.currentStation]) {
      this.stations[this.currentStation].messages.push({ sender: this.currentStation, data: FILE });
    }
  }

  async startBroadcastVoice() {
    if (!this.currentStation) return;
    try {
      this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.audioStream);
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.stations[this.currentStation].audioChunks.push(event.data);
        }
      };
      this.mediaRecorder.start(500); // Send audio data every 500ms
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  }

  stopBroadcastVoice() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.audioStream.getTracks().forEach(track => track.stop());
      this.mediaRecorder = null;
      this.audioStream = null;
    }
  }

  receive() {
    if (!this.currentStation) return;
    const station = this.stations[this.currentStation];
    if (station && station.messages.length > 0) {
      this.lastReceived = station.messages.shift();
    }
    if (station && station.audioChunks.length > 0) {
      const audioBlob = new Blob(station.audioChunks, { type: "audio/webm" });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      station.audioChunks = [];
    }
  }

  stopReceiving() {
    this.lastReceived = null;
  }

  clearReceived() {
    this.lastReceived = null;
  }
}

Scratch.extensions.register(new FakeRadioExtension());
