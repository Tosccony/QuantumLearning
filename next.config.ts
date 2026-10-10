import type { NextConfig } from "next";

// Browser calls go to /api/qiskit/* and are proxied to the Python Qiskit service.
const QISKIT_URL = process.env.QISKIT_URL ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/qiskit/:path*", destination: `${QISKIT_URL}/:path*` }];
  },
};

export default nextConfig;
