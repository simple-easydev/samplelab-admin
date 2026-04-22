type KlaviyoProfileAttrs = {
  email?: string;
  phone_number?: string;
  external_id?: string;
  first_name?: string;
  last_name?: string;
  [key: string]: unknown;
};

type TrackEventArgs = {
  /** Metric name in Klaviyo (the event name). */
  name: string;
  /** At least one identifier (email, phone_number, external_id). */
  profile: KlaviyoProfileAttrs;
  properties?: Record<string, unknown>;
  /** Strongly recommended for dedupe. */
  uniqueId?: string;
  /** ISO date or unix ms; optional (Klaviyo will set ingestion time). */
  time?: string | number;
};

const KLAVIYO_EVENTS_URL = "https://a.klaviyo.com/api/events/";
// Use the newest stable revision that your Klaviyo account supports.
const KLAVIYO_REVISION = "2026-04-15";

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function trackKlaviyoEvent(args: TrackEventArgs): Promise<void> {
  const apiKey = Deno.env.get("KLAVIYO_PRIVATE_API_KEY")?.trim();
  if (!apiKey) return; // allow running without Klaviyo configured

  const { name, profile, properties, uniqueId, time } = args;
  if (!name?.trim()) return;

  // Klaviyo requires at least one identifier.
  const hasId =
    typeof profile?.email === "string" && profile.email.trim().length > 0 ||
    typeof profile?.phone_number === "string" && profile.phone_number.trim().length > 0 ||
    typeof profile?.external_id === "string" && profile.external_id.trim().length > 0;
  if (!hasId) return;

  const body = {
    data: {
      type: "event",
      attributes: {
        profile: {
          data: {
            type: "profile",
            attributes: profile,
          },
        },
        metric: {
          data: {
            type: "metric",
            attributes: { name },
          },
        },
        ...(properties ? { properties } : {}),
        ...(uniqueId ? { unique_id: uniqueId } : {}),
        ...(time !== undefined ? { time } : {}),
      },
    },
  };

  try {
    const res = await fetch(KLAVIYO_EVENTS_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        revision: KLAVIYO_REVISION,
        Authorization: `Klaviyo-API-Key ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    // Klaviyo typically returns 202 Accepted.
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Klaviyo event failed", {
        status: res.status,
        body: safeJsonParse(text),
        event: name,
      });
    }
  } catch (err) {
    console.error("Klaviyo event error", { event: name, err });
  }
}

