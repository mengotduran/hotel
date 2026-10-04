import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Builds the web logo assets from the supplied artwork.
 *
 * The source file is an SVG wrapper around a transparent PNG, so there is no
 * vector geometry to scale from. These are rendered once at the sizes the site
 * actually uses, rather than shipping the 600 KB original to every visitor.
 */

const SOURCE = path.join(process.cwd(), "brand", "frima-logo.svg");
const OUT = path.join(process.cwd(), "public", "brand");

/** Widths cover 2x of the largest place the logo appears. */
const WIDTHS = [320, 640];

/**
 * Rebuilds the artwork as a flat white silhouette, keeping the original's
 * alpha channel so edges stay anti-aliased. Used over a photograph or a dark
 * scrim, where the navy of the real mark would otherwise sit close in value
 * to the background behind it and lose contrast.
 */
async function whiteSilhouette(source: Buffer): Promise<Buffer> {
  const { width, height } = await sharp(source).metadata();
  const alpha = await sharp(source).ensureAlpha().extractChannel(3).raw().toBuffer();
  const white = await sharp({
    create: { width: width!, height: height!, channels: 3, background: "#ffffff" },
  })
    .raw()
    .toBuffer();

  return sharp(white, { raw: { width: width!, height: height!, channels: 3 } })
    .joinChannel(alpha, { raw: { width: width!, height: height!, channels: 1 } })
    .png()
    .toBuffer();
}

async function main() {
  const svg = readFileSync(SOURCE, "utf8");
  const match = /href="data:image\/(png|jpeg);base64,([^"]+)"/.exec(svg);
  if (!match) throw new Error("No embedded bitmap found in the source file.");

  const source = Buffer.from(match[2], "base64");
  mkdirSync(OUT, { recursive: true });

  const meta = await sharp(source).metadata();
  console.log(`\nsource ${meta.width}x${meta.height}, alpha ${meta.hasAlpha}\n`);

  const white = await whiteSilhouette(source);

  for (const width of WIDTHS) {
    const base = sharp(source).resize({ width, withoutEnlargement: true });
    const baseWhite = sharp(white).resize({ width, withoutEnlargement: true });

    // No palette quantisation: the mark is built from blue and gold gradients
    // and a 256-colour palette bands them visibly.
    const png = await base.clone().png({ compressionLevel: 9 }).toBuffer();
    const webp = await base.clone().webp({ quality: 90, alphaQuality: 100 }).toBuffer();
    const whitePng = await baseWhite.clone().png({ compressionLevel: 9 }).toBuffer();
    const whiteWebp = await baseWhite.clone().webp({ quality: 90, alphaQuality: 100 }).toBuffer();

    writeFileSync(path.join(OUT, `logo-${width}.png`), png);
    writeFileSync(path.join(OUT, `logo-${width}.webp`), webp);
    writeFileSync(path.join(OUT, `logo-white-${width}.png`), whitePng);
    writeFileSync(path.join(OUT, `logo-white-${width}.webp`), whiteWebp);

    const out = await sharp(png).metadata();
    console.log(
      `  logo-${width}        ${out.width}x${out.height}   png ${(png.length / 1024).toFixed(0)} KB   webp ${(webp.length / 1024).toFixed(0)} KB`,
    );
    console.log(
      `  logo-white-${width}  ${out.width}x${out.height}   png ${(whitePng.length / 1024).toFixed(0)} KB   webp ${(whiteWebp.length / 1024).toFixed(0)} KB`,
    );
  }
  console.log();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
