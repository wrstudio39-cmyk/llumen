"use client";

import { motion } from "framer-motion";

export default function HeroBlob() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -left-32 -top-40 h-[420px] w-[420px] rounded-full bg-accent-400/20 blur-[110px]"
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-24 top-10 h-[360px] w-[360px] rounded-full bg-accent-300/20 blur-[110px]"
        animate={{ x: [0, -20, 0], y: [0, 25, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(59,108,244,0.08),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(59,108,244,0.06),transparent_40%)]" />
    </div>
  );
}
