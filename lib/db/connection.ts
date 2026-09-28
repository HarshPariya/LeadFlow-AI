import mongoose from "mongoose";
import dns from "node:dns";
import { env } from "@/lib/env";
import { logger } from "@/lib/logging";

// Ensure Node.js prioritizes IPv4 and configures public DNS servers on Windows
try {
  if (typeof dns.setDefaultResultOrder === "function") {
    dns.setDefaultResultOrder("ipv4first");
  }
  dns.setServers(["8.8.8.8", "1.1.1.1", "208.67.222.222"]);
} catch {
  // Ignore in restricted environments
}

/**
 * Resolves a mongodb+srv:// URI into a direct replica set connection string
 * using explicit public DNS servers (8.8.8.8, 1.1.1.1).
 * Completely bypasses Windows local router / ISP SRV DNS query refusals (querySrv ECONNREFUSED).
 */
export async function resolveAtlasSrv(srvUri: string): Promise<string> {
  if (!srvUri.startsWith("mongodb+srv://")) {
    return srvUri;
  }

  const match = srvUri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)(\/[^?]*)?(\?.*)?/);
  if (!match) return srvUri;

  const [, user, pass, host, db = "/leadflow-ai", query = ""] = match;

  try {
    const resolver = new dns.promises.Resolver();
    resolver.setServers(["8.8.8.8", "1.1.1.1", "208.67.222.222"]);

    const [srvRecords, txtRecords] = await Promise.all([
      resolver.resolveSrv(`_mongodb._tcp.${host}`),
      resolver.resolveTxt(host).catch(() => []),
    ]);

    if (!srvRecords || srvRecords.length === 0) {
      return srvUri;
    }

    const hosts = srvRecords.map((r) => `${r.name}:${r.port}`).join(",");
    const txtOptions = txtRecords.flat().join("&");

    const queryParams = new URLSearchParams(query.replace(/^\?/, ""));
    if (!queryParams.has("ssl") && !queryParams.has("tls")) queryParams.set("ssl", "true");
    if (!queryParams.has("authSource")) queryParams.set("authSource", "admin");

    if (txtOptions) {
      for (const part of txtOptions.split("&")) {
        const [k, v] = part.split("=");
        if (k && !queryParams.has(k)) queryParams.set(k, v);
      }
    }

    return `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${hosts}${db}?${queryParams.toString()}`;
  } catch (err) {
    logger.warn({
      event: "db.srv_resolve_fallback_warn",
      message: "Could not pre-resolve Atlas SRV records, using raw URI",
      error: String(err),
    });
    return srvUri;
  }
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    };

    logger.info({
      event: "db.connecting",
      message: "Establishing connection to MongoDB database",
    });

    cached.promise = (async () => {
      // 1. First attempt: Try connecting with raw URI
      try {
        const conn = await mongoose.connect(env.MONGODB_URI, opts);
        logger.info({
          event: "db.connected",
          message: "MongoDB connection successfully established via primary URI",
        });
        return conn;
      } catch (firstErr) {
        const isSrvError =
          firstErr instanceof Error &&
          (firstErr.message.includes("querySrv") ||
            firstErr.message.includes("ECONNREFUSED") ||
            firstErr.message.includes("ENOTFOUND"));

        if (!isSrvError || !env.MONGODB_URI.startsWith("mongodb+srv://")) {
          logger.error({
            event: "db.connection_error",
            error: firstErr instanceof Error ? firstErr.message : String(firstErr),
            message: "Failed to connect to MongoDB",
          });
          throw firstErr;
        }

        // 2. Second attempt: Auto-resolve Atlas SRV records to direct shard replicaSet URI
        logger.warn({
          event: "db.resolving_srv_fallback",
          message: "Windows SRV query failed. Resolving direct cluster replicaSet via public DNS...",
        });

        const directUri = await resolveAtlasSrv(env.MONGODB_URI);
        const conn = await mongoose.connect(directUri, opts);
        logger.info({
          event: "db.connected",
          message: "MongoDB successfully connected via resilient direct shard fallback",
        });
        return conn;
      }
    })()
      .then((m) => m)
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
