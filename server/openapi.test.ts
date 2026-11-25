import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// docs/openapi.json is the API contract. These checks keep it from drifting away from the
// routes in server/app.ts, without needing a database or any extra package.
const METHODS = ["get", "post", "put", "delete"] as const;
interface Operation {
  operationId?: string;
  parameters?: { name: string; in: string }[];
  responses?: Record<string, unknown>;
  security?: unknown[];
}
interface Spec {
  openapi: string;
  paths: Record<string, Partial<Record<(typeof METHODS)[number], Operation>>>;
  components: { schemas: Record<string, unknown> };
}

const load = async () => {
  const spec = JSON.parse(await readFile(new URL("../docs/openapi.json", import.meta.url), "utf8")) as Spec;
  const source = await readFile(new URL("./app.ts", import.meta.url), "utf8");
  return { spec, source };
};
const documented = (spec: Spec) => Object.entries(spec.paths).flatMap(([path, item]) =>
  METHODS.filter(method => item[method]).map(method => `${method.toUpperCase()} ${path}`)).sort();
const served = (source: string) => [...source.matchAll(/app\.(get|post|put|delete)\("(\/api\/[^"]*)"/g)]
  .map(match => `${match[1].toUpperCase()} ${match[2].replace(/:(\w+)/g, "{$1}")}`).sort();

describe("OpenAPI contract", () => {
  it("documents exactly the routes that the API serves", async () => {
    const { spec, source } = await load();
    assert.ok(served(source).length > 0, "no routes found in server/app.ts");
    assert.deepEqual(documented(spec), served(source));
  });

  it("gives every operation a unique id, its path parameters, and a 401 unless it is public", async () => {
    const { spec } = await load();
    const ids = new Set<string>();
    for (const [path, item] of Object.entries(spec.paths)) {
      for (const method of METHODS) {
        const operation = item[method];
        if (!operation) continue;
        const label = `${method.toUpperCase()} ${path}`;
        assert.ok(operation.operationId, `${label} needs an operationId`);
        assert.ok(!ids.has(operation.operationId), `${label} repeats operationId ${operation.operationId}`);
        ids.add(operation.operationId);
        const declared = (operation.parameters ?? []).filter(p => p.in === "path").map(p => p.name).sort();
        const inPath = [...path.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
        assert.deepEqual(declared, inPath, `${label} must declare its path parameters`);
        const isPublic = path === "/api/health" || path.startsWith("/api/auth/");
        assert.equal(isPublic ? operation.security?.length === 0 : "401" in (operation.responses ?? {}), true, `${label} has the wrong auth documentation`);
        assert.ok("500" in (operation.responses ?? {}), `${label} documents no 500`);
      }
    }
  });

  it("only refers to schemas that exist", async () => {
    const { spec } = await load();
    const text = JSON.stringify(spec);
    const refs = [...text.matchAll(/"\$ref":\s*"#\/components\/schemas\/(\w+)"/g)].map(match => match[1]);
    assert.ok(refs.length > 0);
    for (const name of new Set(refs)) assert.ok(name in spec.components.schemas, `missing schema ${name}`);
    assert.equal(/"\$ref":\s*"(?!#\/components\/schemas\/)/.test(text), false, "unsupported $ref target");
  });
});
