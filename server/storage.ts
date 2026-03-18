import {
  users, servers, modpacks, mods, serverLogs, fileEntries,
  players, worlds, backups, softwareVersions, serverAccess,
  type User, type InsertUser,
  type Server, type InsertServer,
  type Modpack, type InsertModpack,
  type Mod, type InsertMod,
  type ServerLog, type InsertServerLog,
  type FileEntry, type InsertFileEntry,
  type Player, type InsertPlayer,
  type World, type InsertWorld,
  type Backup, type InsertBackup,
  type SoftwareVersion, type InsertSoftwareVersion,
  type ServerAccess, type InsertServerAccess,
} from "@shared/schema";
import bcrypt from "bcryptjs";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;

  // Servers
  getServer(id: number): Promise<Server | undefined>;
  getAllServers(): Promise<Server[]>;
  createServer(server: InsertServer): Promise<Server>;
  updateServer(id: number, updates: Partial<Server>): Promise<Server | undefined>;
  deleteServer(id: number): Promise<void>;

  // Modpacks
  getModpack(id: number): Promise<Modpack | undefined>;
  getAllModpacks(): Promise<Modpack[]>;
  createModpack(modpack: InsertModpack): Promise<Modpack>;
  updateModpack(id: number, updates: Partial<Modpack>): Promise<Modpack | undefined>;
  deleteModpack(id: number): Promise<void>;

  // Mods
  getMod(id: number): Promise<Mod | undefined>;
  getModsByModpack(modpackId: number): Promise<Mod[]>;
  createMod(mod: InsertMod): Promise<Mod>;
  deleteMod(id: number): Promise<void>;

  // Logs
  getServerLogs(serverId: number, limit?: number): Promise<ServerLog[]>;
  addServerLog(log: InsertServerLog): Promise<ServerLog>;
  clearServerLogs(serverId: number): Promise<void>;

  // Files
  getFilesByServer(serverId: number, dirPath: string): Promise<FileEntry[]>;
  getFile(id: number): Promise<FileEntry | undefined>;
  getFileByPath(serverId: number, path: string): Promise<FileEntry | undefined>;
  createFile(file: InsertFileEntry): Promise<FileEntry>;
  updateFile(id: number, updates: Partial<FileEntry>): Promise<FileEntry | undefined>;
  deleteFile(id: number): Promise<void>;

  // Players
  getPlayersByServer(serverId: number): Promise<Player[]>;
  getPlayer(id: number): Promise<Player | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: number, updates: Partial<Player>): Promise<Player | undefined>;
  deletePlayer(id: number): Promise<void>;

  // Worlds
  getWorldsByServer(serverId: number): Promise<World[]>;
  createWorld(world: InsertWorld): Promise<World>;
  deleteWorld(id: number): Promise<void>;

  // Backups
  getBackupsByServer(serverId: number): Promise<Backup[]>;
  createBackup(backup: InsertBackup): Promise<Backup>;
  deleteBackup(id: number): Promise<void>;

  // Software versions
  getSoftwareVersions(software?: string): Promise<SoftwareVersion[]>;

  // Server access
  getServerAccess(serverId: number): Promise<ServerAccess[]>;
  setServerAccess(access: InsertServerAccess): Promise<ServerAccess>;
  deleteServerAccess(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private servers: Map<number, Server> = new Map();
  private modpacks: Map<number, Modpack> = new Map();
  private mods: Map<number, Mod> = new Map();
  private serverLogs: Map<number, ServerLog[]> = new Map();
  private fileEntries: Map<number, FileEntry> = new Map();
  private players: Map<number, Player> = new Map();
  private worlds: Map<number, World> = new Map();
  private backups: Map<number, Backup> = new Map();
  private softwareVersions: Map<number, SoftwareVersion> = new Map();
  private serverAccessEntries: Map<number, ServerAccess> = new Map();
  private nextId = {
    users: 1, servers: 1, modpacks: 1, mods: 1, logs: 1, files: 1,
    players: 1, worlds: 1, backups: 1, softwareVersions: 1, serverAccess: 1,
  };

  constructor() {
    this.seed();
  }

  private async seed() {
    // Create admin user
    const hashedPw = await bcrypt.hash("admin123", 10);
    const admin: User = {
      id: this.nextId.users++,
      username: "admin",
      email: "admin@craftpanel.local",
      password: hashedPw,
      role: "admin",
      createdAt: new Date(),
    };
    this.users.set(admin.id, admin);

    // Default server config fields
    const defaultServerConfig = {
      difficulty: "normal",
      gamemode: "survival",
      hardcore: false,
      pvp: true,
      onlineMode: true,
      whitelistEnabled: false,
      commandBlocksEnabled: false,
      flightEnabled: false,
      spawnProtection: 16,
      viewDistance: 10,
      simulationDistance: 10,
      spawnAnimals: true,
      spawnMonsters: true,
      spawnNpcs: true,
      generateStructures: true,
      allowNether: true,
      levelType: "minecraft:normal",
      levelSeed: "",
      maxTickTime: 60000,
      networkCompressionThreshold: 256,
      entityBroadcastRangePercentage: 100,
      playerIdleTimeout: 0,
      syncChunkWrites: true,
      enableRcon: false,
      rconPort: 25575,
      rconPassword: "",
      enableQuery: false,
      queryPort: 25565,
      jvmArgs: "-XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200",
      eulaAccepted: false,
      forceGamemode: false,
      announcePlayerAchievements: true,
      resourcePack: "",
      resourcePackSha1: "",
      requireResourcePack: false,
    };

    // Seed sample servers
    const s1: Server = {
      id: this.nextId.servers++,
      name: "Survival World",
      type: "paper",
      version: "1.21.4",
      port: 25565,
      maxRam: "4G",
      minRam: "1G",
      status: "stopped",
      maxPlayers: 20,
      motd: "Welcome to Survival World!",
      onlinePlayers: 0,
      createdAt: new Date(),
      lastStarted: null,
      containerId: null,
      modpackId: null,
      ...defaultServerConfig,
    };
    this.servers.set(s1.id, s1);

    const s2: Server = {
      id: this.nextId.servers++,
      name: "Creative Hub",
      type: "vanilla",
      version: "1.21.4",
      port: 25566,
      maxRam: "2G",
      minRam: "512M",
      status: "stopped",
      maxPlayers: 10,
      motd: "Creative mode fun!",
      onlinePlayers: 0,
      createdAt: new Date(),
      lastStarted: null,
      containerId: null,
      modpackId: null,
      ...defaultServerConfig,
      gamemode: "creative",
    };
    this.servers.set(s2.id, s2);

    // Seed sample modpack
    const mp: Modpack = {
      id: this.nextId.modpacks++,
      name: "All The Mods 9",
      description: "All The Mods 9 for Minecraft 1.21",
      version: "0.4.3",
      mcVersion: "1.21.1",
      loader: "neoforge",
      filename: "atm9-0.4.3.zip",
      fileSize: 52428800,
      createdAt: new Date(),
      modCount: 347,
    };
    this.modpacks.set(mp.id, mp);

    // Seed mods for modpack
    const sampleMods = [
      { name: "JEI (Just Enough Items)", filename: "jei-1.21.1-19.2.0.jar", version: "19.2.0" },
      { name: "Applied Energistics 2", filename: "ae2-19.0.15-alpha.jar", version: "19.0.15" },
      { name: "Thermal Expansion", filename: "thermal_expansion-11.0.jar", version: "11.0" },
      { name: "Create", filename: "create-0.5.1.jar", version: "0.5.1" },
      { name: "Iron Chests", filename: "ironchests-14.4.4.jar", version: "14.4.4" },
    ];
    for (const m of sampleMods) {
      const mod: Mod = {
        id: this.nextId.mods++,
        modpackId: mp.id,
        name: m.name,
        filename: m.filename,
        fileSize: Math.floor(Math.random() * 5000000) + 100000,
        version: m.version,
        source: "manual",
      };
      this.mods.set(mod.id, mod);
    }

    // Seed server files for server 1
    const serverFiles: InsertFileEntry[] = [
      { serverId: 1, path: "/", name: "server.properties", isDirectory: false, content: `#Minecraft server properties\nserver-port=25565\nmax-players=20\nonline-mode=true\ndifficulty=normal\ngamemode=survival\nlevel-name=world\nmotd=Welcome to Survival World!\nview-distance=10\nsimulation-distance=10\nspawn-protection=16\nwhite-list=false\nenable-command-block=false\n`, size: 420 },
      { serverId: 1, path: "/", name: "ops.json", isDirectory: false, content: `[]`, size: 2 },
      { serverId: 1, path: "/", name: "whitelist.json", isDirectory: false, content: `[]`, size: 2 },
      { serverId: 1, path: "/", name: "banned-players.json", isDirectory: false, content: `[]`, size: 2 },
      { serverId: 1, path: "/", name: "world", isDirectory: true, content: null, size: 0 },
      { serverId: 1, path: "/world", name: "level.dat", isDirectory: false, content: null, size: 8192 },
      { serverId: 1, path: "/", name: "logs", isDirectory: true, content: null, size: 0 },
      { serverId: 1, path: "/logs", name: "latest.log", isDirectory: false, content: `[00:00:01 INFO]: Starting minecraft server version 1.21.4\n[00:00:02 INFO]: Loading properties\n[00:00:03 INFO]: Default game type: SURVIVAL\n[00:00:04 INFO]: Preparing level "world"\n[00:00:08 INFO]: Done! For help, type "help"\n`, size: 1024 },
      { serverId: 1, path: "/", name: "plugins", isDirectory: true, content: null, size: 0 },
    ];
    for (const f of serverFiles) {
      const entry: FileEntry = {
        id: this.nextId.files++,
        serverId: f.serverId,
        path: f.path,
        name: f.name,
        isDirectory: f.isDirectory ?? false,
        content: f.content ?? null,
        size: f.size ?? 0,
        updatedAt: new Date(),
      };
      this.fileEntries.set(entry.id, entry);
    }

    // Seed logs for server 1
    const logMessages = [
      { level: "info", message: "[00:00:01 INFO]: Starting minecraft server version 1.21.4" },
      { level: "info", message: "[00:00:02 INFO]: Loading properties" },
      { level: "info", message: "[00:00:03 INFO]: Default game type: SURVIVAL" },
      { level: "warn", message: "[00:00:03 WARN]: **** SERVER IS RUNNING IN OFFLINE/INSECURE MODE!" },
      { level: "info", message: "[00:00:04 INFO]: Preparing level \"world\"" },
      { level: "info", message: "[00:00:08 INFO]: Done! For help, type \"help\"" },
      { level: "info", message: "[00:05:22 INFO]: Player Steve joined the game" },
      { level: "info", message: "[00:10:14 INFO]: Player Steve left the game" },
    ];
    const logs: ServerLog[] = logMessages.map(l => ({
      id: this.nextId.logs++,
      serverId: 1,
      message: l.message,
      level: l.level,
      timestamp: new Date(Date.now() - Math.random() * 86400000),
    }));
    this.serverLogs.set(1, logs);

    // Seed sample players for server 1
    const samplePlayers: Player[] = [
      {
        id: this.nextId.players++,
        serverId: 1,
        username: "Steve",
        uuid: "8667ba71-b85a-4004-af54-457a9734eed7",
        isOp: true,
        isBanned: false,
        isWhitelisted: true,
        banReason: null,
        lastSeen: new Date(Date.now() - 3600000),
        firstJoined: new Date(Date.now() - 86400000 * 30),
        playtime: 360000,
      },
      {
        id: this.nextId.players++,
        serverId: 1,
        username: "Alex",
        uuid: "6ab43178-89fd-4905-97f6-0f67d88fb609",
        isOp: false,
        isBanned: false,
        isWhitelisted: true,
        banReason: null,
        lastSeen: new Date(Date.now() - 7200000),
        firstJoined: new Date(Date.now() - 86400000 * 20),
        playtime: 180000,
      },
      {
        id: this.nextId.players++,
        serverId: 1,
        username: "Notch",
        uuid: "069a79f4-44e9-4726-a5be-fca90e38aaf5",
        isOp: false,
        isBanned: true,
        isWhitelisted: false,
        banReason: "Grief",
        lastSeen: new Date(Date.now() - 86400000 * 7),
        firstJoined: new Date(Date.now() - 86400000 * 60),
        playtime: 72000,
      },
    ];
    for (const p of samplePlayers) {
      this.players.set(p.id, p);
    }

    // Seed sample worlds for server 1
    const sampleWorlds: World[] = [
      {
        id: this.nextId.worlds++,
        serverId: 1,
        name: "world",
        type: "overworld",
        seed: "-1234567890",
        size: 524288000,
        lastBackup: new Date(Date.now() - 86400000),
        isActive: true,
      },
      {
        id: this.nextId.worlds++,
        serverId: 1,
        name: "world_nether",
        type: "nether",
        seed: "-1234567890",
        size: 104857600,
        lastBackup: new Date(Date.now() - 86400000),
        isActive: true,
      },
      {
        id: this.nextId.worlds++,
        serverId: 1,
        name: "world_the_end",
        type: "the_end",
        seed: "-1234567890",
        size: 52428800,
        lastBackup: null,
        isActive: true,
      },
    ];
    for (const w of sampleWorlds) {
      this.worlds.set(w.id, w);
    }

    // Seed sample backup for server 1
    const sampleBackup: Backup = {
      id: this.nextId.backups++,
      serverId: 1,
      name: "Backup 2026-03-17",
      size: 681574400,
      type: "scheduled",
      status: "complete",
      createdAt: new Date(Date.now() - 86400000),
      notes: null,
    };
    this.backups.set(sampleBackup.id, sampleBackup);

    // Seed software versions
    const versions: SoftwareVersion[] = [
      {
        id: this.nextId.softwareVersions++,
        software: "paper",
        version: "1.21.4-R0.1",
        mcVersion: "1.21.4",
        downloadUrl: "https://api.papermc.io/v2/projects/paper/versions/1.21.4/builds/1/downloads/paper-1.21.4-1.jar",
        isLatest: true,
        releasedAt: new Date("2025-12-01"),
      },
      {
        id: this.nextId.softwareVersions++,
        software: "vanilla",
        version: "1.21.4",
        mcVersion: "1.21.4",
        downloadUrl: null,
        isLatest: true,
        releasedAt: new Date("2025-12-01"),
      },
      {
        id: this.nextId.softwareVersions++,
        software: "forge",
        version: "49.0.19",
        mcVersion: "1.21.4",
        downloadUrl: null,
        isLatest: true,
        releasedAt: new Date("2025-12-01"),
      },
      {
        id: this.nextId.softwareVersions++,
        software: "fabric",
        version: "0.16.9",
        mcVersion: "1.21.4",
        downloadUrl: null,
        isLatest: true,
        releasedAt: new Date("2025-12-01"),
      },
      {
        id: this.nextId.softwareVersions++,
        software: "paper",
        version: "1.20.6-R0.1",
        mcVersion: "1.20.6",
        downloadUrl: "https://api.papermc.io/v2/projects/paper/versions/1.20.6/builds/1/downloads/paper-1.20.6-1.jar",
        isLatest: false,
        releasedAt: new Date("2024-06-01"),
      },
    ];
    for (const v of versions) {
      this.softwareVersions.set(v.id, v);
    }
  }

  // Users
  async getUser(id: number) { return this.users.get(id); }
  async getUserByUsername(username: string) {
    return [...this.users.values()].find(u => u.username.toLowerCase() === username.toLowerCase());
  }
  async getUserByEmail(email: string) {
    return [...this.users.values()].find(u => u.email.toLowerCase() === email.toLowerCase());
  }
  async getAllUsers() { return [...this.users.values()]; }
  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: this.nextId.users++,
      username: user.username,
      email: user.email,
      password: user.password,
      role: user.role ?? "viewer",
      createdAt: new Date(),
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }
  async updateUser(id: number, updates: Partial<InsertUser>) {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }
  async deleteUser(id: number) { this.users.delete(id); }

  // Servers
  async getServer(id: number) { return this.servers.get(id); }
  async getAllServers() { return [...this.servers.values()]; }
  async createServer(server: InsertServer): Promise<Server> {
    const newServer: Server = {
      id: this.nextId.servers++,
      name: server.name,
      type: server.type,
      version: server.version,
      port: server.port,
      maxRam: server.maxRam ?? "2G",
      minRam: server.minRam ?? "1G",
      status: "stopped",
      maxPlayers: server.maxPlayers ?? 20,
      motd: server.motd ?? "A Minecraft Server",
      onlinePlayers: 0,
      createdAt: new Date(),
      lastStarted: null,
      containerId: null,
      modpackId: server.modpackId ?? null,
      difficulty: server.difficulty ?? "normal",
      gamemode: server.gamemode ?? "survival",
      hardcore: server.hardcore ?? false,
      pvp: server.pvp ?? true,
      onlineMode: server.onlineMode ?? true,
      whitelistEnabled: server.whitelistEnabled ?? false,
      commandBlocksEnabled: server.commandBlocksEnabled ?? false,
      flightEnabled: server.flightEnabled ?? false,
      spawnProtection: server.spawnProtection ?? 16,
      viewDistance: server.viewDistance ?? 10,
      simulationDistance: server.simulationDistance ?? 10,
      spawnAnimals: server.spawnAnimals ?? true,
      spawnMonsters: server.spawnMonsters ?? true,
      spawnNpcs: server.spawnNpcs ?? true,
      generateStructures: server.generateStructures ?? true,
      allowNether: server.allowNether ?? true,
      levelType: server.levelType ?? "minecraft:normal",
      levelSeed: server.levelSeed ?? "",
      maxTickTime: server.maxTickTime ?? 60000,
      networkCompressionThreshold: server.networkCompressionThreshold ?? 256,
      entityBroadcastRangePercentage: server.entityBroadcastRangePercentage ?? 100,
      playerIdleTimeout: server.playerIdleTimeout ?? 0,
      syncChunkWrites: server.syncChunkWrites ?? true,
      enableRcon: server.enableRcon ?? false,
      rconPort: server.rconPort ?? 25575,
      rconPassword: server.rconPassword ?? "",
      enableQuery: server.enableQuery ?? false,
      queryPort: server.queryPort ?? 25565,
      jvmArgs: server.jvmArgs ?? "-XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200",
      eulaAccepted: server.eulaAccepted ?? false,
      forceGamemode: server.forceGamemode ?? false,
      announcePlayerAchievements: server.announcePlayerAchievements ?? true,
      resourcePack: server.resourcePack ?? "",
      resourcePackSha1: server.resourcePackSha1 ?? "",
      requireResourcePack: server.requireResourcePack ?? false,
    };
    this.servers.set(newServer.id, newServer);
    // Create default server.properties
    const propsFile: FileEntry = {
      id: this.nextId.files++,
      serverId: newServer.id,
      path: "/",
      name: "server.properties",
      isDirectory: false,
      content: `#Minecraft server properties\nserver-port=${server.port}\nmax-players=${server.maxPlayers}\nonline-mode=true\ndifficulty=normal\ngamemode=survival\nlevel-name=world\nmotd=${server.motd}\nview-distance=10\nsimulation-distance=10\nspawn-protection=16\nwhite-list=false\nenable-command-block=false\n`,
      size: 420,
      updatedAt: new Date(),
    };
    this.fileEntries.set(propsFile.id, propsFile);
    const opsFile: FileEntry = { id: this.nextId.files++, serverId: newServer.id, path: "/", name: "ops.json", isDirectory: false, content: "[]", size: 2, updatedAt: new Date() };
    this.fileEntries.set(opsFile.id, opsFile);
    const logsDir: FileEntry = { id: this.nextId.files++, serverId: newServer.id, path: "/", name: "logs", isDirectory: true, content: null, size: 0, updatedAt: new Date() };
    this.fileEntries.set(logsDir.id, logsDir);
    return newServer;
  }
  async updateServer(id: number, updates: Partial<Server>) {
    const server = this.servers.get(id);
    if (!server) return undefined;
    const updated = { ...server, ...updates };
    this.servers.set(id, updated);
    return updated;
  }
  async deleteServer(id: number) {
    this.servers.delete(id);
    // Clean up files
    for (const [fid, f] of this.fileEntries) {
      if (f.serverId === id) this.fileEntries.delete(fid);
    }
    this.serverLogs.delete(id);
    // Clean up players, worlds, backups, access
    for (const [pid, p] of this.players) {
      if (p.serverId === id) this.players.delete(pid);
    }
    for (const [wid, w] of this.worlds) {
      if (w.serverId === id) this.worlds.delete(wid);
    }
    for (const [bid, b] of this.backups) {
      if (b.serverId === id) this.backups.delete(bid);
    }
    for (const [aid, a] of this.serverAccessEntries) {
      if (a.serverId === id) this.serverAccessEntries.delete(aid);
    }
  }

  // Modpacks
  async getModpack(id: number) { return this.modpacks.get(id); }
  async getAllModpacks() { return [...this.modpacks.values()]; }
  async createModpack(modpack: InsertModpack): Promise<Modpack> {
    const newPack: Modpack = {
      id: this.nextId.modpacks++,
      name: modpack.name,
      description: modpack.description ?? "",
      version: modpack.version,
      mcVersion: modpack.mcVersion,
      loader: modpack.loader,
      filename: null,
      fileSize: null,
      createdAt: new Date(),
      modCount: modpack.modCount ?? 0,
    };
    this.modpacks.set(newPack.id, newPack);
    return newPack;
  }
  async updateModpack(id: number, updates: Partial<Modpack>) {
    const mp = this.modpacks.get(id);
    if (!mp) return undefined;
    const updated = { ...mp, ...updates };
    this.modpacks.set(id, updated);
    return updated;
  }
  async deleteModpack(id: number) {
    this.modpacks.delete(id);
    for (const [mid, m] of this.mods) {
      if (m.modpackId === id) this.mods.delete(mid);
    }
  }

  // Mods
  async getMod(id: number) { return this.mods.get(id); }
  async getModsByModpack(modpackId: number) {
    return [...this.mods.values()].filter(m => m.modpackId === modpackId);
  }
  async createMod(mod: InsertMod): Promise<Mod> {
    const newMod: Mod = {
      id: this.nextId.mods++,
      modpackId: mod.modpackId,
      name: mod.name,
      filename: mod.filename,
      fileSize: mod.fileSize ?? 0,
      version: mod.version ?? "",
      source: mod.source ?? "manual",
    };
    this.mods.set(newMod.id, newMod);
    // Update mod count
    const mp = this.modpacks.get(mod.modpackId);
    if (mp) {
      const count = (await this.getModsByModpack(mod.modpackId)).length;
      this.modpacks.set(mp.id, { ...mp, modCount: count });
    }
    return newMod;
  }
  async deleteMod(id: number) {
    const mod = this.mods.get(id);
    if (mod) {
      this.mods.delete(id);
      const mp = this.modpacks.get(mod.modpackId);
      if (mp) {
        const count = (await this.getModsByModpack(mod.modpackId)).length;
        this.modpacks.set(mp.id, { ...mp, modCount: count });
      }
    }
  }

  // Logs
  async getServerLogs(serverId: number, limit = 100) {
    const logs = this.serverLogs.get(serverId) || [];
    return logs.slice(-limit);
  }
  async addServerLog(log: InsertServerLog): Promise<ServerLog> {
    const newLog: ServerLog = {
      id: this.nextId.logs++,
      serverId: log.serverId,
      message: log.message,
      level: log.level ?? "info",
      timestamp: new Date(),
    };
    const logs = this.serverLogs.get(log.serverId) || [];
    logs.push(newLog);
    // Keep max 500 logs per server
    if (logs.length > 500) logs.shift();
    this.serverLogs.set(log.serverId, logs);
    return newLog;
  }
  async clearServerLogs(serverId: number) { this.serverLogs.set(serverId, []); }

  // Files
  async getFilesByServer(serverId: number, dirPath: string) {
    return [...this.fileEntries.values()].filter(
      f => f.serverId === serverId && f.path === dirPath
    );
  }
  async getFile(id: number) { return this.fileEntries.get(id); }
  async getFileByPath(serverId: number, path: string) {
    return [...this.fileEntries.values()].find(
      f => f.serverId === serverId && f.path + f.name === path
    );
  }
  async createFile(file: InsertFileEntry): Promise<FileEntry> {
    const newFile: FileEntry = {
      id: this.nextId.files++,
      serverId: file.serverId,
      path: file.path,
      name: file.name,
      isDirectory: file.isDirectory ?? false,
      content: file.content ?? null,
      size: file.size ?? 0,
      updatedAt: new Date(),
    };
    this.fileEntries.set(newFile.id, newFile);
    return newFile;
  }
  async updateFile(id: number, updates: Partial<FileEntry>) {
    const file = this.fileEntries.get(id);
    if (!file) return undefined;
    const updated = { ...file, ...updates, updatedAt: new Date() };
    this.fileEntries.set(id, updated);
    return updated;
  }
  async deleteFile(id: number) { this.fileEntries.delete(id); }

  // Players
  async getPlayersByServer(serverId: number) {
    return [...this.players.values()].filter(p => p.serverId === serverId);
  }
  async getPlayer(id: number) { return this.players.get(id); }
  async createPlayer(player: InsertPlayer): Promise<Player> {
    const newPlayer: Player = {
      id: this.nextId.players++,
      serverId: player.serverId,
      username: player.username,
      uuid: player.uuid,
      isOp: player.isOp ?? false,
      isBanned: player.isBanned ?? false,
      isWhitelisted: player.isWhitelisted ?? false,
      banReason: player.banReason ?? null,
      lastSeen: player.lastSeen ?? null,
      firstJoined: new Date(),
      playtime: player.playtime ?? 0,
    };
    this.players.set(newPlayer.id, newPlayer);
    return newPlayer;
  }
  async updatePlayer(id: number, updates: Partial<Player>) {
    const player = this.players.get(id);
    if (!player) return undefined;
    const updated = { ...player, ...updates };
    this.players.set(id, updated);
    return updated;
  }
  async deletePlayer(id: number) { this.players.delete(id); }

  // Worlds
  async getWorldsByServer(serverId: number) {
    return [...this.worlds.values()].filter(w => w.serverId === serverId);
  }
  async createWorld(world: InsertWorld): Promise<World> {
    const newWorld: World = {
      id: this.nextId.worlds++,
      serverId: world.serverId,
      name: world.name,
      type: world.type ?? "overworld",
      seed: world.seed ?? "",
      size: world.size ?? 0,
      lastBackup: world.lastBackup ?? null,
      isActive: world.isActive ?? true,
    };
    this.worlds.set(newWorld.id, newWorld);
    return newWorld;
  }
  async deleteWorld(id: number) { this.worlds.delete(id); }

  // Backups
  async getBackupsByServer(serverId: number) {
    return [...this.backups.values()].filter(b => b.serverId === serverId);
  }
  async createBackup(backup: InsertBackup): Promise<Backup> {
    const newBackup: Backup = {
      id: this.nextId.backups++,
      serverId: backup.serverId,
      name: backup.name,
      size: backup.size ?? 0,
      type: backup.type ?? "manual",
      status: backup.status ?? "complete",
      createdAt: new Date(),
      notes: backup.notes ?? null,
    };
    this.backups.set(newBackup.id, newBackup);
    return newBackup;
  }
  async deleteBackup(id: number) { this.backups.delete(id); }

  // Software versions
  async getSoftwareVersions(software?: string) {
    const all = [...this.softwareVersions.values()];
    if (software) return all.filter(v => v.software === software);
    return all;
  }

  // Server access
  async getServerAccess(serverId: number) {
    return [...this.serverAccessEntries.values()].filter(a => a.serverId === serverId);
  }
  async setServerAccess(access: InsertServerAccess): Promise<ServerAccess> {
    const newAccess: ServerAccess = {
      id: this.nextId.serverAccess++,
      serverId: access.serverId,
      userId: access.userId,
      permission: access.permission ?? "viewer",
      grantedAt: new Date(),
      grantedBy: access.grantedBy ?? null,
    };
    this.serverAccessEntries.set(newAccess.id, newAccess);
    return newAccess;
  }
  async deleteServerAccess(id: number) { this.serverAccessEntries.delete(id); }
}

export const storage = new MemStorage();
