import { Link } from "react-router-dom";
import { Ticket } from "lucide-react";
import { VscGithubAlt, VscTwitter, VscGlobe, VscMail } from "react-icons/vsc";

const BG = "#1a0b2e";

const aboutLinks = [
  { label: "Tentang Kami", to: "/about" },
  { label: "Jelajah Event", to: "/explore" },
  { label: "Masuk", to: "/login" },
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms & Conditions", to: "/terms" },
];

const cityLinks = [
  { label: "Jakarta", to: "/explore?city=jakarta" },
  { label: "Yogyakarta", to: "/explore?city=yogyakarta" },
  { label: "Bandung", to: "/explore?city=bandung" },
  { label: "Bali", to: "/explore?city=bali" },
  { label: "Semua Kota", to: "/explore" },
];

const socialLinks = [
  { icon: <VscGithubAlt size={18} />, href: "https://github.com", label: "GitHub" },
  { icon: <VscTwitter size={18} />, href: "https://twitter.com", label: "Twitter" },
  { icon: <VscGlobe size={18} />, href: "https://lokahajat.id", label: "Website" },
];

export default function Footer() {
    const currentYear = new Date().getFullYear();
  return (
    <footer style={{ backgroundColor: BG }} className="text-white font-sans">
      {/* ── Main grid ── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* ── Brand ── */}
          <div className="lg:col-span-1 flex flex-col gap-5">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 w-fit">
              <Ticket className="w-7 h-7 flex-none text-orange-400" />
              <span className="text-xl font-extrabold tracking-widest uppercase leading-none text-white">
                LOKAHAJAT
              </span>
            </Link>

            {/* Deskripsi */}
            <p className="text-sm leading-relaxed" style={{ color: "#b0a0c8" }}>
              Temukan hidden gem event dan bikin momen seru bareng circle baru. Dari Indonesia, buat kamu yang gak bisa diam di rumah.
            </p>

            {/* Badge */}
            <span
              className="inline-flex items-center gap-1.5 w-fit px-3 py-1 rounded-full text-xs font-semibold text-orange-400 border border-orange-400/30"
              style={{ backgroundColor: "rgba(255,92,46,0.1)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              Live Events
            </span>
          </div>

          {/* ── Tentang Lokahajat ── */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/90">
              Tentang Lokahajat
            </h3>
            <ul className="flex flex-col gap-2.5">
              {aboutLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm transition-colors duration-200"
                    style={{ color: "#b0a0c8" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#FF5C2E")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#b0a0c8")}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Lokasi Event ── */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/90">
              Lokasi Event
            </h3>
            <ul className="flex flex-col gap-2.5">
              {cityLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm transition-colors duration-200"
                    style={{ color: "#b0a0c8" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#FF5C2E")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#b0a0c8")}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Ikuti Kami ── */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/90">
              Ikuti Kami
            </h3>

            {/* Email */}
            <a
              href="mailto:help@lokahajat.id"
              className="flex items-center gap-2 text-sm transition-colors duration-200 w-fit"
              style={{ color: "#b0a0c8" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#FF5C2E")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#b0a0c8")}
            >
              <VscMail size={18} className="flex-none" />
              help@lokahajat.com
            </a>

            {/* Social icons */}
            <div className="flex items-center gap-2 mt-1">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200"
                  style={{ backgroundColor: "rgba(255,255,255,0.07)", color: "#b0a0c8" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "#FF5C2E";
                    (e.currentTarget as HTMLElement).style.color = "#ffffff";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      "rgba(255,255,255,0.07)";
                    (e.currentTarget as HTMLElement).style.color = "#b0a0c8";
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>

            {/* Tagline kecil */}
            <p className="text-xs mt-2 leading-relaxed" style={{ color: "#6b5785" }}>
              Tetap terhubung dan dapatkan info<br />event terbaru langsung ke kamu.
            </p>
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }} />

      {/* ── Copyright bar ── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 text-center">
        <p className="text-xs" style={{ color: "#6b5785" }}>
          © {currentYear}{" "}
          <span className="font-semibold text-white/60">LOKAHAJAT</span>
          {" — "}
          PT LOKAHAJAT NUSANTARA DIGITAL. ALL RIGHTS RESERVED.
        </p>
      </div>
    </footer>
  );
}