import QRCode from "qrcode";
import { cloudinary } from "@/lib/cloudinary";

export async function generateAndUploadQRCode(
  plantId: string,
  appUrl: string
): Promise<{ imageUrl: string; encodedUrl: string; generatedAt: Date }> {
  const encodedUrl = `${appUrl}/fr/plant/${plantId}`;

  // toDataURL with options — `type` lives at the top level, not nested
  const qrDataUrl = await QRCode.toDataURL(encodedUrl, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 300,
  });

  const result = await cloudinary.uploader.upload(qrDataUrl, {
    folder: "verde-garden/qr-codes",
    public_id: `qr-${plantId}`,
    overwrite: true,
  });

  return {
    imageUrl: result.secure_url,
    encodedUrl,
    generatedAt: new Date(),
  };
}

export async function deleteQRCodeFromCloudinary(plantId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(`verde-garden/qr-codes/qr-${plantId}`);
  } catch {
    // Non-fatal — best effort cleanup
  }
}
