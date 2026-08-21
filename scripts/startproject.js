#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const { existsSync } = require("node:fs");
const net = require("node:net");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

const servers = [
  {
    name: "Backend RPG",
    directory: path.join(projectRoot, "backend"),
    port: 3001,
    healthUrl: "http://127.0.0.1:3001",
    healthCheck: (response, body) => response.ok && body === "Hello World!",
    environment: { PORT: "3001" },
    command: "npm run start:dev",
  },
  {
    name: "Frontend RPG",
    directory: path.join(projectRoot, "frontend"),
    port: 3000,
    healthUrl: "http://127.0.0.1:3000",
    healthCheck: (response) => response.ok,
    command: "npm run dev -- --port 3000",
  },
];

const startupTimeoutMs = 180_000;

function quotePowerShell(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function isPortInUse(port) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });

    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", (error) => {
      if (error.code === "ECONNREFUSED") {
        resolve(false);
        return;
      }

      reject(error);
    });
    socket.setTimeout(1_000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function isExpectedServer(server) {
  try {
    const response = await fetch(server.healthUrl, {
      signal: AbortSignal.timeout(2_000),
    });
    const body = await response.text();
    return server.healthCheck(response, body);
  } catch {
    return false;
  }
}

function describePortOwner(port) {
  const command = [
    `$connection = Get-NetTCPConnection -State Listen -LocalPort ${port}`,
    "if ($connection) {",
    "$process = Get-CimInstance Win32_Process -Filter \"ProcessId = $($connection[0].OwningProcess)\"",
    "Write-Output \"PID $($process.ProcessId): $($process.CommandLine)\"",
    "}",
  ].join("; ");
  const result = spawnSync("powershell.exe", ["-NoProfile", "-Command", command], {
    encoding: "utf8",
    windowsHide: true,
  });

  return result.stdout?.trim() || "processo nao identificado";
}

function startServer(server) {
  const environment = Object.entries(server.environment ?? {}).map(
    ([key, value]) => `$env:${key} = ${quotePowerShell(value)}`,
  );
  const script = [
    `$Host.UI.RawUI.WindowTitle = ${quotePowerShell(server.name)}`,
    `Set-Location -LiteralPath ${quotePowerShell(server.directory)}`,
    ...environment,
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
    { encoding: "utf8", windowsHide: true },
  );

  const pid = result.stdout?.trim();

  if (result.status !== 0 || !pid) {
    throw new Error(
      result.stderr?.trim() || result.error?.message || "Erro desconhecido.",
    );
  }

  console.log(`${server.name} iniciado (PID ${pid}, porta ${server.port}).`);
}

async function waitUntilReady(server) {
  const deadline = Date.now() + startupTimeoutMs;

  while (Date.now() < deadline) {
    if (await isExpectedServer(server)) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  return false;
}

async function main() {
  for (const server of servers) {
    const packageJson = path.join(server.directory, "package.json");

    if (!existsSync(packageJson)) {
      throw new Error(`Nao foi possivel encontrar: ${packageJson}`);
    }
  }

  for (const server of servers) {
    if (await isPortInUse(server.port)) {
      if (await isExpectedServer(server)) {
        console.log(`${server.name} ja esta ativo na porta ${server.port}.`);
        continue;
      }

      throw new Error(
        `A porta ${server.port} esta ocupada por outro processo (${describePortOwner(server.port)}).`,
      );
    }

    startServer(server);
    console.log(`Aguardando ${server.name} responder...`);

    if (!(await waitUntilReady(server))) {
      throw new Error(
        `${server.name} nao respondeu na porta ${server.port} em 180 segundos. Confira a janela do servidor.`,
      );
    }

    console.log(`${server.name} pronto em ${server.healthUrl}.`);
  }

  console.log("Projeto pronto: http://localhost:3000");
}

main().catch((error) => {
  console.error(`Falha ao iniciar o projeto: ${error.message}`);
  process.exitCode = 1;
});
