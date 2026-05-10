import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  GraduationCap, Building2, ArrowRight, CheckCircle,
  BookOpen, Zap, BarChart3, Users, Shield, Star,
} from "lucide-react";

/* ── Subtle floating animation hook ─────────────────────────────────────── */
function useFloat(delay = 0) {
  const style = {
    animation: `float ${3.5 + delay * 0.4}s ease-in-out ${delay * 0.6}s infinite`,
  };
  return style;
}

/* ── Animated entrance ───────────────────────────────────────────────────── */
function useFadeIn(delayMs = 0) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);
  return {
    opacity:    visible ? 1 : 0,
    transform:  visible ? "none" : "translateY(20px)",
    transition: `opacity 0.65s ease, transform 0.65s ease`,
  };
}

/* ── Role choice card ────────────────────────────────────────────────────── */
function RoleCard({ icon: Icon, label, tagline, description, features, accent, onClick, delay }) {
  const [hovered, setHovered] = useState(false);
  const style = useFadeIn(delay);

  const accentMap = {
    brand: {
      glow:    "from-brand-600/20 to-transparent",
      border:  hovered ? "border-brand-500" : "border-[#1c3a63]",
      icon:    "bg-brand-600 shadow-brand-600/40",
      badge:   "bg-brand-900/80 text-brand-300 border-brand-800",
      btn:     "bg-brand-600 hover:bg-brand-500 shadow-brand-600/30 hover:shadow-brand-500/40",
      check:   "text-brand-400",
      dot:     "bg-brand-500",
    },
    amber: {
      glow:    "from-amber-600/15 to-transparent",
      border:  hovered ? "border-amber-500/70" : "border-[#1c3a63]",
      icon:    "bg-amber-600 shadow-amber-600/40",
      badge:   "bg-amber-900/30 text-amber-300 border-amber-800/50",
      btn:     "bg-amber-600 hover:bg-amber-500 shadow-amber-600/25 hover:shadow-amber-500/35",
      check:   "text-amber-400",
      dot:     "bg-amber-500",
    },
  };

  const c = accentMap[accent];

  return (
    <div
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      className={`relative group rounded-3xl border ${c.border} bg-[#0d2245] p-8 md:p-10
        overflow-hidden cursor-pointer transition-all duration-300
        ${hovered ? "shadow-2xl -translate-y-1" : "shadow-none"}`}
    >
      {/* Gradient glow on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${c.glow}
        opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

      {/* Corner shine */}
      <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl
        opacity-0 group-hover:opacity-20 transition-opacity duration-500
        ${accent === "brand" ? "bg-brand-500" : "bg-amber-500"}`} />

      <div className="relative">
        {/* Badge */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border
          text-[10px] font-black uppercase tracking-widest mb-7 ${c.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
          {label}
        </div>

        {/* Icon */}
        <div className={`w-16 h-16 rounded-2xl ${c.icon} shadow-lg
          flex items-center justify-center mb-6 transition-transform duration-300
          ${hovered ? "scale-110" : "scale-100"}`}>
          <Icon size={28} className="text-white" />
        </div>

        {/* Heading + tagline */}
        <h2 className="font-display text-3xl md:text-4xl font-black text-[#e8f0fc]
          tracking-tight leading-tight mb-3">
          {tagline}
        </h2>
        <p className="text-[#6b9fe4] text-sm md:text-base leading-relaxed mb-8 max-w-sm">
          {description}
        </p>

        {/* Features */}
        <ul className="space-y-3 mb-10">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-3 text-sm text-[#3b72cc]">
              <CheckCircle size={14} className={`shrink-0 ${c.check}`} />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          className={`group/btn w-full flex items-center justify-center gap-2.5
            py-4 px-6 rounded-2xl text-white font-black text-sm
            transition-all shadow-xl ${c.btn}
            ${hovered ? "-translate-y-0.5" : ""}`}
        >
          Register as {label}
          <ArrowRight size={15}
            className="transition-transform group-hover/btn:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function Register() {
  const nav  = useNavigate();
  const logo = useFadeIn(0);
  const head = useFadeIn(120);
  const sub  = useFadeIn(240);

  return (
    <div className="min-h-screen bg-[#0b1d3a] font-body overflow-x-hidden
      flex flex-col items-center justify-center px-4 py-12">

      {/* ── Background dot grid ───────────────────────────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #2455a4 1px, transparent 1px)",
          backgroundSize:  "28px 28px",
          opacity:         0.07,
        }}
      />

      {/* ── Ambient glows ─────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] rounded-full
          bg-brand-600 blur-[160px] opacity-[0.09]" />
        <div className="absolute bottom-[-5%] right-[5%] w-[500px] h-[500px] rounded-full
          bg-amber-600 blur-[140px] opacity-[0.05]" />
      </div>

      {/* ── Floating decorative badges ────────────────────────────────── */}
      <div className="fixed left-[2%] top-[20%] hidden xl:block pointer-events-none"
        style={useFloat(0)}>
        <div className="rounded-2xl border border-[#1c3a63] bg-[#0d2245]/90 p-4 w-44 backdrop-blur-sm">
          <p className="text-[9px] font-black uppercase tracking-widest text-brand-400 mb-2">
            Active Students
          </p>
          <p className="text-3xl font-display font-black text-[#e8f0fc]">240+</p>
          <div className="flex gap-1 mt-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-5 h-5 rounded-full bg-brand-800 border border-brand-700
                flex items-center justify-center">
                <GraduationCap size={10} className="text-brand-400" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed right-[2%] top-[25%] hidden xl:block pointer-events-none"
        style={useFloat(1)}>
        <div className="rounded-2xl border border-[#1c3a63] bg-[#0d2245]/90 p-4 w-44 backdrop-blur-sm">
          <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-2">
            Partner Orgs
          </p>
          <p className="text-3xl font-display font-black text-[#e8f0fc]">60+</p>
          <div className="h-1.5 bg-[#132848] rounded-full mt-3 overflow-hidden">
            <div className="h-full w-3/4 bg-amber-500 rounded-full" />
          </div>
        </div>
      </div>

      <div className="fixed left-[2%] bottom-[25%] hidden xl:block pointer-events-none"
        style={useFloat(2)}>
        <div className="rounded-2xl border border-[#1c3a63] bg-[#0d2245]/90 p-4 w-44 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-[9px] font-black uppercase tracking-widest text-green-400">
              Logbook approved
            </p>
          </div>
          <p className="text-xs text-[#6b9fe4] font-medium">Week 6 · just now</p>
        </div>
      </div>

      <div className="fixed right-[2%] bottom-[25%] hidden xl:block pointer-events-none"
        style={useFloat(3)}>
        <div className="rounded-2xl border border-[#1c3a63] bg-[#0d2245]/90 p-4 w-44 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            <p className="text-[9px] font-black uppercase tracking-widest text-brand-400">
              Match found
            </p>
          </div>
          <p className="text-xs text-[#6b9fe4] font-medium">Ryom Engineering</p>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div className="relative w-full max-w-5xl">

        {/* Back to landing */}
        <div style={logo} className="flex justify-center mb-10">
          <Link
            to="/"
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center
              shadow-lg shadow-brand-600/30 transition-transform group-hover:scale-105">
              <GraduationCap size={18} className="text-white" />
            </div>
            <div className="text-left">
              <p className="font-display font-black text-[#e8f0fc] tracking-tighter text-xl leading-none">
                IAMS
              </p>
              <p className="text-[9px] font-black text-brand-400 uppercase tracking-[0.2em] leading-none mt-0.5">
                UB Portal
              </p>
            </div>
          </Link>
        </div>

        {/* Headline */}
        <div className="text-center mb-12">
          <div style={logo} className="inline-flex items-center gap-2 px-4 py-2 rounded-full
            border border-[#1c3a63] bg-[#132848] text-[10px] font-bold uppercase
            tracking-widest text-brand-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            University of Botswana · Get Started
          </div>

          <h1 style={head}
            className="font-display font-black text-[#e8f0fc] tracking-tight leading-tight
              text-[clamp(2.2rem,5vw,4rem)] mb-4">
            Who are you joining as?
          </h1>
          <p style={sub} className="text-[#6b9fe4] text-base md:text-lg font-light max-w-lg mx-auto leading-relaxed">
            Choose your role to create your account. You can sign in any time once registered.
          </p>
        </div>

        {/* Role cards */}
        <div className="grid md:grid-cols-2 gap-5 md:gap-6 mb-10">
          <RoleCard
            icon={GraduationCap}
            label="Student"
            tagline="Start Your Career Journey"
            description="Build your attachment profile, get matched to top organisations, and track your entire industrial placement — all in one place."
            accent="brand"
            delay={350}
            features={[
              "Complete your profile & upload CV",
              "Set skills and preferred locations",
              "Get algorithmically matched to organisations",
              "Submit and track weekly digital logbooks",
              "View supervisor assessments and feedback",
            ]}
            onClick={() => nav("/register/student")}
          />

          <RoleCard
            icon={Building2}
            label="Organisation"
            tagline="Find Your Next Talent"
            description="Post vacancies, define skill requirements, and discover motivated UB students ready to contribute to your team."
            accent="amber"
            delay={500}
            features={[
              "Create your company profile",
              "Post vacancies with skill requirements",
              "Review matched student applications",
              "Assign supervisors to placed students",
              "Access placement performance reports",
            ]}
            onClick={() => nav("/register/org")}
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-[#1c3a63]" />
          <p className="text-[11px] font-bold text-[#1c3a63] uppercase tracking-widest">
            or
          </p>
          <div className="flex-1 h-px bg-[#1c3a63]" />
        </div>

        {/* Sign in + supervisor note */}
        <div className="text-center space-y-4">
          <p className="text-sm text-[#3b72cc] font-medium">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-brand-400 font-black hover:text-[#e8f0fc] transition-colors underline underline-offset-2"
            >
              Sign In
            </Link>
          </p>
          <p className="text-xs text-[#1c3a63] font-medium max-w-xs mx-auto leading-relaxed">
            Supervisors are invited by the coordinator — no self-registration required.
          </p>
        </div>

        {/* Stats bar */}
        <div className="mt-16 grid grid-cols-3 gap-4 border-t border-[#132848] pt-10">
          {[
            { icon: Users,   label: "5 User Roles",       sub: "Students · Orgs · Supervisors · Coordinator" },
            { icon: BookOpen, label: "100% Paperless",     sub: "Digital logbooks, reports and assessments" },
            { icon: Zap,      label: "Smart Matching",     sub: "Heuristic engine scores skill + GPA + location" },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex flex-col items-center text-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#132848] border border-[#1c3a63]
                flex items-center justify-center">
                <Icon size={16} className="text-brand-400" />
              </div>
              <p className="text-[11px] font-black text-[#e8f0fc] uppercase tracking-wider">{label}</p>
              <p className="text-[10px] text-[#3b72cc] leading-snug hidden sm:block">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Float keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(-6px); }
          50%       { transform: translateY(6px);  }
        }
      `}</style>
    </div>
  );
}
