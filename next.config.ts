import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "ws",
    "@neondatabase/serverless",
    "pdf-parse",
    "pdfjs-dist",
    "@napi-rs/canvas",
    "exceljs",
    "xlsx",
  ],
  outputFileTracingIncludes: {
    "/api/portfolio/msx/import": [
      "./node_modules/pdf-parse/**/*",
      "./node_modules/pdfjs-dist/**/*",
      "./node_modules/@napi-rs/canvas/**/*",
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
    proxyClientMaxBodySize: "15mb",
  },
};

export default nextConfig;