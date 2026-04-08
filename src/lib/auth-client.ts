import { createAuthClient } from "better-auth/react";

import { getAuthClientBaseURL } from "@/lib/auth/config";

const clientBaseURL = getAuthClientBaseURL();

export const authClient = clientBaseURL
  ? createAuthClient({
      baseURL: clientBaseURL,
    })
  : createAuthClient();
