#!/usr/bin/env node

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------
// PATHS
// ---------------------------------------------

const packageRoot = path.resolve(__dirname, "..");

const templateRoot = path.join(
  packageRoot,
  "templates"
);

const baseUserDir =
  process.env.INIT_CWD || process.cwd();

const projectName =
  process.argv[2] || "server";

const targetDir = path.resolve(
  baseUserDir,
  projectName
);

// ---------------------------------------------
// EXCLUDED FILES / DIRECTORIES
// ---------------------------------------------

const excludedNames = new Set([
  "node_modules",
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
  return (
    excludedNames.has(name) ||
    excludedFiles.has(name)
  );
}

// ---------------------------------------------
// FILE HASH
// ---------------------------------------------

function getFileHash(filePath) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(filePath))
    .digest("hex");
}

function filesAreSame(source, destination) {
  if (!fs.existsSync(destination)) {
    return false;
  }

  if (
    !fs.statSync(source).isFile() ||
    !fs.statSync(destination).isFile()
  ) {
    return false;
  }

  return (
    getFileHash(source) ===
    getFileHash(destination)
  );
}

// ---------------------------------------------
// COPY / SYNC
// ---------------------------------------------

function syncTemplate(source, destination) {
  const stats = fs.statSync(source);

  // DIRECTORY
  if (stats.isDirectory()) {
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, {
        recursive: true,
      });
    }

    const entries = fs.readdirSync(source, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      if (shouldExclude(entry.name)) {
        continue;
      }

      syncTemplate(
        path.join(source, entry.name),
        path.join(destination, entry.name)
      );
    }

    return;
  }

  // FILE
  const relativePath = path.relative(
    targetDir,
    destination
  );

  // Missing file
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(path.dirname(destination), {
      recursive: true,
    });

    fs.copyFileSync(source, destination);

    console.log(`+ Added     ${relativePath}`);
    return;
  }

  // Same file
  if (filesAreSame(source, destination)) {
    console.log(`= Unchanged ${relativePath}`);
    return;
  }

  // Different file
  fs.copyFileSync(source, destination);

  console.log(`~ Updated   ${relativePath}`);
}

// ---------------------------------------------
// VALIDATION
// ---------------------------------------------

if (!fs.existsSync(templateRoot)) {
  console.error(
    "Error: templates directory was not found."
  );

  process.exit(1);
}

// ---------------------------------------------
// CREATE / SYNC
// ---------------------------------------------

console.log("");
console.log(`Creating server: ${projectName}`);
console.log("");

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, {
    recursive: true,
  });
}

syncTemplate(
  templateRoot,
  targetDir
);

console.log("");
console.log("Server created successfully.");
console.log("");
console.log("Copy Your Enviroment Variable in .env file")
console.log("")