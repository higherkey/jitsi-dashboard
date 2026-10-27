const EventEmitter = require('events');

class EventBroker extends EventEmitter {
  constructor() {
    super();
    this.clients = new Set();
  }

  addClient(res) {
    this.clients.add(res);
    res.on('close', () => {
      this.clients.delete(res);
    });
  }

  broadcast(eventType, data) {
    const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients) {
      try {
        client.write(payload);
      } catch {
        this.clients.delete(client);
      }
    }
  }

  clientCount() {
    return this.clients.size;
  }
}

const eventBroker = new EventBroker();

module.exports = {
  EventBroker,
  eventBroker
};
