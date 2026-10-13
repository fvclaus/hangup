import { Credentials } from "@/app/session-store";
import { createOauth2Client } from "@/shared/server_constants";
import { google } from "googleapis";

export async function updateUserInfo(
  inputCredentials: Credentials,
): Promise<{ name: string; picture: string; credentials: Credentials }> {
  const oauth2Client = createOauth2Client();
  oauth2Client.setCredentials(inputCredentials);

  const response = await google.oauth2("v2").userinfo.get({
    auth: oauth2Client,
  });

  const name = response.data.name || "Unknown name";
  const picture = response.data.picture || "Unknown picture";

  const credentials = {
    ...inputCredentials,
    ...oauth2Client.credentials,
  } as Credentials;

  return {
    name,
    picture,
    credentials,
  };
}
