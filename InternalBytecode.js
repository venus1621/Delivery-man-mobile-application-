// Placeholder file to satisfy Metro symbolication lookups.
// Metro sometimes reports stack frames referencing InternalBytecode.js
// (internal VM bytecode) and attempts to read it from the project root.
// Creating this harmless placeholder prevents ENOENT errors during symbolication.

// This file intentionally contains nothing executable for the app.
export default {};
