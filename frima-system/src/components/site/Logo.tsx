/**
 * The FRIMA lockup: the emblem above FRIMA and GUEST SUITES.
 *
 * The supplied artwork is a transparent bitmap wrapped in an SVG tag, so there
 * is no vector geometry to scale from. `brand/build-logo.ts` renders it once
 * into the sizes the site uses, plus a white silhouette built from the same
 * alpha channel, rather than shipping the 600 KB original to every visitor.
 *
 * Over a photograph, or on the navy footer, the navy of the real mark can sit
 * close in value to what's behind it and lose contrast — so `invert` cross-
 * fades to the white silhouette instead of swapping instantly. The two
 * versions are stacked and faded with opacity, so there is no layout shift
 * and no hard cut between them.
 */

export function FrimaLogo({
  size = "header",
  invert = false,
  priority = false,
  className = "",
}: {
  size?: "header" | "footer";
  invert?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const box = size === "header" ? "h-11 sm:h-12 lg:h-14" : "h-20 sm:h-24";
  const sizes =
    size === "header"
      ? "(min-width: 1024px) 72px, 56px"
      : "(min-width: 640px) 122px, 102px";

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <picture
        className={`block transition-opacity duration-500 ease-out ${
          invert ? "opacity-0" : "opacity-100"
        }`}
      >
        <source
          type="image/webp"
          srcSet="/brand/logo-320.webp 320w, /brand/logo-640.webp 640w"
          sizes={sizes}
        />
        <img
          src="/brand/logo-320.png"
          srcSet="/brand/logo-320.png 320w, /brand/logo-640.png 640w"
          sizes={sizes}
          width={1039}
          height={820}
          alt="FRIMA Guest Suites"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className={`${box} block w-auto object-contain`}
        />
      </picture>

      {/* White silhouette, stacked exactly on top and cross-faded in. */}
      <span
        aria-hidden="true"
        className={`absolute inset-0 transition-opacity duration-500 ease-out ${
          invert ? "opacity-100" : "opacity-0"
        }`}
      >
        <picture>
          <source
            type="image/webp"
            srcSet="/brand/logo-white-320.webp 320w, /brand/logo-white-640.webp 640w"
            sizes={sizes}
          />
          <img
            src="/brand/logo-white-320.png"
            srcSet="/brand/logo-white-320.png 320w, /brand/logo-white-640.png 640w"
            sizes={sizes}
            width={1039}
            height={820}
            alt=""
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className={`${box} block w-auto object-contain`}
          />
        </picture>
      </span>
    </span>
  );
}
