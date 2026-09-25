import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface WatermarkOptions {
  pdfBuffer: ArrayBuffer | Uint8Array;
  email: string;
  name?: string;
}

const VERTICAL_WATERMARK_MARGIN_RIGHT = 18;
const VERTICAL_WATERMARK_MARGIN_TOP = 60;
const VERTICAL_WATERMARK_FONT_SIZE = 10;
const VERTICAL_WATERMARK_OPACITY = 0.35;
const VERTICAL_WATERMARK_ROTATION = -90;

const FOOTER_MARGIN_LEFT = 30;
const FOOTER_MARGIN_BOTTOM = 18;
const FOOTER_FONT_SIZE = 8;
const FOOTER_OPACITY = 0.55;

export async function applyWatermark(options: WatermarkOptions): Promise<Uint8Array> {
  const { pdfBuffer, email, name } = options;
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const mainWatermark = email;
  const licensedTo = name && name.trim().length > 0 ? name.trim() : email;
  const footerText = `Dilisensikan resmi kepada ${licensedTo} - Jangan disebarluaskan`;

  const watermarkColor = rgb(0.6, 0.6, 0.6);
  const footerColor = rgb(0.5, 0.5, 0.5);

  for (const page of pages) {
    const { width, height } = page.getSize();

    page.drawText(mainWatermark, {
      x: width - VERTICAL_WATERMARK_MARGIN_RIGHT,
      y: height - VERTICAL_WATERMARK_MARGIN_TOP,
      size: VERTICAL_WATERMARK_FONT_SIZE,
      font,
      color: watermarkColor,
      opacity: VERTICAL_WATERMARK_OPACITY,
      rotate: degrees(VERTICAL_WATERMARK_ROTATION),
    });

    page.drawText(footerText, {
      x: FOOTER_MARGIN_LEFT,
      y: FOOTER_MARGIN_BOTTOM,
      size: FOOTER_FONT_SIZE,
      font,
      color: footerColor,
      opacity: FOOTER_OPACITY,
    });
  }

  return pdfDoc.save();
}
