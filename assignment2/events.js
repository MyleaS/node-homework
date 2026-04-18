const EventEmitter = require("events");

const emitter = new EventEmitter();

// Listen for the 'time' event
emitter.on("time", (time) => {
  console.log("Time received:", time);
});

// Emit the current time every 5 seconds
setInterval(() => {
  const currentTime = new Date().toString();
  emitter.emit("time", currentTime);
}, 5000);

module.exports = emitter;
