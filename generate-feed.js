"use strict";
const { execFileSync } = require("child_process");

function escapeXml(str) {
  return str.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c])
  );
}

const main = () => {
  const title = "DeepSeek Price Notification";
  const githubServer = process.env.GITHUB_SERVER_URL || "https://github.com";
  const githubRepo = process.env.GITHUB_REPOSITORY || "zhangyoufu/DeepSeek-priceNotification";
  const feedUrl = process.env.FEED_URL || "https://zhangyoufu.github.io/DeepSeek-priceNotification/atom.xml";
  const websubHubUrl = process.env.WEBSUB_HUB_URL || "https://pubsubhubbub.superfeedr.com/";
  const repoUrl = `${githubServer}/${githubRepo}`;

  const MAX_ENTRIES = 5;
  const log = execFileSync(
    "git",
    ["log", "--format=%H %cd", "--date=iso-strict", "-n", String(MAX_ENTRIES), "--", "output.txt"],
    { encoding: "utf-8" }
  ).trim();
  const commits = log.split("\n").filter(Boolean).map((line) => line.trim().split(" ", 2));
  const entries = commits.map(([sha, date]) => {
    let content = execFileSync("git", ["show", `${sha}:output.txt`], { encoding: "utf-8" }).trim();
    const outputTxtUrl = `${repoUrl}/blob/${sha}/output.txt`;
    return { sha, date, content, outputTxtUrl };
  });

  // build Atom entries XML
  const entryXmls = entries.map(({ sha, date, content, outputTxtUrl }) => `
  <entry>
    <title>${title}</title>
    <link href="${outputTxtUrl}" />
    <id>${sha}</id>
    <updated>${date}</updated>
    <content type="text">${escapeXml(content)}</content>
  </entry>`).join("");

  // generate Atom feed
  console.log(`<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${title}</title>
  <subtitle>Tracking DeepSeek platform announcements</subtitle>
  <id>${repoUrl}</id>
  <link href="${repoUrl}" />
  <link rel="self" href="${feedUrl}" />
  <link rel="hub" href="${websubHubUrl}" />
  <updated>${new Date().toISOString()}</updated>
  <author>
    <name>bot</name>
    <uri>${repoUrl}</uri>
  </author>${entryXmls}
</feed>`);
};

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
