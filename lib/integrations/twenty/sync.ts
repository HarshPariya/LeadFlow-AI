import { ILead, Lead } from "@/models/Lead";
import { Company } from "@/models/Company";
import { Opportunity } from "@/models/Opportunity";
import { Task } from "@/models/Task";
import { ActivityLog } from "@/models/ActivityLog";
import { AutomationRun } from "@/models/AutomationRun";
import { logger } from "@/lib/logging";
import { twentyClient } from "./client";
import {
  mapLeadToTwentyPerson,
  mapCompanyToTwentyCompany,
  mapOpportunityToTwentyOpportunity,
  mapTaskToTwentyTask,
} from "./mapper";
import { TwentySyncResult } from "./types";

export function isValidUUID(str?: string | null): boolean {
  if (!str || typeof str !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str.trim());
}

/**
 * Synchronizes an internal LeadFlow Lead into Twenty CRM with idempotency and duplicate checking.
 */
export async function syncLeadToTwenty(lead: ILead): Promise<TwentySyncResult> {
  const isMock = twentyClient.isSimulated();
  let twentyCompanyId = isValidUUID(lead.twentyCompanyId) ? lead.twentyCompanyId : undefined;
  let twentyPersonId = isValidUUID(lead.twentyPersonId) ? lead.twentyPersonId : undefined;
  let twentyOpportunityId = isValidUUID(lead.twentyOpportunityId) ? lead.twentyOpportunityId : undefined;
  let action: "CREATED" | "UPDATED" | "SIMULATED" = isMock ? "SIMULATED" : "CREATED";

  try {
    logger.info({
      event: "twenty.sync_started",
      leadId: lead._id.toString(),
      message: `Initiating Twenty CRM synchronization for lead: ${lead.email}`,
    });

    await ActivityLog.create({
      workspaceId: lead.workspaceId,
      userId: lead.createdBy,
      eventType: "TWENTY_SYNC_STARTED",
      entityType: "lead",
      entityId: lead._id.toString(),
      source: "system",
      status: "RUNNING",
      message: `Twenty CRM sync started (${isMock ? "Simulated Mode" : "Live API"})`,
    });

    // 1. Company Handling
    if (lead.company && !twentyCompanyId) {
      try {
        const existingCompany = await twentyClient.findCompanyByName(lead.company);
        if (existingCompany && isValidUUID(existingCompany.id)) {
          twentyCompanyId = existingCompany.id;
        } else {
          const companyInput = mapCompanyToTwentyCompany({
            name: lead.company,
            industry: lead.industry,
            country: lead.country,
          });
          const createdCompany = await twentyClient.createCompany(companyInput);
          if (createdCompany && isValidUUID(createdCompany.id)) {
            twentyCompanyId = createdCompany.id;
          }
        }

        // Upsert internal company record if present
        if (twentyCompanyId) {
          await Company.findOneAndUpdate(
            { workspaceId: lead.workspaceId, name: lead.company },
            {
              workspaceId: lead.workspaceId,
              createdBy: lead.createdBy,
              name: lead.company,
              industry: lead.industry,
              country: lead.country,
              twentyCompanyId,
            },
            { upsert: true, new: true }
          );
        }
      } catch (compErr) {
        logger.warn({
          event: "twenty.company_sync_warn",
          error: compErr instanceof Error ? compErr.message : String(compErr),
        });
      }
    }

    // 2. Person Duplicate Check & Sync
    if (!twentyPersonId) {
      const existingPerson = await twentyClient.findPersonByEmail(lead.email);
      if (existingPerson && isValidUUID(existingPerson.id)) {
        twentyPersonId = existingPerson.id;
        action = "UPDATED";
        try {
          await twentyClient.updatePerson(
            existingPerson.id,
            mapLeadToTwentyPerson(lead, twentyCompanyId)
          );
        } catch (updateErr: any) {
          if (String(updateErr?.message).includes("phone") || updateErr?.details?.code === "INVALID_PHONE_NUMBER") {
            const fallbackInput = mapLeadToTwentyPerson(lead, twentyCompanyId);
            delete fallbackInput.phones;
            await twentyClient.updatePerson(existingPerson.id, fallbackInput);
          } else {
            throw updateErr;
          }
        }
      } else {
        const personInput = mapLeadToTwentyPerson(lead, twentyCompanyId);
        let createdPerson;
        try {
          createdPerson = await twentyClient.createPerson(personInput);
        } catch (createErr: any) {
          if (String(createErr?.message).includes("phone") || createErr?.details?.code === "INVALID_PHONE_NUMBER") {
            delete personInput.phones;
            createdPerson = await twentyClient.createPerson(personInput);
          } else {
            throw createErr;
          }
        }
        if (createdPerson && isValidUUID(createdPerson.id)) {
          twentyPersonId = createdPerson.id;
        }
        action = isMock ? "SIMULATED" : "CREATED";
      }
    } else {
      // Already has valid UUID, perform update
      try {
        await twentyClient.updatePerson(
          twentyPersonId,
          mapLeadToTwentyPerson(lead, twentyCompanyId)
        );
      } catch (updateErr: any) {
        if (String(updateErr?.message).includes("phone") || updateErr?.details?.code === "INVALID_PHONE_NUMBER") {
          const fallbackInput = mapLeadToTwentyPerson(lead, twentyCompanyId);
          delete fallbackInput.phones;
          await twentyClient.updatePerson(twentyPersonId, fallbackInput);
        } else {
          throw updateErr;
        }
      }
      action = "UPDATED";
    }

    // 3. Create Opportunity if High Priority or budget > 0
    if (lead.priority === "HIGH" || (lead.budget && lead.budget > 0)) {
      try {
        const oppInput = mapOpportunityToTwentyOpportunity(
          {
            name: `${lead.company || lead.firstName} — Automation Opportunity`,
            value: lead.budget || 25000,
            stage: "QUALIFIED",
            expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          twentyCompanyId,
          twentyPersonId,
          lead.priority
        );

        const createdOpp = await twentyClient.createOpportunity(oppInput);
        if (createdOpp && isValidUUID(createdOpp.id)) {
          twentyOpportunityId = createdOpp.id;
        }

        // Upsert internal opportunity
        await Opportunity.findOneAndUpdate(
          { workspaceId: lead.workspaceId, leadId: lead._id },
          {
            workspaceId: lead.workspaceId,
            createdBy: lead.createdBy,
            name: `${lead.company || lead.firstName} — Automation Opportunity`,
            companyName: lead.company || "Independent",
            leadId: lead._id,
            primaryContact: `${lead.firstName} ${lead.lastName}`,
            value: lead.budget || 25000,
            stage: "QUALIFIED",
            probability: lead.priority === "HIGH" ? 70 : 40,
            expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            twentyOpportunityId: twentyOpportunityId || undefined,
          },
          { upsert: true, new: true }
        );
      } catch (oppErr) {
        logger.warn({
          event: "twenty.opp_sync_warn",
          error: oppErr instanceof Error ? oppErr.message : String(oppErr),
        });
      }
    }

    // 4. Create Task in Twenty CRM
    let twentyTaskId: string | undefined;
    if (twentyPersonId) {
      try {
        const taskInput = mapTaskToTwentyTask(
          {
            title: lead.priority === "HIGH"
              ? `Urgent Follow-Up: ${lead.firstName} ${lead.lastName}`
              : `Follow up with ${lead.firstName} ${lead.lastName}`,
            description: lead.aiRecommendedAction || "Follow up regarding qualified inquiry",
            status: "TODO",
          },
          twentyPersonId,
          lead.priority
        );
        const createdTask = await twentyClient.createTask(taskInput);
        if (createdTask && isValidUUID(createdTask.id)) {
          twentyTaskId = createdTask.id;
        }

        await Task.create({
          workspaceId: lead.workspaceId,
          createdBy: lead.createdBy,
          title: taskInput.title,
          description: taskInput.body,
          leadId: lead._id,
          leadName: `${lead.firstName} ${lead.lastName}`,
          companyName: lead.company || undefined,
          priority: lead.priority,
          status: "TODO",
          dueDate: taskInput.dueAt ? new Date(taskInput.dueAt) : new Date(Date.now() + 86400000),
          assignee: "Sales Representative",
          twentyTaskId: twentyTaskId || undefined,
        });
      } catch (taskErr) {
        logger.warn({
          event: "twenty.task_sync_skipped",
          leadId: lead._id.toString(),
          message: "Task creation skipped or not supported",
        });
      }
    }

    // 5. Update internal lead record in MongoDB
    await Lead.findByIdAndUpdate(lead._id, {
      twentyPersonId: isValidUUID(twentyPersonId) ? twentyPersonId : undefined,
      twentyCompanyId: isValidUUID(twentyCompanyId) ? twentyCompanyId : undefined,
      twentyOpportunityId: isValidUUID(twentyOpportunityId) ? twentyOpportunityId : undefined,
      twentyTaskId: isValidUUID(twentyTaskId) ? twentyTaskId : undefined,
      syncStatus: "SYNCED",
      lastSyncedAt: new Date(),
      syncError: undefined,
    });

    // 6. Keep AutomationRun in sync in MongoDB
    await AutomationRun.findOneAndUpdate(
      { leadId: lead._id, workspaceId: lead.workspaceId },
      {
        $set: {
          twentyPersonId: isValidUUID(twentyPersonId) ? twentyPersonId : undefined,
        },
      }
    );

    await ActivityLog.create({
      workspaceId: lead.workspaceId,
      userId: lead.createdBy,
      eventType: "TWENTY_SYNC_COMPLETED",
      entityType: "lead",
      entityId: lead._id.toString(),
      source: "twenty",
      status: "SUCCESS",
      message: `Successfully synchronized lead to Twenty CRM (${action}: Person ${twentyPersonId || "Synced"})`,
      metadata: {
        twentyPersonId,
        twentyCompanyId,
        twentyOpportunityId,
        isMock,
      },
    });

    return {
      personId: twentyPersonId,
      companyId: twentyCompanyId,
      opportunityId: twentyOpportunityId,
      action,
      isMock,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);

    await Lead.findByIdAndUpdate(lead._id, {
      syncStatus: "FAILED",
      syncError: errorMsg,
    });

    await ActivityLog.create({
      workspaceId: lead.workspaceId,
      userId: lead.createdBy,
      eventType: "TWENTY_SYNC_FAILED",
      entityType: "lead",
      entityId: lead._id.toString(),
      source: "twenty",
      status: "FAILED",
      message: `Twenty CRM sync failed: ${errorMsg}`,
      metadata: { error: errorMsg },
    });

    throw err;
  }
}
