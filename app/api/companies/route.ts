import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import { Company } from "@/models/Company";
import { Lead } from "@/models/Lead";
import { Opportunity } from "@/models/Opportunity";
import { ActivityLog } from "@/models/ActivityLog";
import { companyCreateSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/security";
import { getCurrentWorkspace } from "@/lib/auth/workspace";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getCurrentWorkspace(req);
    if (!ctx) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const industry = searchParams.get("industry")?.trim() || "";

    const query: Record<string, unknown> = {
      workspaceId: ctx.workspaceId,
    };

    if (industry && industry !== "ALL") {
      query.industry = industry;
    }
    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [{ name: regex }, { industry: regex }, { country: regex }];
    }

    const companies = await Company.find(query).sort({ createdAt: -1 });

    // Aggregate counts for leads and opportunities scoped to this workspace
    const enhancedCompanies = await Promise.all(
      companies.map(async (comp) => {
        const [leadCount, oppCount] = await Promise.all([
          Lead.countDocuments({ workspaceId: ctx.workspaceId, company: comp.name, isArchived: false }),
          Opportunity.countDocuments({ workspaceId: ctx.workspaceId, companyName: comp.name }),
        ]);
        return {
          ...comp.toObject(),
          leadCount,
          oppCount,
        };
      })
    );

    return apiSuccess({ companies: enhancedCompanies });
  } catch (err) {
    return apiError("INTERNAL_ERROR", "Failed to retrieve companies", 500, err instanceof Error ? err.message : String(err));
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getCurrentWorkspace(req);
    if (!ctx) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const body = await req.json().catch(() => null);
    const parsed = companyCreateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid company parameters", 400, parsed.error.flatten());
    }

    await connectToDatabase();

    const company = await Company.create({
      ...parsed.data,
      workspaceId: ctx.workspaceId,
      createdBy: ctx.userId,
      owner: parsed.data.owner || ctx.user.name || "System",
    });

    await ActivityLog.create({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      actor: ctx.user.name,
      user: ctx.user.name,
      eventType: "COMPANY_CREATED",
      entityType: "company",
      entityId: company._id.toString(),
      source: "website",
      status: "SUCCESS",
      message: `Created company: ${company.name}`,
      metadata: { name: company.name, industry: company.industry, country: company.country },
    });

    return apiSuccess({ company }, 201);
  } catch (err) {
    return apiError("INTERNAL_ERROR", "Failed to create company", 500, err instanceof Error ? err.message : String(err));
  }
}
