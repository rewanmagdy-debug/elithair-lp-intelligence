// Netlify serverless Function: relays requests to our existing Apps Script
// Web App (which already has full, working access to the Google Sheet —
// it runs as the script owner, so Google's "anyone with the link" sharing
// restrictions never applied to it at all).
//
// The ONLY problem Apps Script ever had was BROWSER fetch() reliability
// (Google's 302-redirect-to-echo-URL mechanism is flaky specifically for
// cross-origin browser requests). Calling it SERVER-TO-SERVER from here
// avoids that entirely — there's no such thing as CORS between two
// servers, and Node's fetch follows redirects normally.

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzbtk3V4UcHUkf84QoZOjDYqBT1DIkxXHHxpMfY7mZG-C0vQZeX25d3ItrYBHjM4xls/exec";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  const action = event.queryStringParameters && event.queryStringParameters.action;
  const url = action ? `${APPS_SCRIPT_URL}?action=${encodeURIComponent(action)}` : APPS_SCRIPT_URL;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("Apps Script request failed with status " + res.status);
    }
    const text = await res.text();
    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json; charset=utf-8" },
      body: text,
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { ...CORS_HEADERS, "Content-Type": "text/plain" },
      body: "Error reaching Apps Script: " + err.message,
    };
  }
};
