const fs = require("fs");
const path = require("path");
const fsp = require("fs/promises");

const filePath = path.join(__dirname, "sample-files", "sample.txt");

// Recreate sample.txt with expected content
try {
  fs.unlinkSync(filePath);
} catch {}
fs.writeFileSync(filePath, "Hello, async world!");

// ============================================================
// 1. CALLBACK PATTERN
// ============================================================
fs.readFile(filePath, "utf8", (err, data) => {
  if (err) throw err;
  console.log("Callback read:", data.trim());
});

// ------------------------------------------------------------
// CALLBACK HELL EXAMPLE (in comments)
// Callback hell occurs when you nest multiple async callbacks,
// making code hard to read and maintain:
//
// fs.readFile('file1.txt', 'utf8', (err, data1) => {
//   fs.readFile('file2.txt', 'utf8', (err, data2) => {
//     fs.readFile('file3.txt', 'utf8', (err, data3) => {
//       fs.writeFile('output.txt', data1 + data2 + data3, (err) => {
//         console.log('Done! (buried in nested callbacks)');
//       });
//     });
//   });
// });
//
// Each nested level makes debugging harder — this is "callback hell".
// ------------------------------------------------------------

// ============================================================
// 2. PROMISE PATTERN
// ============================================================
fsp
  .readFile(filePath, "utf8")
  .then((data) => {
    console.log("Promise read:", data.trim());
  })
  .catch((err) => {
    console.error("Promise error:", err);
  });

// ============================================================
// 3. ASYNC/AWAIT PATTERN
// ============================================================
(async () => {
  try {
    const data = await fsp.readFile(filePath, "utf8");
    console.log("Async/Await read:", data.trim());
  } catch (err) {
    console.error("Async/Await error:", err);
  }
})();
