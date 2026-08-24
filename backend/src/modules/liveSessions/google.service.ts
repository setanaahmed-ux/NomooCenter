import { google } from "googleapis";
import { randomUUID } from "crypto";
import { env } from "../../config/env";

// Auto-creates a Google Calendar event with a Google Meet link attached.
// Requires a Workspace service account with domain-wide delegation
// (see backend/.env.example for setup steps). Google Meet links cannot be
// created via API for personal Gmail accounts, only Workspace ones.

function getCalendarClient() {
  if (!env.googleMeetConfigured) {
    throw new Error(
      "Google Meet auto-scheduling is not configured (missing GOOGLE_SERVICE_ACCOUNT_JSON / GOOGLE_IMPERSONATE_EMAIL)"
    );
  }
  const credentials = JSON.parse(env.googleServiceAccountJson!);
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
    subject: env.googleImpersonateEmail,
  });
  return google.calendar({ version: "v3", auth });
}

export async function createMeetEvent(params: {
  title: string;
  description?: string;
  startISO: string;
  endISO: string;
  attendeeEmails?: string[];
}): Promise<{ meetLink: string; eventId: string }> {
  const calendar = getCalendarClient();

  const { data } = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    requestBody: {
      summary: params.title,
      description: params.description,
      start: { dateTime: params.startISO },
      end: { dateTime: params.endISO },
      attendees: params.attendeeEmails?.map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: randomUUID(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    },
  });

  const meetLink = data.hangoutLink ?? data.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri;
  if (!meetLink || !data.id) {
    throw new Error("Google Calendar did not return a Meet link");
  }
  return { meetLink, eventId: data.id };
}

export async function cancelMeetEvent(eventId: string): Promise<void> {
  const calendar = getCalendarClient();
  await calendar.events.delete({ calendarId: "primary", eventId });
}
