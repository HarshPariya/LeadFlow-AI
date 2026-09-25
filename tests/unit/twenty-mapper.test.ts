import { describe, it, expect } from "vitest";
import {
  mapLeadToTwentyPerson,
  mapCompanyToTwentyCompany,
  mapOpportunityToTwentyOpportunity,
} from "@/lib/integrations/twenty/mapper";

describe("Twenty CRM Mapper", () => {
  it("should map Lead to Twenty Person payload", () => {
    const mockLead: any = {
      firstName: "Elena",
      lastName: "Rostova",
      email: "elena@synthetixhealth.com",
      phone: "+1 647 555 0199",
      jobTitle: "CTO",
      country: "Canada",
    };

    const mapped = mapLeadToTwentyPerson(mockLead, "twenty_comp_123");
    expect(mapped.name.firstName).toBe("Elena");
    expect(mapped.name.lastName).toBe("Rostova");
    expect(mapped.emails.primaryEmail).toBe("elena@synthetixhealth.com");
    expect(mapped.companyId).toBe("twenty_comp_123");
  });

  it("should map Company to Twenty Company", () => {
    const mockCompany = {
      name: "Apex Logistics",
      website: "https://www.apexlogistics.io/contact",
      country: "United States",
    };

    const mapped = mapCompanyToTwentyCompany(mockCompany);
    expect(mapped.name).toBe("Apex Logistics");
    expect(mapped.address?.addressCountry).toBe("United States");
  });

  it("should convert USD amount into micros for Twenty Opportunity", () => {
    const mockOpp = {
      name: "Freight Engine",
      value: 50000, // $50,000
      stage: "QUALIFIED" as const,
    };

    const mapped = mapOpportunityToTwentyOpportunity(mockOpp);
    // 50,000 * 1,000,000 = 50,000,000,000 micros
    expect(mapped.amount.amountMicros).toBe(50000000000);
    expect(mapped.amount.currencyCode).toBe("USD");
  });
});
