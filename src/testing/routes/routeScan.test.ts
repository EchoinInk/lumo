import fs from "fs";
import path from "path";
import { assertEqual } from "../testUtils";

const rootDir = path.resolve(__dirname, "../../..");
const appDir = path.join(rootDir, "app");

function collectRouteFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectRouteFiles(entryPath);
    }
    return entry.name.endsWith(".tsx") ? [entryPath] : [];
  });
}

export function testPrimaryTabRoutesExist(): void {
  const tabsLayout = fs.readFileSync(
    path.join(appDir, "(tabs)", "_layout.tsx"),
    "utf8",
  );

  assertEqual(tabsLayout.includes('title: "Dashboard"'), true, "Dashboard tab");
  assertEqual(tabsLayout.includes('title: "Tasks"'), true, "Tasks tab");
  assertEqual(tabsLayout.includes('title: "Calendar"'), true, "Calendar tab");
  assertEqual(tabsLayout.includes('title: "Health"'), true, "Health tab");
  assertEqual(tabsLayout.includes('title: "More"'), true, "More tab");
}

export function testDailyReliefRoutesExist(): void {
  const routes = collectRouteFiles(appDir).map((file) =>
    path.relative(appDir, file),
  );

  const required = [
    "brain-dump/index.tsx",
    "parked/index.tsx",
    "planning/morning.tsx",
    "planning/evening.tsx",
    "routine-bundles/index.tsx",
    "reminder-settings/index.tsx",
    "(tabs)/index.tsx",
    "(tabs)/tasks.tsx",
  ];

  for (const route of required) {
    assertEqual(
      routes.includes(route),
      true,
      `expected route file ${route}`,
    );
  }
}

export function testSrcAppDoesNotExist(): void {
  assertEqual(
    fs.existsSync(path.join(rootDir, "src", "app")),
    false,
    "src/app should not exist",
  );
}

export function testDeferredAccountRoutesStayOutOfLocalRelease(): void {
  const routes = collectRouteFiles(appDir).map((file) =>
    path.relative(appDir, file),
  );
  const moreScreen = fs.readFileSync(
    path.join(appDir, "(tabs)", "more", "index.tsx"),
    "utf8",
  );

  assertEqual(
    routes.some(
      (route) => route.startsWith("auth/") || route === "(tabs)/more/account.tsx",
    ),
    false,
    "deferred account screens must not be Expo Router routes",
  );
  assertEqual(
    moreScreen.includes("more/account"),
    false,
    "local More menu must not link to the deferred account surface",
  );
}

export function testAppRouteCountIsStable(): void {
  const routes = collectRouteFiles(appDir);
  assertEqual(routes.length >= 35, true, "app route files should remain present");
}
