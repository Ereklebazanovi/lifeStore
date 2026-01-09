// api/cleanup/trigger.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Manual trigger endpoint for the cleanup function
 * This can be called from admin panel or used for testing
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const cleanupUrl = `${baseUrl}/api/cleanup/expired-orders`;
    const token = process.env.CLEANUP_SECRET_TOKEN;

    if (!token) {
      return res.status(500).json({
        error: "CLEANUP_SECRET_TOKEN not configured",
      });
    }

    // Call the cleanup function
    const response = await fetch(cleanupUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    return res.status(response.status).json({
      triggered: true,
      cleanupResult: result,
    });
  } catch (error) {
    console.error("Error triggering cleanup:", error);
    return res.status(500).json({
      error: "Failed to trigger cleanup",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
