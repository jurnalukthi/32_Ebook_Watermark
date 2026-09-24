import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface WatermarkOptions {
  pdfBuffer: ArrayBuffer | Uint8Array;
  email: string;
  orderId?: string;
}

export async function applyWatermark(options: WatermarkOptions): Promise<Uint8Array> {
  const { pdfBuffer, email, orderId } = options;
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const mainWatermark = orderId
    ? `Eksklusif untuk: ${email} | Ref: ${orderId}`
    : `Eksklusif untuk: ${email}`;

  const footerText = `Dilisensikan resmi kepada ${email} - Jangan disebarluaskan`;

  for (const page of pages) {
    const { width, height } = page.getSize();

    page.drawText(mainWatermark, {
      x: width / 6,
      y: height / 2,
      size: 16,
      font,
      color: rgb(0.65, 0.65, 0.65),
      opacity: 0.22,
      rotate: degrees(45),
    });

    page.drawText(footerText, {
      x: 30,
      y: 18,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
      opacity: 0.55,
    });
  }

  return pdfDoc.save();
}
