import { Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import Lenis from "lenis";
import heroBg from "..//hero-bg.png";
// import bentoQr from "@/assets/bento-qr.jpg";
// import bentoShield from "@/assets/bento-shield.jpg";
// import bentoName from "@/assets/bento-name.jpg";
// import bentoMobile from "@/assets/bento-mobile.jpg";
// import bentoChat from "@/assets/bento-chat.jpg";

export default function Landing() {
  useEffect(() => {
    const lenis = new Lenis();
    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <main className="relative">
      {/* Sticky Hero */}
      <section className="sticky top-0 h-screen w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})`, filter: "blur(4px)", transform: "scale(1.05)" }}
        />
        <div className="absolute inset-0 bg-white/10" />

        {/* Navbar */}
        <nav className="relative z-20 mx-auto mt-6 flex w-[92%] max-w-5xl items-center justify-between rounded-full border border-white/30 bg-white/15 px-6 py-3 backdrop-blur-xl shadow-lg">
          <span className="text-xl font-semibold italic tracking-tight text-white" style={{ fontFamily: "Inter, sans-serif" }}>
            ZenSol
          </span>
          <div className="flex items-center gap-3">
            <Link to="/login" className="rounded-full px-4 py-1.5 text-sm font-medium text-white hover:text-white/80 transition">
              Sign in
            </Link>
            <Link to="/register" className="rounded-full bg-[#0a1f44] px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-[#0a1f44]/90 transition">
              Sign up
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex h-[calc(100vh-6rem)] flex-col items-center justify-center px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="max-w-4xl text-5xl font-bold leading-tight tracking-tight text-[#0a1f44] sm:text-6xl md:text-7xl"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Making Payment<br />Private &amp; Simple
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link to="/register" className="rounded-full bg-[#0a1f44] px-8 py-3 text-base font-semibold text-white shadow-xl hover:bg-[#0a1f44]/90 transition">
              Sign up
            </Link>
            <Link to="/login" className="rounded-full border border-[#0a1f44]/30 bg-white/40 px-8 py-3 text-base font-semibold text-[#0a1f44] backdrop-blur-md hover:bg-white/60 transition">
              Sign in
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Bento Section */}
      <section className="relative z-10 bg-gradient-to-b from-white via-blue-50 to-blue-100 px-6 py-24 rounded-t-[3rem]">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-14 text-center text-4xl font-bold tracking-tight text-[#0a1f44] sm:text-5xl md:text-6xl"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            ZenSol Makes
          </motion.h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6 auto-rows-[360px]">
            <BentoCard img={bentoQr} title="Just Scan and Pay"
              subtitle="Point, scan, and your payment is on its way — no typing, no waiting."
              className="lg:col-span-3" />
            <BentoCard img={bentoShield} title="Private transactions"
              subtitle="End-to-end encrypted payments that won't reflect on public ledgers."
              className="lg:col-span-3" />
            <BentoCard img={bentoName} title="No more messy public keys"
              subtitle="Send to a name, not a 64-character string."
              className="lg:col-span-4" />
            <BentoCard img={bentoMobile} title="Simple clean UI"
              subtitle="Designed to feel effortless."
              className="lg:col-span-2" imgFit="contain" />
            <BentoCard img={bentoChat} title="Text while paying"
              subtitle="Chat and pay in the same flow — money moves with the conversation."
              className="lg:col-span-6" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gradient-to-b from-blue-100 to-blue-200/60 px-6 pb-10 pt-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div style={{ fontFamily: "Inter, sans-serif" }}>
              <h2 className="text-3xl font-semibold tracking-tight text-[#0a1f44] sm:text-4xl">
                Start using ZenSol
              </h2>
              <p className="mt-2 max-w-xl text-sm text-[#0a1f44]/60 sm:text-base">
                Private, simple payments in seconds — no setup, no messy keys. Just scan, send, and chat.
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-3">
              <Link to="/register" className="rounded-full bg-[#0a1f44] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#0a1f44]/90">
                Sign up
              </Link>
              <Link to="/login" className="rounded-full border border-[#0a1f44]/20 bg-white px-6 py-2.5 text-sm font-semibold text-[#0a1f44] shadow-sm transition hover:bg-white/80">
                Sign in
              </Link>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-blue-200/70 bg-white/70 p-6 shadow-[0_10px_40px_-10px_rgb(37,99,235,0.2)] backdrop-blur-sm">
            <div className="flex items-center gap-2 border-b border-blue-100 pb-4" style={{ fontFamily: "Inter, sans-serif" }}>
              <span className="inline-block h-5 w-5 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#0a1f44]" />
              <span className="text-sm font-medium text-[#0a1f44]">ZenSol</span>
            </div>
            <div className="flex items-center justify-center py-8 sm:py-14">
              <h3
                className="text-center text-[clamp(3rem,14vw,11rem)] font-bold leading-none tracking-tight text-[#3B82F6]/70"
                style={{ fontFamily: "'Courier New', monospace", letterSpacing: "-0.02em" }}
              >
                ZenSol
              </h3>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-3 text-xs text-[#0a1f44]/50 sm:flex-row" style={{ fontFamily: "Inter, sans-serif" }}>
            <span>© {new Date().getFullYear()} ZenSol. All rights reserved.</span>
            <div className="flex gap-5">
              <a href="#" className="hover:text-[#0a1f44]">Privacy</a>
              <a href="#" className="hover:text-[#0a1f44]">Terms</a>
              <a href="#" className="hover:text-[#0a1f44]">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function BentoCard({
  img, title, subtitle, className = "", imgFit = "cover",
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6 }}
      whileHover={{ y: -4 }}
      className={`group relative flex flex-col overflow-hidden rounded-[2rem] border border-blue-200/70 bg-gradient-to-br from-white via-blue-50 to-blue-200/70 shadow-[0_10px_40px_-10px_rgb(37,99,235,0.25)] ${className}`}
    >
      <div className="px-7 pt-6 pb-3" style={{ fontFamily: "Inter, sans-serif" }}>
        <h3 className="text-xl font-semibold tracking-tight text-[#0a1f44] sm:text-2xl">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1.5 text-sm leading-snug text-[#0a1f44]/60 sm:text-[15px]">
            {subtitle}
          </p>
        )}
      </div>
      <div className="relative flex-1 overflow-hidden">
        <img
          src={img}
          alt={title}
          loading="lazy"
          className={`absolute inset-0 h-full w-full ${imgFit === "contain" ? "object-contain p-4" : "object-cover"} transition-transform duration-500 group-hover:scale-[1.04]`}
        />
      </div>
    </motion.div>
  );
}
