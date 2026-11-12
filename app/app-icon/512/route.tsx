import { appIcon } from "@/lib/app-icon";

/** 512×512 PNG app icon for the manifest (Android splash screen, desktop install). Static: built once. */
export function GET() {
  return appIcon(512);
}
