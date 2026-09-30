import { connectToDatabase } from "@/lib/db/connection";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const mongooseInstance = await connectToDatabase();
    const isConnected = mongooseInstance.connection.readyState === 1;

    if (!isConnected) {
      return NextResponse.json(
        {
          status: "NOT_READY",
          reason: "Database connection not established",
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        status: "READY",
        database: "CONNECTED",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        status: "NOT_READY",
        reason: err instanceof Error ? err.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
