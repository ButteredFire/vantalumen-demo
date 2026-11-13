import fs from 'node:fs';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, draco, textureCompress } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';

export async function optimizeSpaceAsset(inputPath, outputPath) {
  if (!fs.existsSync(inputPath)) {
    console.warn(`[Pipeline] Bỏ qua vì chưa có tệp nguồn: ${inputPath}`);
    return false;
  }

  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'draco3d.encoder': await draco3d.createEncoderModule(),
    });

  const document = await io.read(inputPath);

  await document.transform(
    dedup(), // Loại bỏ các buffer và material trùng lặp
    prune(), // Dọn dẹp các node rỗng từ Blender
    // Nén lưới hình học bằng Google Draco
    draco({
      method: 'edgebreaker',
      quantizePosition: 14, // Giữ độ chính xác cao cho các chi tiết tàu vũ trụ
      quantizeNormal: 10,
      quantizeTexcoord: 12,
    }),
    // Chuyển đổi Texture sang chuẩn GPU KTX2 (Basis Universal)
    textureCompress({
      targetFormat: 'ktx2',
      slots: /^(baseColorTexture|normalTexture)$/,
      encoder: 'uastc', // UASTC cho chất lượng quang học cao nhất trên bề mặt hành tinh
      quality: 128,
    }),
  );

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await io.write(outputPath, document);
  console.log(`[Pipeline] Đã tối ưu hóa thành công: ${outputPath}`);
  return true;
}

// Chạy trực tiếp khi gọi qua CLI
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  optimizeSpaceAsset(
    './raw_assets/mars_reconnaissance_orbiter.glb',
    './public/assets/models/spacecraft/mars_reconnaissance_orbiter.glb',
  );
}
