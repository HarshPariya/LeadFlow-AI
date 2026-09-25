import { NextRequest } from "next/server";
import { twentyClient } from "@/lib/integrations/twenty/client";
import { apiSuccess } from "@/lib/security";

export async function POST() {
  const result = await twentyClient.testConnection();
  return apiSuccess(result);
}
