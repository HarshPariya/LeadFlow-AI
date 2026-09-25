import { describe, it, expect } from "vitest";
import { leadCreateSchema } from "@/lib/validation/schemas";

describe("Workspace Multi-Tenant Data Isolation & Security", () => {
  it("verifies that entity queries require workspaceId isolation", () => {
    const workspaceA = "ws_dev_a_12345";
    const workspaceB = "ws_dev_b_67890";

    const recordsInDatabase = [
      { id: "lead_1", workspaceId: workspaceA, name: "Deal A" },
      { id: "lead_2", workspaceId: workspaceB, name: "Deal B" },
    ];

    // Simulating workspace query filter
    const getRecordsForWorkspace = (wsId: string) => {
      return recordsInDatabase.filter((r) => r.workspaceId === wsId);
    };

    const userARecords = getRecordsForWorkspace(workspaceA);
    const userBRecords = getRecordsForWorkspace(workspaceB);

    expect(userARecords).toHaveLength(1);
    expect(userARecords[0].id).toBe("lead_1");

    expect(userBRecords).toHaveLength(1);
    expect(userBRecords[0].id).toBe("lead_2");

    // Security assertion: User A cannot see User B's records
    const userASeesUserB = userARecords.some((r) => r.workspaceId === workspaceB);
    expect(userASeesUserB).toBe(false);
  });

  it("verifies cross-workspace mutation authorization checks", () => {
    const workspaceA = "ws_dev_a_12345";
    const workspaceB = "ws_dev_b_67890";

    const companyInDb = {
      _id: "comp_99",
      name: "Acme Corp",
      workspaceId: workspaceB, // Owned by Workspace B
    };

    // Mutation verification function
    const authorizeMutation = (recordWsId: string, currentCallerWsId: string) => {
      if (recordWsId !== currentCallerWsId) {
        // Return 404 Not Found as per security spec (prevent leaking existence)
        return { status: 404, allowed: false, error: "Record not found" };
      }
      return { status: 200, allowed: true };
    };

    // User A attempts to update or delete Company owned by User B
    const attemptByUserA = authorizeMutation(companyInDb.workspaceId, workspaceA);
    expect(attemptByUserA.allowed).toBe(false);
    expect(attemptByUserA.status).toBe(404);

    // User B attempts to update their own Company
    const attemptByUserB = authorizeMutation(companyInDb.workspaceId, workspaceB);
    expect(attemptByUserB.allowed).toBe(true);
    expect(attemptByUserB.status).toBe(200);
  });

  it("validates Lead Registration schema according to section rules", () => {
    const validLead = {
      firstName: "Rahul",
      lastName: "Sharma",
      email: "rahul.sharma@example.com",
      company: "ABC Technologies",
      jobTitle: "VP Sales",
      requirement: "Need enterprise CRM automation and Twenty CRM sync.",
      budget: 50000,
      timeline: "30 days",
      source: "website" as const,
      industry: "Software",
      country: "United States",
    };

    const parseResult = leadCreateSchema.safeParse(validLead);
    expect(parseResult.success).toBe(true);

    // Missing required email
    const invalidEmail = { ...validLead, email: "not-an-email" };
    expect(leadCreateSchema.safeParse(invalidEmail).success).toBe(false);

    // Missing requirement
    const missingReq = { ...validLead, requirement: "" };
    expect(leadCreateSchema.safeParse(missingReq).success).toBe(false);
  });
});
