import { pgTable, text, integer, boolean, timestamp, serial, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("viewer"), // admin | operator | viewer
  requiresPasswordChange: boolean("requires_password_change").notNull().default(false),
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  twoFactorSecret: text("two_factor_secret"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  requiresPasswordChange: true,
  twoFactorEnabled: true,
  twoFactorSecret: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Minecraft Servers table
export const servers = pgTable("servers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // vanilla | forge | fabric | paper | spigot | modded
  version: text("version").notNull(),
  port: integer("port").notNull(),
  maxRam: text("max_ram").notNull().default("2G"),
  minRam: text("min_ram").notNull().default("1G"),
  status: text("status").notNull().default("stopped"), // running | stopped | starting | stopping | error
  maxPlayers: integer("max_players").notNull().default(20),
  motd: text("motd").notNull().default("A Minecraft Server"),
  onlinePlayers: integer("online_players").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastStarted: timestamp("last_started"),
  containerId: text("container_id"),
  modpackId: integer("modpack_id"),
  // Server properties fields
  difficulty: text("difficulty").notNull().default("normal"), // peaceful | easy | normal | hard
  gamemode: text("gamemode").notNull().default("survival"), // survival | creative | adventure | spectator
  hardcore: boolean("hardcore").notNull().default(false),
  pvp: boolean("pvp").notNull().default(true),
  onlineMode: boolean("online_mode").notNull().default(true),
  whitelistEnabled: boolean("whitelist_enabled").notNull().default(false),
  commandBlocksEnabled: boolean("command_blocks_enabled").notNull().default(false),
  flightEnabled: boolean("flight_enabled").notNull().default(false),
  spawnProtection: integer("spawn_protection").notNull().default(16),
  viewDistance: integer("view_distance").notNull().default(10),
  simulationDistance: integer("simulation_distance").notNull().default(10),
  spawnAnimals: boolean("spawn_animals").notNull().default(true),
  spawnMonsters: boolean("spawn_monsters").notNull().default(true),
  spawnNpcs: boolean("spawn_npcs").notNull().default(true),
  generateStructures: boolean("generate_structures").notNull().default(true),
  allowNether: boolean("allow_nether").notNull().default(true),
  levelType: text("level_type").notNull().default("minecraft:normal"), // minecraft:normal | minecraft:flat | minecraft:large_biomes | minecraft:amplified | minecraft:single_biome_surface
  levelSeed: text("level_seed").notNull().default(""),
  maxTickTime: integer("max_tick_time").notNull().default(60000),
  networkCompressionThreshold: integer("network_compression_threshold").notNull().default(256),
  entityBroadcastRangePercentage: integer("entity_broadcast_range_percentage").notNull().default(100),
  playerIdleTimeout: integer("player_idle_timeout").notNull().default(0),
  syncChunkWrites: boolean("sync_chunk_writes").notNull().default(true),
  enableRcon: boolean("enable_rcon").notNull().default(false),
  rconPort: integer("rcon_port").notNull().default(25575),
  rconPassword: text("rcon_password").notNull().default(""),
  enableQuery: boolean("enable_query").notNull().default(false),
  queryPort: integer("query_port").notNull().default(25565),
  jvmArgs: text("jvm_args").notNull().default("-XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200"),
  eulaAccepted: boolean("eula_accepted").notNull().default(false),
  forceGamemode: boolean("force_gamemode").notNull().default(false),
  announcePlayerAchievements: boolean("announce_player_achievements").notNull().default(true),
  resourcePack: text("resource_pack").notNull().default(""),
  resourcePackSha1: text("resource_pack_sha1").notNull().default(""),
  requireResourcePack: boolean("require_resource_pack").notNull().default(false),
});

export const insertServerSchema = createInsertSchema(servers).omit({
  id: true,
  createdAt: true,
  status: true,
  onlinePlayers: true,
  containerId: true,
  lastStarted: true,
});
export type InsertServer = z.infer<typeof insertServerSchema>;
export type Server = typeof servers.$inferSelect;

// Modpacks table
export const modpacks = pgTable("modpacks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  version: text("version").notNull(),
  mcVersion: text("mc_version").notNull(),
  loader: text("loader").notNull(), // forge | fabric | quilt | neoforge
  filename: text("filename"),
  fileSize: integer("file_size"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  modCount: integer("mod_count").notNull().default(0),
});

export const insertModpackSchema = createInsertSchema(modpacks).omit({ id: true, createdAt: true, fileSize: true, filename: true });
export type InsertModpack = z.infer<typeof insertModpackSchema>;
export type Modpack = typeof modpacks.$inferSelect;

// Mods table (mods within a modpack)
export const mods = pgTable("mods", {
  id: serial("id").primaryKey(),
  modpackId: integer("modpack_id").notNull(),
  name: text("name").notNull(),
  filename: text("filename").notNull(),
  fileSize: integer("file_size").notNull().default(0),
  version: text("version").notNull().default(""),
  source: text("source").notNull().default("manual"), // manual | curseforge | modrinth
});

export const insertModSchema = createInsertSchema(mods).omit({ id: true });
export type InsertMod = z.infer<typeof insertModSchema>;
export type Mod = typeof mods.$inferSelect;

// Server logs table
export const serverLogs = pgTable("server_logs", {
  id: serial("id").primaryKey(),
  serverId: integer("server_id").notNull(),
  message: text("message").notNull(),
  level: text("level").notNull().default("info"), // info | warn | error
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertServerLogSchema = createInsertSchema(serverLogs).omit({ id: true, timestamp: true });
export type InsertServerLog = z.infer<typeof insertServerLogSchema>;
export type ServerLog = typeof serverLogs.$inferSelect;

// File entries (virtual FS stored in DB for demo - in production would use real FS)
export const fileEntries = pgTable("file_entries", {
  id: serial("id").primaryKey(),
  serverId: integer("server_id").notNull(),
  path: text("path").notNull(), // relative path e.g. /server.properties
  name: text("name").notNull(),
  isDirectory: boolean("is_directory").notNull().default(false),
  content: text("content"),
  size: integer("size").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFileEntrySchema = createInsertSchema(fileEntries).omit({ id: true, updatedAt: true });
export type InsertFileEntry = z.infer<typeof insertFileEntrySchema>;
export type FileEntry = typeof fileEntries.$inferSelect;

// Players table - tracked players on a server
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  serverId: integer("server_id").notNull(),
  username: text("username").notNull(),
  uuid: text("uuid").notNull(),
  isOp: boolean("is_op").notNull().default(false),
  isBanned: boolean("is_banned").notNull().default(false),
  isWhitelisted: boolean("is_whitelisted").notNull().default(false),
  banReason: text("ban_reason"),
  lastSeen: timestamp("last_seen"),
  firstJoined: timestamp("first_joined").defaultNow(),
  playtime: integer("playtime").notNull().default(0), // seconds
});

export const insertPlayerSchema = createInsertSchema(players).omit({ id: true, firstJoined: true });
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;

// Worlds table
export const worlds = pgTable("worlds", {
  id: serial("id").primaryKey(),
  serverId: integer("server_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull().default("overworld"), // overworld | nether | the_end | custom
  seed: text("seed").notNull().default(""),
  size: integer("size").notNull().default(0), // bytes
  lastBackup: timestamp("last_backup"),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertWorldSchema = createInsertSchema(worlds).omit({ id: true });
export type InsertWorld = z.infer<typeof insertWorldSchema>;
export type World = typeof worlds.$inferSelect;

// Backups table
export const backups = pgTable("backups", {
  id: serial("id").primaryKey(),
  serverId: integer("server_id").notNull(),
  name: text("name").notNull(),
  size: integer("size").notNull().default(0), // bytes
  type: text("type").notNull().default("manual"), // manual | scheduled | pre-update
  status: text("status").notNull().default("complete"), // complete | in-progress | failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  notes: text("notes"),
});

export const insertBackupSchema = createInsertSchema(backups).omit({ id: true, createdAt: true });
export type InsertBackup = z.infer<typeof insertBackupSchema>;
export type Backup = typeof backups.$inferSelect;

// Server software versions cache
export const softwareVersions = pgTable("software_versions", {
  id: serial("id").primaryKey(),
  software: text("software").notNull(), // vanilla | paper | spigot | forge | fabric | neoforge | quilt
  version: text("version").notNull(),
  mcVersion: text("mc_version").notNull(),
  downloadUrl: text("download_url"),
  isLatest: boolean("is_latest").notNull().default(false),
  releasedAt: timestamp("released_at"),
});

export const insertSoftwareVersionSchema = createInsertSchema(softwareVersions).omit({ id: true });
export type InsertSoftwareVersion = z.infer<typeof insertSoftwareVersionSchema>;
export type SoftwareVersion = typeof softwareVersions.$inferSelect;

// Server access rules (per-user, per-server permissions)
export const serverAccess = pgTable("server_access", {
  id: serial("id").primaryKey(),
  serverId: integer("server_id").notNull(),
  userId: integer("user_id").notNull(),
  permission: text("permission").notNull().default("viewer"), // viewer | operator | admin
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
  grantedBy: integer("granted_by"),
});

export const insertServerAccessSchema = createInsertSchema(serverAccess).omit({ id: true, grantedAt: true });
export type InsertServerAccess = z.infer<typeof insertServerAccessSchema>;
export type ServerAccess = typeof serverAccess.$inferSelect;
