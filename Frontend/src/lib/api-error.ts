import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Standardized API Error Handler 
 * Ensures internal structures and stack traces are NEVER leaked to the client.
 */
export function handleApiError(err: unknown) {
  // Catch Schema validation errors
  if (err instanceof ZodError) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Validation failed", 
        details: err.issues.map((e) => ({ path: e.path.join('.'), message: e.message }))
      },
      { status: 400 }
    );
  }

  // Log error privately to server console
  console.error("[API_ERROR_INTERNAL]:", err);

  // Return generic error to the frontend to prevent trace leakage
  return NextResponse.json(
    { 
      success: false, 
      error: "An unexpected internal server error occurred." 
    },
    { status: 500 }
  );
}
