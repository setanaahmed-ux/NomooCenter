import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

app.listen(env.port, () => {
  console.log(`NOMOO backend listening on http://localhost:${env.port}`);
  console.log(
    `Integrations — Google Meet: ${env.googleMeetConfigured ? "on" : "off (manual meetLink required)"}, ` +
      `Gemini: ${env.geminiConfigured ? "on" : "off"}, ` +
      `Avatar tutor (D-ID): ${env.avatarTutorConfigured ? "on" : "off"}`
  );
});
