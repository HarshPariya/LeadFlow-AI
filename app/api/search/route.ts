import { NextRequest } from "next/server";
import { getCurrentWorkspace } from "@/lib/auth/workspace";
import { Lead } from "@/models/Lead";
import { Company } from "@/models/Company";
import { Opportunity } from "@/models/Opportunity";
import { Task } from "@/models/Task";
import { apiSuccess, apiError } from "@/lib/security";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getCurrentWorkspace(req);
    if (!ctx) {
      return apiError("UNAUTHORIZED", "Not authenticated", 401);
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    if (!q || q.length < 2) {
      return apiSuccess({ leads: [], companies: [], opportunities: [], tasks: [] });
    }

    const regex = new RegExp(q, "i");
    const workspaceId = ctx.workspaceId;

    const [leads, companies, opportunities, tasks] = await Promise.all([
      Lead.find({
        workspaceId,
        isArchived: false,
        $or: [{ firstName: regex }, { lastName: regex }, { email: regex }, { company: regex }],
      })
        .select("_id firstName lastName email company status priority")
        .limit(5),

      Company.find({
        workspaceId,
        $or: [{ name: regex }, { industry: regex }, { country: regex }],
      })
        .select("_id name industry country")
        .limit(5),

      Opportunity.find({
        workspaceId,
        $or: [{ name: regex }, { companyName: regex }, { primaryContact: regex }],
      })
        .select("_id name companyName value stage")
        .limit(5),

      Task.find({
        workspaceId,
        $or: [{ title: regex }, { leadName: regex }, { companyName: regex }],
      })
        .select("_id title status priority dueDate")
        .limit(5),
    ]);

    return apiSuccess({
      leads,
      companies,
      opportunities,
      tasks,
    });
  } catch (err) {
    return apiError("INTERNAL_ERROR", "Search failed", 500, err instanceof Error ? err.message : String(err));
  }
}
