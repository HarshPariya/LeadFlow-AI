import mongoose from "mongoose";
import dns from "node:dns";
import { env } from "@/lib/env";
import { logger } from "@/lib/logging";

// Ensure MongoDB Atlas SRV records resolve cleanly on Windows
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore in restricted environments
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
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    logger.info({
      event: "db.connecting",
      message: "Establishing connection to MongoDB database",
    });

    cached.promise = mongoose
      .connect(env.MONGODB_URI, opts)
      .then((m) => {
        logger.info({
          event: "db.connected",
          message: "MongoDB connection successfully established",
        });
        return m;
      })
      .catch((err) => {
        logger.error({
          event: "db.connection_error",
          error: err instanceof Error ? err.message : String(err),
          message: "Failed to connect to MongoDB",
        });
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
