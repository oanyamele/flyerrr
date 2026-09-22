/**
 * build-pdf.mjs — render project Markdown deliverables to PDF with Mermaid diagrams.
 *
 * Mermaid needs a real browser to lay out diagrams, so this drives the Chrome already
 * installed on the machine via puppeteer-core rather than downloading a second copy.
 *
 * USAGE
 *   npm install --no-save marked mermaid puppeteer-core
 *   node scripts/build-pdf.mjs                 # renders the default document set
 *   node scripts/build-pdf.mjs docs/foo.md     # renders specific files
 *
 * On Windows the npm registry may need the system certificate store:
 *   $env:NODE_OPTIONS="--use-system-ca"
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { marked } from "marked";
import puppeteer from "puppeteer-core";

const OUT_DIR = "docs/pdf";

const DEFAULT_DOCS = [
  "docs/PROJECT_RESET_REPORT.md",
  "docs/architecture.md",
  "docs/BACKLOG_INTEGRATION.md",
];

const CHROME_CANDIDATES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];

const findChrome = () => {
  const found = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!found) throw new Error("No Chrome or Edge binary found. Set CHROME_PATH.");
  return process.env.CHROME_PATH ?? found;
};

/**
 * Pull Mermaid fences out before Markdown conversion. `marked` would otherwise escape the
 * diagram source into a <code> block, and Mermaid could never see it.
 */
const extractMermaid = (md) => {
  const diagrams = [];
  const withPlaceholders = md.replace(
    /^[ \t]*```mermaid[ \t]*\r?\n([\s\S]*?)^[ \t]*```[ \t]*$/gm,
    (_match, body) => {
      diagrams.push(body);
      return `<div class="mermaid-slot" data-index="${diagrams.length - 1}"></div>`;
    },
  );
  return { withPlaceholders, diagrams };
};

const STYLES = `
  @page { size: A4; margin: 16mm 14mm 18mm 14mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", -apple-system, Helvetica, Arial, sans-serif;
    font-size: 10.2pt; line-height: 1.55; color: #1a1a1a;
    margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  h1 { font-size: 21pt; margin: 0 0 4pt; border-bottom: 2.5pt solid #1a1a1a; padding-bottom: 5pt; }
  h2 { font-size: 15pt; margin: 20pt 0 7pt; border-bottom: 0.6pt solid #c8c8c8; padding-bottom: 3pt; break-after: avoid; }
  h3 { font-size: 12.4pt; margin: 15pt 0 5pt; break-after: avoid; }
  h4 { font-size: 11pt; margin: 12pt 0 4pt; break-after: avoid; }
  h2, h3, h4 { break-inside: avoid; }
  p, li { orphans: 3; widows: 3; }
  a { color: #0b57a4; text-decoration: none; }
  code {
    font-family: Consolas, "Courier New", monospace; font-size: 8.9pt;
    background: #f2f3f5; padding: 1pt 3pt; border-radius: 2pt;
  }
  pre {
    background: #f7f8fa; border: 0.6pt solid #d8dade; border-left: 2.5pt solid #8a8f98;
    border-radius: 3pt; padding: 7pt 9pt; overflow-wrap: break-word; white-space: pre-wrap;
    break-inside: avoid; font-size: 8.6pt; line-height: 1.42;
  }
  pre code { background: none; padding: 0; font-size: inherit; }
  table {
    border-collapse: collapse; width: 100%; margin: 9pt 0;
    font-size: 9pt; break-inside: avoid;
  }
  th, td { border: 0.6pt solid #ccced2; padding: 3.5pt 5pt; text-align: left; vertical-align: top; }
  th { background: #eef0f3; font-weight: 600; }
  tr:nth-child(even) td { background: #fafbfc; }
  blockquote {
    margin: 9pt 0; padding: 5pt 11pt; border-left: 2.5pt solid #b9bdc4;
    background: #f8f9fa; color: #3a3a3a;
  }
  hr { border: none; border-top: 0.6pt solid #d5d7db; margin: 16pt 0; }
  ul, ol { padding-left: 17pt; margin: 6pt 0; }
  li { margin: 2.5pt 0; }
  img, svg { max-width: 100%; height: auto; }
  .mermaid-slot {
    break-inside: avoid; page-break-inside: avoid;
    margin: 12pt 0; text-align: center;
  }
  /* Scale a diagram down to fit a single page, preserving aspect ratio. */
  .mermaid-slot svg {
    max-width: 100% !important; max-height: 215mm !important;
    width: auto !important; height: auto !important;
  }
  /*
   * Diagrams that are far taller than they are wide cannot be fitted to one page without
   * shrinking the labels into illegibility, so they are allowed full width and may span
   * pages instead.
   */
  .mermaid-slot.tall { break-inside: auto; page-break-inside: auto; }
  .mermaid-slot.tall svg { max-height: none !important; width: 100% !important; }
  .mermaid-error {
    border: 0.8pt dashed #c0392b; color: #922b21; background: #fdf3f2;
    padding: 7pt; font-size: 9pt; border-radius: 3pt;
  }
  .doc-meta {
    font-size: 8.6pt; color: #6a6f76; margin: 0 0 14pt;
    border-bottom: 0.6pt dotted #d5d7db; padding-bottom: 7pt;
  }
`;

const buildHtml = (bodyHtml, diagrams, sourcePath) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><style>${STYLES}</style></head>
<body>
<div class="doc-meta">
  Source: ${sourcePath} &nbsp;·&nbsp; Generated ${new Date().toISOString().slice(0, 10)}
  &nbsp;·&nbsp; campus-pulse / Senior Project II
</div>
${bodyHtml}
<script id="diagram-data" type="application/json">${JSON.stringify(diagrams).replace(/</g, "\\u003c")}</script>
</body></html>`;

/**
 * Renders every placeholder in the page. Runs inside the browser, after mermaid.min.js has
 * been injected, and resolves only once all diagrams have produced SVG — otherwise the PDF
 * would be printed with empty boxes where the diagrams belong.
 */
const RENDER_DIAGRAMS = async () => {
  const data = JSON.parse(document.getElementById("diagram-data").textContent);
  // eslint-disable-next-line no-undef
  const mermaid = window.mermaid;
  // useMaxWidth: false makes Mermaid emit real dimensions instead of an inline max-width,
  // which lets the print stylesheet scale each diagram to the page.
  mermaid.initialize({
    startOnLoad: false,
    theme: "neutral",
    securityLevel: "loose",
    flowchart: { htmlLabels: true, useMaxWidth: false },
    sequence: { useMaxWidth: false },
  });

  const slots = [...document.querySelectorAll(".mermaid-slot")];
  const failures = [];
  const TALL_RATIO = 2.0;

  for (const slot of slots) {
    const source = data[Number(slot.dataset.index)];
    const id = `mmd-${slot.dataset.index}`;
    try {
      const { svg } = await mermaid.render(id, source);
      slot.innerHTML = svg;

      const box = slot.querySelector("svg")?.viewBox?.baseVal;
      if (box && box.width > 0 && box.height / box.width > TALL_RATIO) {
        slot.classList.add("tall");
      }
    } catch (err) {
      failures.push(`diagram ${slot.dataset.index}: ${err?.message ?? err}`);
      slot.innerHTML =
        `<div class="mermaid-error"><strong>Diagram failed to render.</strong>` +
        `<pre>${source.replace(/</g, "&lt;")}</pre></div>`;
    }
  }
  // Stray nodes Mermaid leaves behind when measuring text.
  document.querySelectorAll("[id^='dmmd-']").forEach((n) => n.remove());
  return { rendered: slots.length - failures.length, total: slots.length, failures };
};

const renderDoc = async (browser, mermaidJs, mdPath) => {
  const raw = readFileSync(mdPath, "utf8");
  const { withPlaceholders, diagrams } = extractMermaid(raw);
  const bodyHtml = marked.parse(withPlaceholders, { gfm: true, breaks: false });

  const page = await browser.newPage();
  await page.setContent(buildHtml(bodyHtml, diagrams, mdPath), { waitUntil: "load" });

  let result = { rendered: 0, total: diagrams.length, failures: [] };
  if (diagrams.length > 0) {
    await page.addScriptTag({ content: mermaidJs });
    result = await page.evaluate(RENDER_DIAGRAMS);
  }

  const outPath = join(OUT_DIR, basename(mdPath).replace(/\.md$/i, ".pdf"));
  await page.pdf({
    path: outPath,
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: "<div></div>",
    footerTemplate:
      `<div style="width:100%;font-size:7.5pt;color:#8a8f98;padding:0 14mm;` +
      `font-family:'Segoe UI',Arial,sans-serif;display:flex;justify-content:space-between;">` +
      `<span>${basename(mdPath)}</span>` +
      `<span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
    margin: { top: "16mm", bottom: "18mm", left: "14mm", right: "14mm" },
  });
  await page.close();

  return { outPath, ...result };
};

const main = async () => {
  const docs = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_DOCS;
  const missing = docs.filter((d) => !existsSync(d));
  if (missing.length) throw new Error(`Not found: ${missing.join(", ")}`);

  mkdirSync(OUT_DIR, { recursive: true });

  const mermaidJs = readFileSync(
    resolve("node_modules/mermaid/dist/mermaid.min.js"),
    "utf8",
  );

  const executablePath = findChrome();
  console.log(`Browser: ${executablePath}\n`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
  });

  let failed = 0;
  try {
    for (const doc of docs) {
      const r = await renderDoc(browser, mermaidJs, doc);
      const diag = r.total ? `${r.rendered}/${r.total} diagrams` : "no diagrams";
      console.log(`${r.failures.length ? "WARN" : "ok  "}  ${r.outPath}  (${diag})`);
      for (const f of r.failures) {
        console.log(`        ! ${f}`);
        failed++;
      }
    }
  } finally {
    await browser.close();
  }

  if (failed > 0) {
    console.log(`\n${failed} diagram(s) failed to render — see warnings above.`);
    process.exitCode = 1;
  } else {
    console.log(`\nDone. PDFs written to ${OUT_DIR}/`);
  }
};

main().catch((err) => {
  console.error(`\nbuild-pdf failed: ${err.message}`);
  process.exit(1);
});
