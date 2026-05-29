import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";

const services = [
  {
    name: "backend",
    cwd: path.join(rootDir, "backend"),
    args: ["run", "dev"],
    checkUrl: "http://localhost:4100/api/metrics"
  },
  {
    name: "ui",
    cwd: path.join(rootDir, "ui"),
    args: ["run", "dev", "--", "--port", "5173", "--strictPort"],
    checkUrl: "http://localhost:5173/src/main.jsx"
  }
];

let shuttingDown = false;
const children = [];

for (const service of services) {
  if (await isServiceRunning(service)) {
    console.log(`[${service.name}] already running at ${service.checkUrl}`);
    continue;
  }

  children.push(startService(service));
}

if (!children.length) {
  console.log("All services are already running.");
  process.exit(0);
}

function startService(service) {
  const child = spawn(npmCmd, service.args, {
    cwd: service.cwd,
    env: process.env,
    shell: isWindows,
    stdio: ["ignore", "pipe", "pipe"]
  });

  child.stdout.on("data", (data) => write(service.name, data));
  child.stderr.on("data", (data) => write(service.name, data));
  child.on("exit", (code, signal) => {
    if (!shuttingDown) {
      console.log(`[${service.name}] exited with ${signal || code}`);
      shutdown(code || 1);
    }
  });

  return child;
}

async function isServiceRunning(service) {
  try {
    const response = await fetch(service.checkUrl);
    return response.ok;
  } catch {
    return false;
  }
}

function write(name, data) {
  data
    .toString()
    .split(/\r?\n/)
    .filter(Boolean)
    .forEach((line) => console.log(`[${name}] ${line}`));
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  children.forEach((child) => {
    if (!child.killed) child.kill(isWindows ? "SIGTERM" : "SIGINT");
  });

  setTimeout(() => process.exit(code), 300);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
