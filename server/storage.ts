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
import { Pool } from "pg";

type StorageSnapshot = {
  users: User[];
  servers: Server[];
  modpacks: Modpack[];
  mods: Mod[];
  serverLogs: Record<string, ServerLog[]>;
  fileEntries: FileEntry[];
  players: Player[];
  worlds: World[];
  backups: Backup[];
  serverAccessEntries: ServerAccess[];
  nextId: MemStorage["nextId"];
};

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUserCount(): Promise<number>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
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
  protected users: Map<number, User> = new Map();
  protected servers: Map<number, Server> = new Map();
  protected modpacks: Map<number, Modpack> = new Map();
  protected mods: Map<number, Mod> = new Map();
  protected serverLogs: Map<number, ServerLog[]> = new Map();
  protected fileEntries: Map<number, FileEntry> = new Map();
  protected players: Map<number, Player> = new Map();
  protected worlds: Map<number, World> = new Map();
  protected backups: Map<number, Backup> = new Map();
  protected softwareVersions: Map<number, SoftwareVersion> = new Map();
  protected serverAccessEntries: Map<number, ServerAccess> = new Map();
  protected nextId = {
    users: 1, servers: 1, modpacks: 1, mods: 1, logs: 1, files: 1,
    players: 1, worlds: 1, backups: 1, softwareVersions: 1, serverAccess: 1,
  };

  constructor() {
    this.seed();
  }

  private seed() {
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

  protected serializeState(): StorageSnapshot {
    return {
      users: [...this.users.values()],
      servers: [...this.servers.values()],
      modpacks: [...this.modpacks.values()],
      mods: [...this.mods.values()],
      serverLogs: Object.fromEntries(
        [...this.serverLogs.entries()].map(([serverId, logs]) => [String(serverId), logs]),
      ),
      fileEntries: [...this.fileEntries.values()],
      players: [...this.players.values()],
      worlds: [...this.worlds.values()],
      backups: [...this.backups.values()],
      serverAccessEntries: [...this.serverAccessEntries.values()],
      nextId: this.nextId,
    };
  }

  protected hydrateState(snapshot: StorageSnapshot) {
    this.users = new Map(snapshot.users.map(user => [user.id, {
      ...user,
      createdAt: new Date(user.createdAt),
    }]));
    this.servers = new Map(snapshot.servers.map(server => [server.id, {
      ...server,
      createdAt: new Date(server.createdAt),
      lastStarted: server.lastStarted ? new Date(server.lastStarted) : null,
    }]));
    this.modpacks = new Map(snapshot.modpacks.map(modpack => [modpack.id, {
      ...modpack,
      createdAt: new Date(modpack.createdAt),
    }]));
    this.mods = new Map(snapshot.mods.map(mod => [mod.id, mod]));
    this.serverLogs = new Map(
      Object.entries(snapshot.serverLogs || {}).map(([serverId, logs]) => [
        Number(serverId),
        logs.map(log => ({ ...log, timestamp: new Date(log.timestamp) })),
      ]),
    );
    this.fileEntries = new Map(snapshot.fileEntries.map(file => [file.id, {
      ...file,
      updatedAt: new Date(file.updatedAt),
    }]));
    this.players = new Map(snapshot.players.map(player => [player.id, {
      ...player,
      lastSeen: player.lastSeen ? new Date(player.lastSeen) : null,
      firstJoined: player.firstJoined ? new Date(player.firstJoined) : null,
    }]));
    this.worlds = new Map(snapshot.worlds.map(world => [world.id, {
      ...world,
      lastBackup: world.lastBackup ? new Date(world.lastBackup) : null,
    }]));
    this.backups = new Map(snapshot.backups.map(backup => [backup.id, {
      ...backup,
      createdAt: new Date(backup.createdAt),
    }]));
    this.serverAccessEntries = new Map(snapshot.serverAccessEntries.map(access => [access.id, {
      ...access,
      grantedAt: new Date(access.grantedAt),
    }]));
    this.nextId = snapshot.nextId;
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
  async getUserCount() { return this.users.size; }
  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: this.nextId.users++,
      username: user.username,
      email: user.email,
      password: user.password,
      role: user.role ?? "viewer",
      requiresPasswordChange: false,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      createdAt: new Date(),
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }
  async updateUser(id: number, updates: Partial<User>) {
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

class PostgresBackedStorage extends MemStorage {
  public readonly ready: Promise<void>;
  private readonly pool: Pool;

  constructor(databaseUrl: string) {
    super();
    this.pool = new Pool({ connectionString: databaseUrl });
    this.ready = this.initialize();
  }

  private async initialize() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS orbitmc_state (
        id integer PRIMARY KEY,
        payload jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const result = await this.pool.query<{ payload: StorageSnapshot }>(
      "SELECT payload FROM orbitmc_state WHERE id = 1",
    );
    if (result.rows[0]?.payload) {
      this.hydrateState(result.rows[0].payload);
    } else {
      await this.persist();
    }
  }

  private async persist() {
    await this.pool.query(
      `INSERT INTO orbitmc_state (id, payload, updated_at)
       VALUES (1, $1::jsonb, now())
       ON CONFLICT (id)
       DO UPDATE SET payload = EXCLUDED.payload, updated_at = now()`,
      [JSON.stringify(this.serializeState())],
    );
  }

  private async afterMutation<T>(value: T): Promise<T> {
    await this.persist();
    return value;
  }

  async createUser(user: InsertUser): Promise<User> {
    return this.afterMutation(await super.createUser(user));
  }
  async updateUser(id: number, updates: Partial<User>) {
    return this.afterMutation(await super.updateUser(id, updates));
  }
  async deleteUser(id: number) {
    await super.deleteUser(id);
    await this.persist();
  }
  async createServer(server: InsertServer): Promise<Server> {
    return this.afterMutation(await super.createServer(server));
  }
  async updateServer(id: number, updates: Partial<Server>) {
    return this.afterMutation(await super.updateServer(id, updates));
  }
  async deleteServer(id: number) {
    await super.deleteServer(id);
    await this.persist();
  }
  async createModpack(modpack: InsertModpack): Promise<Modpack> {
    return this.afterMutation(await super.createModpack(modpack));
  }
  async updateModpack(id: number, updates: Partial<Modpack>) {
    return this.afterMutation(await super.updateModpack(id, updates));
  }
  async deleteModpack(id: number) {
    await super.deleteModpack(id);
    await this.persist();
  }
  async createMod(mod: InsertMod): Promise<Mod> {
    return this.afterMutation(await super.createMod(mod));
  }
  async deleteMod(id: number) {
    await super.deleteMod(id);
    await this.persist();
  }
  async addServerLog(log: InsertServerLog): Promise<ServerLog> {
    return this.afterMutation(await super.addServerLog(log));
  }
  async clearServerLogs(serverId: number) {
    await super.clearServerLogs(serverId);
    await this.persist();
  }
  async createFile(file: InsertFileEntry): Promise<FileEntry> {
    return this.afterMutation(await super.createFile(file));
  }
  async updateFile(id: number, updates: Partial<FileEntry>) {
    return this.afterMutation(await super.updateFile(id, updates));
  }
  async deleteFile(id: number) {
    await super.deleteFile(id);
    await this.persist();
  }
  async createPlayer(player: InsertPlayer): Promise<Player> {
    return this.afterMutation(await super.createPlayer(player));
  }
  async updatePlayer(id: number, updates: Partial<Player>) {
    return this.afterMutation(await super.updatePlayer(id, updates));
  }
  async deletePlayer(id: number) {
    await super.deletePlayer(id);
    await this.persist();
  }
  async createWorld(world: InsertWorld): Promise<World> {
    return this.afterMutation(await super.createWorld(world));
  }
  async deleteWorld(id: number) {
    await super.deleteWorld(id);
    await this.persist();
  }
  async createBackup(backup: InsertBackup): Promise<Backup> {
    return this.afterMutation(await super.createBackup(backup));
  }
  async deleteBackup(id: number) {
    await super.deleteBackup(id);
    await this.persist();
  }
  async setServerAccess(access: InsertServerAccess): Promise<ServerAccess> {
    return this.afterMutation(await super.setServerAccess(access));
  }
  async deleteServerAccess(id: number) {
    await super.deleteServerAccess(id);
    await this.persist();
  }
}

const databaseUrl = process.env.DATABASE_URL;
export const storage = databaseUrl ? new PostgresBackedStorage(databaseUrl) : new MemStorage();
export const storageReady = storage instanceof PostgresBackedStorage ? storage.ready : Promise.resolve();
