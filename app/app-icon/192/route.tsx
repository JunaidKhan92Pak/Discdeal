import { appIcon } from "@/lib/app-icon";

/** 192×192 PNG app icon for the manifest (Android home screen, install prompt). Static: built once. */
export function GET() {
  return appIcon(192);
}
