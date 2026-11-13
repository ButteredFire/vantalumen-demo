import fs from 'node:fs';
import path from 'node:path';
import { Document, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, draco } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';

/**
 * 1. Sao chép các bộ giải mã WASM/JS của Draco và Basis từ thư viện Three.js sang public/decoders/
 */
function copyThreeDecoders() {
  const pairs = [
    {
      src: path.resolve('node_modules/three/examples/jsm/libs/draco/gltf'),
      dest: path.resolve('public/decoders/draco'),
    },
    {
      src: path.resolve('node_modules/three/examples/jsm/libs/basis'),
      dest: path.resolve('public/decoders/basis'),
    },
  ];

  for (const { src, dest } of pairs) {
    if (!fs.existsSync(src)) continue;
    fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      fs.copyFileSync(path.join(src, file), path.join(dest, file));
    }
    console.log(`[Decoders] Đã đồng bộ WASM/JS decoders vào: ${dest}`);
  }
}

/**
 * Sinh lưới hình cầu biến dạng (Asteroid / Moon) hoặc tàu vũ trụ đa diện cho các cấp LOD
 */
function createDisplacedSphereGeometry(
  doc,
  buffer,
  { radius = 1, widthSegments = 32, heightSegments = 24, irregularity = 0.22, seed = 1 },
) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let y = 0; y <= heightSegments; y++) {
    const v = y / heightSegments;
    const phi = v * Math.PI;

    for (let x = 0; x <= widthSegments; x++) {
      const u = x / widthSegments;
      const theta = u * Math.PI * 2;

      const nx = -Math.cos(theta) * Math.sin(phi);
      const ny = Math.cos(phi);
      const nz = Math.sin(theta) * Math.sin(phi);

      // Tạo hình dáng củ khoai tây đặc trưng của Phobos/Deimos + hố va chạm Stickney
      const harmonic1 = Math.sin(nx * 3.1 + seed) * Math.cos(ny * 2.7 - seed) * irregularity;
      const harmonic2 = Math.cos(nz * 5.3 + seed * 2) * (irregularity * 0.45);
      const crater =
        nx > 0.45 ? -Math.pow((nx - 0.45) * 1.4, 2) * (irregularity * 1.35) : 0;

      const r = radius * (1 + harmonic1 + harmonic2 + crater);

      positions.push(nx * r, ny * r * 0.82, nz * r * 0.9);
      normals.push(nx, ny, nz);
      uvs.push(u, v);
    }
  }

  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < widthSegments; x++) {
      const a = y * (widthSegments + 1) + x;
      const b = a + widthSegments + 1;
      const c = a + 1;
      const d = b + 1;

      indices.push(a, b, c);
      indices.push(c, b, d);
    }
  }

  const posAccessor = doc
    .createAccessor()
    .setType('VEC3')
    .setArray(new Float32Array(positions))
    .setBuffer(buffer);
  const normAccessor = doc
    .createAccessor()
    .setType('VEC3')
    .setArray(new Float32Array(normals))
    .setBuffer(buffer);
  const uvAccessor = doc
    .createAccessor()
    .setType('VEC2')
    .setArray(new Float32Array(uvs))
    .setBuffer(buffer);
  const idxAccessor = doc
    .createAccessor()
    .setType('SCALAR')
    .setArray(new Uint16Array(indices))
    .setBuffer(buffer);

  return doc
    .createPrimitive()
    .setAttribute('POSITION', posAccessor)
    .setAttribute('NORMAL', normAccessor)
    .setAttribute('TEXCOORD_0', uvAccessor)
    .setIndices(idxAccessor);
}

async function buildAndSaveDracoGlb(io, outputPath, builderFn) {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene('DefaultScene');

  builderFn(doc, buffer, scene);

  await doc.transform(
    dedup(),
    prune(),
    draco({
      method: 'edgebreaker',
      quantizePosition: 14,
      quantizeNormal: 10,
      quantizeTexcoord: 12,
    }),
  );

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await io.write(outputPath, doc);
  console.log(`[LOD Generator] Đã xuất mô hình nén Draco: ${outputPath}`);
}

async function generateAllModels() {
  copyThreeDecoders();

  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'draco3d.encoder': await draco3d.createEncoderModule(),
    });

  // 1. Phobos Draco GLB
  await buildAndSaveDracoGlb(
    io,
    path.resolve('public/assets/models/moons/phobos_draco.glb'),
    (doc, buffer, scene) => {
      const mat = doc
        .createMaterial('PhobosRegolith')
        .setBaseColorFactor([0.52, 0.44, 0.39, 1.0])
        .setRoughnessFactor(0.92)
        .setMetallicFactor(0.05);
      const prim = createDisplacedSphereGeometry(doc, buffer, {
        radius: 1,
        widthSegments: 48,
        heightSegments: 36,
        irregularity: 0.24,
        seed: 1.7,
      }).setMaterial(mat);
      const mesh = doc.createMesh('PhobosMesh').addPrimitive(prim);
      scene.addChild(doc.createNode('PhobosNode').setMesh(mesh));
    },
  );

  // 2. Deimos Draco GLB
  await buildAndSaveDracoGlb(
    io,
    path.resolve('public/assets/models/moons/deimos_draco.glb'),
    (doc, buffer, scene) => {
      const mat = doc
        .createMaterial('DeimosRegolith')
        .setBaseColorFactor([0.62, 0.55, 0.48, 1.0])
        .setRoughnessFactor(0.88)
        .setMetallicFactor(0.04);
      const prim = createDisplacedSphereGeometry(doc, buffer, {
        radius: 1,
        widthSegments: 40,
        heightSegments: 30,
        irregularity: 0.18,
        seed: 4.2,
      }).setMaterial(mat);
      const mesh = doc.createMesh('DeimosMesh').addPrimitive(prim);
      scene.addChild(doc.createNode('DeimosNode').setMesh(mesh));
    },
  );

  // 3. Mars Reconnaissance Orbiter & Ares Station LOD0 / LOD1
  const spacecraftTargets = [
    {
      path: 'public/assets/models/spacecraft/mars_reconnaissance_orbiter.glb',
      segments: 28,
      color: [0.85, 0.72, 0.32, 1.0],
    },
    {
      path: 'public/assets/models/spacecraft/perseverance_rover.glb',
      segments: 24,
      color: [0.88, 0.86, 0.82, 1.0],
    },
    {
      path: 'public/assets/models/stations/ares_orbital_station_lod0.glb',
      segments: 36,
      color: [0.78, 0.84, 0.92, 1.0],
    },
    {
      path: 'public/assets/models/stations/ares_orbital_station_lod1.glb',
      segments: 16,
      color: [0.78, 0.84, 0.92, 1.0],
    },
  ];

  for (const item of spacecraftTargets) {
    await buildAndSaveDracoGlb(io, path.resolve(item.path), (doc, buffer, scene) => {
      const mat = doc
        .createMaterial('SpacecraftHull')
        .setBaseColorFactor(item.color)
        .setRoughnessFactor(0.35)
        .setMetallicFactor(0.82);
      const prim = createDisplacedSphereGeometry(doc, buffer, {
        radius: 1,
        widthSegments: item.segments,
        heightSegments: item.segments,
        irregularity: 0.08,
        seed: 9.1,
      }).setMaterial(mat);
      const mesh = doc.createMesh('SpacecraftMesh').addPrimitive(prim);
      scene.addChild(doc.createNode('SpacecraftNode').setMesh(mesh));
    });
  }
}

generateAllModels().catch((err) => {
  console.error('[LOD Generator] Lỗi:', err);
  process.exit(1);
});
