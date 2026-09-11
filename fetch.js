"use strict";

const fs = require("fs");

const main = async () => {
const url = process.env.DEEPSEEK_PLATFORM_URL || "https://platform.deepseek.com/";
  const htmlRsp = await fetch(url, { redirect: "manual" });
  const htmlBody = await htmlRsp.text();
  if (htmlRsp.status !== 200) throw new Error(`HTML HTTP ${htmlRsp.status}`);

  // extract JS bundle URL
  const m = htmlBody.match(/src="(https:\/\/fe-static\.deepseek\.com\/platform\/static\/main\.[0-9a-f]{10}\.js)"/);
  if (!m) throw new Error(`JS URL not found in HTML body\n${htmlBody}`);
  const jsUrl = m[1];
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `jsUrl=${jsUrl}\n`);
  } else {
    process.stderr.write(`${jsUrl}\n\n`);
  }

  // fetch JS bundle
  const jsRsp = await fetch(jsUrl, { redirect: "manual" });
  const jsBody = await jsRsp.text();
  if (jsRsp.status !== 200) throw new Error(`JS HTTP ${jsRsp.status}`);

  // extract Notification key/value pairs
  const matches = [...jsBody.matchAll(/([_0-9A-Za-z]+Notification\d*):(".*?"),/g)];
  const output = matches.map(([, key, val]) => `${key}:\n${JSON.parse(val)}\n`).join("\n");

  // output result
  process.stdout.write(output);
};

main().catch((err) => { console.error(err); process.exit(1); });
