# Mars Orbital Atlas

Khung ứng dụng bản đồ Sao Hỏa 3D sử dụng React, TypeScript, Vite, React Three
Fiber và Cesium.

## Yêu cầu

- Node.js 20.19+ hoặc 22.12+
- npm

## Khởi chạy

```powershell
npm install
npm run dev
```

## Kiểm tra và build

```powershell
npm run typecheck
npm run build
```

Cesium được phục vụ từ `/cesium/`; các shader GLSL và tài nguyên WASM được cấu
hình trong Vite. Tài nguyên mô hình, texture, âm thanh và decoder được đặt dưới
`public/assets/` và `public/decoders/`. Các mô hình nguồn chưa xử lý đặt dưới
`raw_assets/`.
