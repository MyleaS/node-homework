const os = require("os");
const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");

const sampleFilesDir = path.join(__dirname, "sample-files");

// ============================================================
// OS MODULE
// ============================================================
console.log("Platform:", os.platform());
console.log("CPU:", os.cpus()[0].model);
console.log("Total Memory:", os.totalmem());

// ============================================================
// PATH MODULE
// ============================================================
const filePath = path.join(sampleFilesDir, "folder", "file.txt");
console.log("Joined path:", filePath);

// ============================================================
// FS.PROMISES — write then read demo.txt
// ============================================================
const demoPath = path.join(sampleFilesDir, "demo.txt");
const largeFilePath = path.join(sampleFilesDir, "largefile.txt");

(async () => {
  // Write and read demo.txt using fs.promises
  await fsp.writeFile(demoPath, "Hello from fs.promises!");
  const data = await fsp.readFile(demoPath, "utf8");
  console.log("fs.promises read:", data);

  // ============================================================
  // CREATE largefile.txt — 100 lines
  // ============================================================
  const lines = Array.from(
    { length: 100 },
    (_, i) =>
      `This is line ${i + 1} in a large file written to demonstrate streams.`
  ).join("\n");
  await fsp.writeFile(largeFilePath, lines);

  // ============================================================
  // STREAMS — read largefile.txt with highWaterMark
  // ============================================================
  await new Promise((resolve) => {
    const stream = fs.createReadStream(largeFilePath, {
      encoding: "utf8",
      highWaterMark: 1024, // 1KB chunks
    });

    stream.on("data", (chunk) => {
      console.log("Read chunk:", chunk.slice(0, 40));
    });

    stream.on("end", () => {
      console.log("Finished reading large file with streams");
      resolve();
    });
  });
})();
