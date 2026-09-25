import { ILead, Lead } from "@/models/Lead";
import { Company } from "@/models/Company";
import { Opportunity } from "@/models/Opportunity";
import { Task } from "@/models/Task";
import { ActivityLog } from "@/models/ActivityLog";
import { logger } from "@/lib/logging";
import { twentyClient } from "./client";
import {
  mapLeadToTwentyPerson,
  mapCompanyToTwentyCompany,
  mapOpportunityToTwentyOpportunity,
  mapTaskToTwentyTask,
} from "./mapper";
import { TwentySyncResult } from "./types";

/**
 * Synchronizes an internal LeadFlow Lead into Twenty CRM with idempotency and duplicate checking.
 */
export async function syncLeadToTwenty(lead: ILead): Promise<TwentySyncResult> {
  const isMock = twentyClient.isSimulated();
  let twentyCompanyId = lead.twentyCompanyId;
  let twentyPersonId = lead.twentyPersonId;
  let twentyOpportunityId = lead.twentyOpportunityId;
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
      const existingCompany = await twentyClient.findCompanyByName(lead.company);
      if (existingCompany) {
        twentyCompanyId = existingCompany.id;
      } else {
        const companyInput = mapCompanyToTwentyCompany({
          name: lead.company,
          industry: lead.industry,
          country: lead.country,
        });
        const createdCompany = await twentyClient.createCompany(companyInput);
        twentyCompanyId = createdCompany.id;

        // Upsert internal company record if not present
        await Company.findOneAndUpdate(
          { workspaceId: lead.workspaceId, name: lead.company },
          {
            workspaceId: lead.workspaceId,
            createdBy: lead.createdBy,
            name: lead.company,
            industry: lead.industry,
            country: lead.country,
            twentyCompanyId: createdCompany.id,
          },
          { upsert: true, new: true }
        );
      }
    }

    // 2. Person Duplicate Check & Sync
    if (!twentyPersonId) {
      const existingPerson = await twentyClient.findPersonByEmail(lead.email);
      if (existingPerson) {
        twentyPersonId = existingPerson.id;
        action = "UPDATED";
        // Update person with new details
        await twentyClient.updatePerson(
          existingPerson.id,
          mapLeadToTwentyPerson(lead, twentyCompanyId)
        );
      } else {
        const personInput = mapLeadToTwentyPerson(lead, twentyCompanyId);
        const createdPerson = await twentyClient.createPerson(personInput);
        twentyPersonId = createdPerson.id;
        action = isMock ? "SIMULATED" : "CREATED";
      }
    } else {
      // Already has ID, perform update
      await twentyClient.updatePerson(
        twentyPersonId,
        mapLeadToTwentyPerson(lead, twentyCompanyId)
      );
      action = "UPDATED";
    }

    // 3. Create Opportunity if High Priority or budget > 0
    if (lead.priority === "HIGH" || (lead.budget && lead.budget > 0)) {
      const oppInput = mapOpportunityToTwentyOpportunity(
        {
          name: `${lead.company || lead.firstName} — Automation Opportunity`,
          value: lead.budget || 25000,
          stage: "QUALIFIED",
          expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        twentyCompanyId,
        twentyPersonId
      );

      const createdOpp = await twentyClient.createOpportunity(oppInput);
      twentyOpportunityId = createdOpp.id;

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
          twentyOpportunityId: createdOpp.id,
        },
        { upsert: true, new: true }
      );
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
        twentyTaskId = createdTask.id;

        await Task.create({
          workspaceId: lead.workspaceId,
          createdBy: lead.createdBy,
          title: taskInput.title,
          description: taskInput.body,
          leadId: lead._id,
          priority: lead.priority,
          status: "TODO",
          dueDate: taskInput.dueAt ? new Date(taskInput.dueAt) : new Date(Date.now() + 86400000),
          assignedTo: "Sales Representative",
          twentyTaskId: createdTask.id,
        });
      } catch (taskErr) {
        logger.warn({
          event: "twenty.task_sync_skipped",
          leadId: lead._id.toString(),
          message: "Task creation skipped or not supported",
        });
      }
    }

    // 5. Update internal lead record
    await Lead.findByIdAndUpdate(lead._id, {
      twentyPersonId,
      twentyCompanyId,
      twentyOpportunityId,
      twentyTaskId,
      syncStatus: "SYNCED",
      lastSyncedAt: new Date(),
      syncError: undefined,
    });

    await ActivityLog.create({
      workspaceId: lead.workspaceId,
      userId: lead.createdBy,
      eventType: "TWENTY_SYNC_COMPLETED",
      entityType: "lead",
      entityId: lead._id.toString(),
      source: "twenty",
      status: "SUCCESS",
      message: `Successfully synchronized lead to Twenty CRM (${action}: Person ${twentyPersonId})`,
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
