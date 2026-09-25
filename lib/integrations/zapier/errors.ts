export class ZapierIntegrationError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.name = "ZapierIntegrationError";
    this.statusCode = statusCode;
    this.details = details;
  }
}
