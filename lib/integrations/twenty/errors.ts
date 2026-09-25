export class TwentyIntegrationError extends Error {
  public statusCode?: number;
  public details?: unknown;

  constructor(message: string, statusCode?: number, details?: unknown) {
    super(message);
    this.name = "TwentyIntegrationError";
    this.statusCode = statusCode;
    this.details = details;
  }
}
