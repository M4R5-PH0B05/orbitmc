import Docker from "dockerode";
import { type Server } from "@shared/schema";

// Connect via Unix socket — requires /var/run/docker.sock to be mounted
const docker = new Docker({ socketPath: "/var/run/docker.sock" });

// Map OrbitMC server type → itzg/minecraft-server TYPE env var
const TYPE_MAP: Record<string, string> = {
  vanilla:  "VANILLA",
  paper:    "PAPER",
  spigot:   "SPIGOT",
  purpur:   "PURPUR",
  fabric:   "FABRIC",
  forge:    "FORGE",
  neoforge: "NEOFORGE",
  quilt:    "QUILT",
};

// Map OrbitMC difficulty → Minecraft difficulty
const DIFFICULTY_MAP: Record<string, string> = {
  peaceful: "peaceful",
  easy:     "easy",
  normal:   "normal",
  hard:     "hard",
};

// Map OrbitMC gamemode → Minecraft gamemode
const GAMEMODE_MAP: Record<string, string> = {
  survival:  "survival",
  creative:  "creative",
  adventure: "adventure",
  spectator: "spectator",
};

// Map OrbitMC level type → Minecraft level-type
const LEVEL_TYPE_MAP: Record<string, string> = {
  "minecraft:normal":      "DEFAULT",
  "minecraft:flat":        "FLAT",
  "minecraft:large_biomes":"LARGEBIOMES",
  "minecraft:amplified":   "AMPLIFIED",
};

/**
 * Build the full environment variable array for itzg/minecraft-server
 * from an OrbitMC server config.
 */
export function buildEnvVars(server: Server): string[] {
  const env: string[] = [
    "EULA=TRUE",
    `TYPE=${TYPE_MAP[server.type] ?? "VANILLA"}`,
    `VERSION=${server.version}`,
    `MEMORY=${server.maxRam}`,
    `INIT_MEMORY=${server.minRam}`,
    `MAX_PLAYERS=${server.maxPlayers}`,
    `MOTD=${server.motd}`,
    `DIFFICULTY=${DIFFICULTY_MAP[server.difficulty] ?? "normal"}`,
    `MODE=${GAMEMODE_MAP[server.gamemode] ?? "survival"}`,
    `FORCE_GAMEMODE=${server.forceGamemode ? "TRUE" : "FALSE"}`,
    `HARDCORE=${server.hardcore ? "TRUE" : "FALSE"}`,
    `PVP=${server.pvp ? "TRUE" : "FALSE"}`,
    `ONLINE_MODE=${server.onlineMode ? "TRUE" : "FALSE"}`,
    `ALLOW_FLIGHT=${server.flightEnabled ? "TRUE" : "FALSE"}`,
    `ENABLE_WHITELIST=${server.whitelistEnabled ? "TRUE" : "FALSE"}`,
    `ENABLE_COMMAND_BLOCK=${server.commandBlocksEnabled ? "TRUE" : "FALSE"}`,
    `SPAWN_PROTECTION=${server.spawnProtection}`,
    `VIEW_DISTANCE=${server.viewDistance}`,
    `SIMULATION_DISTANCE=${server.simulationDistance}`,
    `SPAWN_ANIMALS=${server.spawnAnimals ? "TRUE" : "FALSE"}`,
    `SPAWN_MONSTERS=${server.spawnMonsters ? "TRUE" : "FALSE"}`,
    `SPAWN_NPCS=${server.spawnNpcs ? "TRUE" : "FALSE"}`,
    `GENERATE_STRUCTURES=${server.generateStructures ? "TRUE" : "FALSE"}`,
    `ALLOW_NETHER=${server.allowNether ? "TRUE" : "FALSE"}`,
    `MAX_TICK_TIME=${server.maxTickTime}`,
    `NETWORK_COMPRESSION_THRESHOLD=${server.networkCompressionThreshold}`,
    `ANNOUNCE_PLAYER_ACHIEVEMENTS=${server.announcePlayerAchievements ? "TRUE" : "FALSE"}`,
    `JVM_OPTS=${server.jvmArgs}`,
  ];

  // Optional fields
  if (server.levelSeed && server.levelSeed !== "") {
    env.push(`SEED=${server.levelSeed}`);
  }

  const levelType = LEVEL_TYPE_MAP[server.levelType];
  if (levelType) {
    env.push(`LEVEL_TYPE=${levelType}`);
  }

  if (server.enableRcon) {
    env.push("ENABLE_RCON=TRUE");
    env.push(`RCON_PORT=${server.rconPort}`);
    env.push(`RCON_PASSWORD=${server.rconPassword}`);
  }

  if (server.resourcePack && server.resourcePack !== "") {
    env.push(`RESOURCE_PACK=${server.resourcePack}`);
    if (server.resourcePackSha1) env.push(`RESOURCE_PACK_SHA1=${server.resourcePackSha1}`);
    env.push(`RESOURCE_PACK_ENFORCE=${server.requireResourcePack ? "TRUE" : "FALSE"}`);
  }

  return env;
}

/** Derive a stable container name from the OrbitMC server id */
export function containerName(serverId: number): string {
  return `orbitmc-server-${serverId}`;
}

/** Check whether Docker is reachable */
export async function isDockerAvailable(): Promise<boolean> {
  try {
    await docker.ping();
    return true;
  } catch {
    return false;
  }
}

/**
 * Create and start a Minecraft server container.
 * Returns the container ID.
 */
export async function startServer(server: Server): Promise<string> {
  const name = containerName(server.id);

  // Remove any existing stopped container with same name
  try {
    const existing = docker.getContainer(name);
    const info = await existing.inspect();
    if (info.State.Running) {
      // Already running — return its ID
      return info.Id;
    }
    await existing.remove({ force: true });
  } catch {
    // Container doesn't exist — that's fine
  }

  const env = buildEnvVars(server);

  const container = await docker.createContainer({
    name,
    Image: "itzg/minecraft-server",
    Env: env,
    ExposedPorts: {
      "25565/tcp": {},
    },
    HostConfig: {
      PortBindings: {
        "25565/tcp": [{ HostPort: String(server.port) }],
      },
      // Data volume: persist server data across restarts
      Binds: [
        `orbitmc-data-${server.id}:/data`,
      ],
      RestartPolicy: { Name: "unless-stopped" },
    },
    Tty: true,
    OpenStdin: true,
    AttachStdout: true,
    AttachStderr: true,
  });

  await container.start();
  return container.id;
}

/**
 * Stop a running container gracefully (sends SIGTERM, waits up to 30s).
 */
export async function stopServer(containerId: string): Promise<void> {
  try {
    const container = docker.getContainer(containerId);
    await container.stop({ t: 30 });
  } catch (e: any) {
    // 304 = already stopped, 404 = not found — both are fine
    if (e.statusCode !== 304 && e.statusCode !== 404) throw e;
  }
}

/**
 * Restart a container.
 */
export async function restartServer(containerId: string): Promise<void> {
  try {
    const container = docker.getContainer(containerId);
    await container.restart({ t: 30 });
  } catch (e: any) {
    if (e.statusCode !== 404) throw e;
  }
}

/**
 * Remove a container (and its volumes) completely.
 */
export async function removeServer(containerId: string): Promise<void> {
  try {
    const container = docker.getContainer(containerId);
    await container.remove({ force: true, v: false });
  } catch (e: any) {
    if (e.statusCode !== 404) throw e;
  }
}

/**
 * Get the current state of a container: running | stopped | error | unknown
 */
export async function getContainerStatus(containerId: string): Promise<string> {
  try {
    const info = await docker.getContainer(containerId).inspect();
    if (info.State.Running) return "running";
    if (info.State.Paused) return "stopped";
    if (info.State.OOMKilled || info.State.Dead) return "error";
    return "stopped";
  } catch {
    return "stopped";
  }
}

/**
 * Send a command to a running Minecraft container via `docker exec`.
 * Uses RCON if configured; falls back to attaching to stdin.
 */
export async function sendCommand(containerId: string, command: string): Promise<void> {
  const exec = await docker.getContainer(containerId).exec({
    Cmd: ["rcon-cli", command],
    AttachStdout: true,
    AttachStderr: true,
  });
  await exec.start({ Detach: false });
}

/**
 * Stream container logs to a callback. Returns a cleanup function.
 * Streams both stdout and stderr with timestamps.
 */
export function streamLogs(
  containerId: string,
  onLine: (line: string) => void,
  onError?: (err: Error) => void
): () => void {
  let stopped = false;

  (async () => {
    try {
      const container = docker.getContainer(containerId);
      const stream = await container.logs({
        follow: true,
        stdout: true,
        stderr: true,
        tail: 100,
        timestamps: false,
      }) as NodeJS.ReadableStream;

      stream.on("data", (chunk: Buffer) => {
        if (stopped) return;
        // Docker log stream has an 8-byte header per frame — strip it
        const text = stripDockerHeader(chunk);
        text.split("\n").forEach(line => {
          const trimmed = line.trim();
          if (trimmed) onLine(trimmed);
        });
      });

      stream.on("error", (err: Error) => {
        if (!stopped && onError) onError(err);
      });

      stream.on("end", () => {
        if (!stopped) onLine("[OrbitMC]: Container log stream ended.");
      });
    } catch (err: any) {
      if (!stopped && onError) onError(err);
    }
  })();

  return () => { stopped = true; };
}

/**
 * Docker multiplexed stream format: each frame has an 8-byte header.
 * Byte 0: stream type (1=stdout, 2=stderr)
 * Bytes 4-7: uint32 BE payload length
 * Strip these headers to get clean text.
 */
function stripDockerHeader(chunk: Buffer): string {
  const parts: string[] = [];
  let offset = 0;
  while (offset < chunk.length) {
    if (offset + 8 > chunk.length) break;
    const size = chunk.readUInt32BE(offset + 4);
    if (size === 0) { offset += 8; continue; }
    if (offset + 8 + size > chunk.length) break;
    parts.push(chunk.slice(offset + 8, offset + 8 + size).toString("utf8"));
    offset += 8 + size;
  }
  return parts.length > 0 ? parts.join("") : chunk.toString("utf8");
}

export { docker };
