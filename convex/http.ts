import { httpRouter } from "convex/server";

import { submitAttribution } from "./attribution";

const http = httpRouter();

// Install-attribution intake. The app POSTs its AdServices token here with a
// shared-secret header. See docs/guides/attribution.md.
http.route({
  path: "/v1/apple-ads-attribution",
  method: "POST",
  handler: submitAttribution,
});

export default http;
