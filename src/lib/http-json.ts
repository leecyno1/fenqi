export class InvalidJsonBodyError extends Error {
  constructor() {
    super("Invalid JSON body.");
    this.name = "InvalidJsonBodyError";
  }
}

export async function readJsonBody(request: Request) {
  try {
    return await request.json() as unknown;
  } catch {
    throw new InvalidJsonBodyError();
  }
}

export function isInvalidJsonBodyError(error: unknown): error is InvalidJsonBodyError {
  return error instanceof InvalidJsonBodyError;
}
