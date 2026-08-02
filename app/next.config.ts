import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Photos are hosted on Cloudinary (see src/lib/cloudinary.ts / UploadPhotoModal).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
