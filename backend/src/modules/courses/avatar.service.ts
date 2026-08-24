import axios from "axios";
import { env } from "../../config/env";

// D-ID (https://docs.d-id.com) turns text into a talking-avatar video: it
// runs text-to-speech on the script with the chosen voice, then animates the
// presenter image's mouth to match — this is what powers the "avatar tutor".

const D_ID_BASE_URL = "https://api.d-id.com";

function authHeader() {
  if (!env.dIdApiKey) {
    throw new Error("D-ID is not configured (missing D_ID_API_KEY)");
  }
  // D-ID API keys are issued pre-encoded as "username:password" base64 —
  // pass it straight through as the Basic auth credential.
  return { Authorization: `Basic ${env.dIdApiKey}` };
}

export async function createAvatarTalk(params: {
  script: string;
  presenterImageUrl: string;
  voiceProvider: string;
  voiceId: string;
  language: string;
}): Promise<{ talkId: string }> {
  const { data } = await axios.post(
    `${D_ID_BASE_URL}/talks`,
    {
      source_url: params.presenterImageUrl,
      script: {
        type: "text",
        input: params.script,
        provider: { type: params.voiceProvider, voice_id: params.voiceId },
        ssml: false,
      },
      config: { fluent: true, result_format: "mp4" },
    },
    { headers: authHeader() }
  );
  return { talkId: data.id };
}

export type AvatarTalkStatus = {
  status: "created" | "started" | "done" | "error" | "rejected";
  resultUrl?: string;
  error?: string;
};

export async function getAvatarTalk(talkId: string): Promise<AvatarTalkStatus> {
  const { data } = await axios.get(`${D_ID_BASE_URL}/talks/${talkId}`, { headers: authHeader() });
  return {
    status: data.status,
    resultUrl: data.result_url,
    error: data.error?.description ?? data.error?.kind,
  };
}
