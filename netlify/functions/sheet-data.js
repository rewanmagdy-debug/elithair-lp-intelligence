// Netlify serverless Function: fetches the published Google Sheets CSVs
// SERVER-SIDE (where CORS doesn't apply at all — it's a browser-only
// concept), then re-serves the raw CSV text to our frontend with a
// permissive CORS header. This replaces the free third-party proxies
// (AllOrigins/corsproxy.io), which were unreliable (rate limits, outages,
// country-blocking) — this function is entirely ours, running on Netlify's
// own infrastructure alongside the site itself.

const SHEET_URLS = {
  campaigns:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQShXPNPGVwhW09pPOPXkk0VU54KZC0Pa0pShu27D7sGh3Da2CxFbnKcA5c0k_jBHBvcEAkYr_nudtW/pub?gid=215363457&single=true&output=csv",
  clarityDaily:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQShXPNPGVwhW09pPOPXkk0VU54KZC0Pa0pShu27D7sGh3Da2CxFbnKcA5c0k_jBHBvcEAkYr_nudtW/pub?gid=105429070&single=true&output=csv",
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  const sheet = event.queryStringParameters && event.queryStringParameters.sheet;
  const url = SHEET_URLS[sheet];

  if (!url) {
    return {
      statusCode: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "text/plain" },
      body: "Missing or invalid ?sheet= parameter. Use sheet=campaigns or sheet=clarityDaily.",
    };
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("Upstream Google Sheets request failed with status " + res.status);
    }
    const text = await res.text();
    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "text/csv; charset=utf-8" },
      body: text,
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { ...CORS_HEADERS, "Content-Type": "text/plain" },
      body: "Error fetching sheet: " + err.message,
    };
  }
};
