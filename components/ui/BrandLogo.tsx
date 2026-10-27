/** Round brand badge: first letter on a colour derived from the brand name. */
export function BrandLogo({ brand }: { brand: string }) {
  let hue = 0;
  for (const char of brand) hue = (hue * 31 + char.charCodeAt(0)) % 360;

  return (
    <span
      aria-hidden="true"
      className="grid size-8 shrink-0 place-items-center rounded-full text-small font-bold text-white"
      style={{ backgroundColor: `hsl(${hue} 55% 42%)` }}
    >
      {brand.charAt(0).toUpperCase()}
    </span>
  );
}
