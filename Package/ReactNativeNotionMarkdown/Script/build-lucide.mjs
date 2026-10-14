import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const Require = createRequire(import.meta.url);
let LucideAvailable = true;
try {
  Require.resolve("lucide-react-native");
} catch {
  LucideAvailable = false;
}

if (!LucideAvailable) process.exit(0);

const TypeScript = Require.resolve("typescript/bin/tsc");
const Result = spawnSync(process.execPath, [TypeScript, "-p", "./tsconfig.lucide.json"], { stdio: "inherit" });
process.exit(Result.status ?? 1);
