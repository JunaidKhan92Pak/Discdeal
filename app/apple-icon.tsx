import { appIcon } from "@/lib/app-icon";

/** The icon an iPhone or iPad shows when DiscDeal is added to the home screen (Share → Add to Home Screen). */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return appIcon(180);
}
