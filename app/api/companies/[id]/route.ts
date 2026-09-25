import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connection";
import { Company } from "@/models/Company";
import { Lead } from "@/models/Lead";
import { Opportunity } from "@/models/Opportunity";
import { ActivityLog } from "@/models/ActivityLog";
import { companyCreateSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/security";
import { getCurrentWorkspace } from "@/lib/auth/workspace";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getCurrentWorkspace(req);
    if (!ctx) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const { id } = await params;
    await connectToDatabase();

    const company = await Company.findOne({
      _id: id,
      workspaceId: ctx.workspaceId,
    });

    if (!company) {
      return apiError("NOT_FOUND", "Company not found in this workspace", 404);
    }

    const [leads, opportunities] = await Promise.all([
      Lead.find({ workspaceId: ctx.workspaceId, company: company.name, isArchived: false }).sort({ createdAt: -1 }),
      Opportunity.find({ workspaceId: ctx.workspaceId, companyName: company.name }).sort({ createdAt: -1 }),
    ]);

    return apiSuccess({
      company,
      leads,
      opportunities,
    });
  } catch (err) {
    return apiError("INTERNAL_ERROR", "Failed to fetch company details", 500, err instanceof Error ? err.message : String(err));
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getCurrentWorkspace(req);
    if (!ctx) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = companyCreateSchema.partial().safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid update payload", 400, parsed.error.flatten());
    }

    await connectToDatabase();
    const company = await Company.findOneAndUpdate(
      { _id: id, workspaceId: ctx.workspaceId },
      parsed.data,
      { new: true }
    );

    if (!company) {
      return apiError("NOT_FOUND", "Company not found in this workspace", 404);
    }

    await ActivityLog.create({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      actor: ctx.user.name,
      user: ctx.user.name,
      eventType: "COMPANY_UPDATED",
      entityType: "company",
      entityId: company._id.toString(),
      source: "website",
      status: "SUCCESS",
      message: `Updated company details for ${company.name}`,
      metadata: parsed.data,
    });

    return apiSuccess({ company });
  } catch (err) {
    return apiError("INTERNAL_ERROR", "Failed to update company", 500, err instanceof Error ? err.message : String(err));
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getCurrentWorkspace(req);
    if (!ctx) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const { id } = await params;
    await connectToDatabase();
    const company = await Company.findOneAndDelete({ _id: id, workspaceId: ctx.workspaceId });
    if (!company) {
      return apiError("NOT_FOUND", "Company not found in this workspace", 404);
    }

    await ActivityLog.create({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      actor: ctx.user.name,
      user: ctx.user.name,
      eventType: "SETTINGS_UPDATED",
      entityType: "company",
      entityId: id,
      source: "website",
      status: "SUCCESS",
      message: `Deleted company: ${company.name}`,
    });

    return apiSuccess({ message: "Company deleted successfully" });
  } catch (err) {
    return apiError("INTERNAL_ERROR", "Failed to delete company", 500, err instanceof Error ? err.message : String(err));
  }
}
