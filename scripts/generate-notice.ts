import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "node:fs/promises";

async function generateA5Notice() {
  const W = 419.53;
  const H = 595.28;
  const CW = W - 88;
  const TX = 56;
  const TMW = CW - 24;

  const doc = await PDFDocument.create();
  const page = doc.addPage([W, H]);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  const fr = fontRegular;
  const fb = fontBold;

  function wrapDraw(text: string, x: number, y: number, fs: number, mw: number, color: any, font = fontRegular): number {
    const words = text.split(" ");
    let line = "";
    let cy = y;

    for (const w of text.split(" ")) {
      const test = line + (line ? " " : "") + w;
      if (fontRegular.widthOfTextAtSize(test, fs) > mw && line) {
        page.drawText(line, { x, y, size: fs, font, color });
        line = w;
        y -= fs + 2;
      } else {
        line = test;
      }
    }
    if (line) page.drawText(line, { x, y, size: fs, font, color });
    return y - fs - 2;
  }

  // Outer border
  page.drawRectangle({ x: 24, y: 24, width: W - 48, height: H - 48, borderColor: rgb(0.85, 0.88, 0.92), borderWidth: 1, color: rgb(0.99, 1, 1) });
  page.drawRectangle({ x: 24, y: H - 32, width: W - 48, height: 8, color: rgb(0.06, 0.09, 0.16) });

  page.drawText("PEMBERITAHUAN PENGIRIMAN E-BOOK", { x: 44, y: H - 68, size: 10, font: fontBold, color: rgb(0.4, 0.45, 0.55) });
  page.drawText("Terima Kasih atas Pesanan Anda", { x: 44, y: H - 100, size: 18, font: fontBold, color: rgb(0.06, 0.09, 0.16) });

  // Intro
  let cy = wrapDraw("E-book eksklusif yang Anda beli sedang dipersiapkan oleh sistem kami:", 44, H - 128, 10, W - 88, rgb(0.2, 0.25, 0.3), fontRegular);

  // Book title box
  const by = H - 188;
  page.drawRectangle({ x: 44, y: by, width: W - 88, height: 48, color: rgb(0.96, 0.97, 0.99), borderColor: rgb(0.85, 0.88, 0.94), borderWidth: 1 });
  page.drawText("Judul E-Book:", { x: 58, y: by + 30, size: 8.5, font: fontRegular, color: rgb(0.45, 0.5, 0.6) });
  page.drawText("The Incredible PyTorch", { x: 58, y: by + 12, size: 13, font: fontBold, color: rgb(0.06, 0.09, 0.16) });

  // Delivery text
  cy = wrapDraw("Tautan unduhan privat dengan tanda air digital (watermark) sedang kami terbitkan dan dikirimkan otomatis ke alamat email transaksi Anda di Lynk.id.", 44, H - 216, 9.5, W - 88, rgb(0.25, 0.3, 0.35), fontRegular);

  // Callout box
  const cby = H - 310;
  const cbh = 80;
  page.drawRectangle({ x: 44, y: cby, width: W - 88, height: 80, color: rgb(0.95, 0.98, 0.95), borderColor: rgb(0.78, 0.9, 0.8), borderWidth: 1 });
  page.drawText("PENTING - Periksa Email Secara Berkala:", { x: 56, y: cby + 60, size: 9.5, font: fontBold, color: rgb(0.1, 0.5, 0.2) });

  let cy2 = cby + 42;
  wrapDraw("Mohon cek kotak masuk email Anda dalam beberapa menit ke depan.", 56, cby + 42, 8.5, W - 88 - 24, rgb(0.15, 0.35, 0.2), fontRegular);
  wrapDraw("Pastikan juga memeriksa folder Spam / Junk / Promosi apabila email tidak langsung muncul di kotak masuk utama.", 56, cby + 26, 8.5, W - 88 - 24, rgb(0.15, 0.35, 0.2), fontRegular);

  // Divider
  page.drawLine({ start: { x: 44, y: H - 340 }, end: { x: 419.53 - 44, y: H - 340 }, thickness: 1, color: rgb(0.9, 0.92, 0.95) });

  // Help section
  const hby = H - 480;
  page.drawRectangle({ x: 44, y: hby, width: 419.53 - 88, height: 118, color: rgb(0.98, 0.98, 0.99), borderColor: rgb(0.88, 0.9, 0.94), borderWidth: 1 });
  page.drawText("Bantuan & Layanan Pelanggan", { x: 58, y: hby + 96, size: 10.5, font: fontBold, color: rgb(0.1, 0.15, 0.2) });

  let hy = wrapDraw("Apabila dalam waktu 1 jam email konfirmasi belum Anda terima,", 58, hby + 78, 9, 419.53 - 88 - 24, rgb(0.35, 0.4, 0.45), fontRegular);
  wrapDraw("silakan langsung hubungi kami melalui kontak berikut:", 58, hy - 14, 9, 419.53 - 88 - 24, rgb(0.35, 0.4, 0.45), fontRegular);

  page.drawText("WhatsApp :", { x: 58, y: hby + 34, size: 9.5, font: fontBold, color: rgb(0.15, 0.2, 0.25) });
  page.drawText("0851-5675-7562", { x: 126, y: hby + 34, size: 10, font: fontBold, color: rgb(0.08, 0.5, 0.25) });
  page.drawText("Email        :", { x: 58, y: hby + 16, size: 9.5, font: fontBold, color: rgb(0.15, 0.2, 0.25) });
  page.drawText("jurnalukthi@gmail.com", { x: 126, y: hby + 16, size: 10, font: fontBold, color: rgb(0.1, 0.35, 0.75) });

  // Footer
  page.drawText("Layanan Distribusi E-Book Privat & Terproteksi", { x: 44, y: 44, size: 8.5, font: fontRegular, color: rgb(0.55, 0.6, 0.65) });

  const pdfBytes = await doc.save();
  await fs.writeFile("notices/The_Incredible_PyTorch_Notice.pdf", pdfBytes);
  console.log("PDF generated successfully");
}

generateA5Notice().catch(console.error);