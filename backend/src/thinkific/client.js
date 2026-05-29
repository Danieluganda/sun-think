import { config } from "../../config/index.js";
import { trackApiCall } from "../logger/metrics.js";

export async function thinkificRequest(query, variables = {}) {
  if (!config.thinkific.token) {
    throw new Error("THINKIFIC_TOKEN is required for Thinkific requests");
  }

  return trackApiCall("thinkific", async () => {
    const response = await fetch(config.thinkific.graphqlUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.thinkific.token}`
      },
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
      const error = new Error(`Thinkific request failed: ${response.status} ${response.statusText}`);
      error.statusCode = response.status;
      throw error;
    }

    const payload = await response.json();
    if (payload.errors?.length) {
      const error = new Error(payload.errors.map((item) => item.message).join("; "));
      error.statusCode = 200;
      throw error;
    }

    return { value: payload.data, statusCode: response.status };
  });
}
