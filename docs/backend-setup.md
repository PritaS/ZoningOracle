# Backend setup and scope

Set `ACTIONFORGE_TOOL_ID` and `ACTIONFORGE_KEY` as Netlify server-side environment variables. Never expose the key in HTML. POST JSON needs `address` and `county`. Invalid input returns 400, missing configuration 503, upstream failure 502 and timeout 504.

Run `node --test tests/zoning.test.cjs`. Provider calls are stubbed; no live municipal source is verified.

The frontend remains a mock demo and does not call the function. Connecting it and validating provider output against the display schema are separate work. Sample results must not be used for property decisions.
