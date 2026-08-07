#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const { existsSync } = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

const servers = [
  {
    name: "Backend RPG",
    directory: path.join(projectRoot, "backend"),
    command: "npm run start:dev",
  },
  {
    name: "Frontend RPG",
    directory: path.join(projectRoot, "frontend"),
    command: "npm run dev",
  },
];

function quotePowerShell(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

for (const server of servers) {
  const packageJson = path.join(server.directory, "package.json");

  if (!existsSync(packageJson)) {
    console.error(`Nao foi possivel encontrar: ${packageJson}`);
    process.exit(1);
  }
}

for (const server of servers) {
  const script = [
    `$Host.UI.RawUI.WindowTitle = ${quotePowerShell(server.name)}`,
    `Set-Location -LiteralPath ${quotePowerShell(server.directory)}`,
    server.command,
  ].join("; ");

  const encodedScript = Buffer.from(script, "utf16le").toString("base64");
  const startProcessScript = [
    "$process = Start-Process",
    "-FilePath 'powershell.exe'",
    "-ArgumentList @('-NoLogo', '-NoExit', '-ExecutionPolicy', 'Bypass',",
    `'-EncodedCommand', '${encodedScript}')`,
    `-WorkingDirectory ${quotePowerShell(server.directory)}`,
    "-WindowStyle Normal",
    "-PassThru",
    "; $process.Id",
  ].join(" ");

  const result = spawnSync(
    "powershell.exe",
    ["-NoLogo", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", startProcessScript],
    {
      encoding: "utf8",
      windowsHide: true,
    },
  );

  const pid = result.stdout?.trim();

  if (result.status !== 0 || !pid) {
    console.error(`Falha ao iniciar ${server.name}.`);
    console.error(result.stderr?.trim() || result.error?.message || "Erro desconhecido.");
    process.exitCode = 1;
    continue;
  }

  console.log(`${server.name} iniciado (PID ${pid}).`);
}

if (!process.exitCode) {
  console.log("Backend e frontend iniciados em janelas separadas.");
}
