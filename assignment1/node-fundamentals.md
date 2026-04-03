# Node.js Fundamentals

## What is Node.js?

Node.js is a runtime environment that allows JavaScript to be executed outside of a web browser. Node is built on Chrome's V8 JavaScript engine and allows developers to use JavaScript for server-side programming, such as building everything from web servers to command-line tools.

## How does Node.js differ from running JavaScript in the browser?

In the browser, JavaScript has access to the DOM, window object, and browser-specific APIs like `fetch` and `localStorage`. Node.js has no DOM or browser APIs, but instead includes access to the file system, network, operating system, and other server-side capabilities through built-in modules like `fs`, `os`, `path`, and `http`. The browser sandboxes JavaScript for security, while Node.js runs with full system access.

## What is the V8 engine, and how does Node use it?

V8 is Google's open-source JavaScript engine, written in C++, that compiles JavaScript directly to native machine code for fast execution. Node.js uses V8 as its core runtime to execute JavaScript outside the browser. Anthropic wraps V8 with additional C++ bindings to expose system-level functionality (file I/O, networking, etc.) that browsers intentionally restrict.

## What are some key use cases for Node.js?

- **Web servers and REST APIs** – handling HTTP requests efficiently
- **Real-time applications** – chat apps, live dashboards using WebSockets
- **Command-line tools** – scripts and developer tooling (e.g., npm, webpack)
- **File system operations** – reading, writing, and processing files
- **Microservices** – lightweight, scalable backend services
- **Streaming data** – processing large files or media without loading into memory

## CommonJS vs ES Modules

CommonJS is the original Node.js module system, using `require()` and `module.exports`:

```javascript
// commonjs-example.js
const fs = require("fs");

function greet(name) {
  return `Hello, ${name}!`;
}

module.exports = { greet };
```

ES Modules (ESM) is the modern JavaScript standard, using `import` and `export`:

```javascript
// esm-example.mjs
import fs from "fs";

export function greet(name) {
  return `Hello, ${name}!`;
}
```

Key differences:

- CommonJS loads modules **synchronously**; ES Modules load **asynchronously**
- CommonJS uses `require()` / `module.exports`; ESM uses `import` / `export`
- ESM is the official standard; CommonJS is Node.js-specific
- To use ESM in Node.js, use `.mjs` extension or set `"type": "module"` in `package.json`
