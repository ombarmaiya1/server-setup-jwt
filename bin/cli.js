#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define source (where the template files are stored inside your package)
const templateRoot = path.resolve(__dirname, "..");

// Target directory resolution:
// 1. process.env.INIT_CWD -> Directory where user ran `npm install`
// 2. process.cwd() -> Fallback for direct npx or local execution
const baseUserDir = process.env.INIT_CWD || process.cwd();

// Get optional project name parameter, or default to "backend"
const projectName = process.argv[2] || "backend";

// Resolve final path relative to the user's terminal location
const targetDir = path.resolve(baseUserDir, projectName);

const excludedNames = new Set([
  "node_modules",
  "bin",
  ".git",
  ".cache",
  ".turbo",
  ".next",
  ".vite",
  "dist",
  "build",
  "out",
  "coverage",
  ".nyc_output",
]);

const excludedFiles = new Set([
  ".env",
  ".env.local",
  ".env.development.local",
  ".env.test.local",
  ".env.production.local",
]);

function shouldExclude(name) {
  return excludedNames.has(name) || excludedFiles.has(name);
}

function copyTemplate(source, destination) {
  const stats = fs.statSync(source);

  if (stats.isDirectory()) {
    fs.mkdirSync(destination, { recursive: true });

    for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
      if (shouldExclude(entry.name)) {
        continue;
      }

      copyTemplate(
        path.join(source, entry.name),
        path.join(destination, entry.name)
      );
    }

    return;
  }

  fs.copyFileSync(source, destination);
}

function ensureTargetDirectoryIsReady(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
    return;
  }

  const existingFiles = fs.readdirSync(directory);

  if (existingFiles.length > 0) {
    console.error(`Error: "${path.basename(directory)}" already exists and is not empty.`);
    console.error("Choose a different project name or remove the existing folder.");
    process.exit(1);
  }
}

console.log(`Creating backend starter in ${targetDir}`);

ensureTargetDirectoryIsReady(targetDir);
copyTemplate(templateRoot, targetDir);

console.log("");
console.log("Backend starter created successfully.");
console.log("");
console.log("Next steps:");
console.log(`  cd ${projectName}`);
console.log("  npm install");
console.log("  cp .env.example .env    # if you add an example env file");
console.log("  npm run dev");
console.log("");
console.log("Configure your MongoDB URI, JWT secret, and email credentials before running in production.");