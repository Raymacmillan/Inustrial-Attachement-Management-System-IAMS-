import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, BookOpen, Building2, GraduationCap, Users,
  CheckCircle, BarChart3, Clock, Shield, Zap, Star,
  ChevronDown, FileText, Sparkles,
} from "lucide-react";

/* ─── Reveal on scroll ───────────────────────────────────────────────────── */
function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); io.disconnect(); } },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, vis];
}

/* ─── Counter ────────────────────────────────────────────────────────────── */
function Counter({ to, suffix = "" }) {
  const [n, setN] = useState(0);
  const [ref, vis] = useReveal(0.4);
  useEffect(() => {
    if (!vis) return;
    let v = 0;
    const step = to / 60;
    const t = setInterval(() => {
      v += step;
      if (v >= to) { setN(to); clearInterval(t); } else setN(Math.floor(v));
    }, 16);
    return () => clearInterval(t);
  }, [vis, to]);
  return <span ref={ref}>{n}{suffix}</span>;
}

/* ─── Reveal wrapper ─────────────────────────────────────────────────────── */
function Reveal({ children, delay = 0, className = "", x = 0, y = 24 }) {
  const [ref, vis] = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "none" : `translate(${x}px, ${y}px)`,
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Eyebrow label ──────────────────────────────────────────────────────── */
function Eyebrow({ children }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-brand-400 mb-4">
      {children}
    </p>
  );
}

/* ─── Role card ──────────────────────────────────────────────────────────── */
function RoleCard({ icon: Icon, title, desc, points, delay, glow }) {
  const [ref, vis] = useReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "none" : "translateY(28px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
      className={`group relative rounded-2xl border border-[#1c3a63] bg-[#0d2245]
        p-7 overflow-hidden hover:border-brand-600 transition-all duration-300`}
    >
      {/* Glow orb */}
      <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl
        opacity-0 group-hover:opacity-30 transition-opacity duration-500 ${glow}`} />

      <div className="relative">
        <div className="w-11 h-11 rounded-xl bg-[#132848] border border-[#1c3a63]
          flex items-center justify-center mb-5 group-hover:border-brand-600 transition-colors duration-300">
          <Icon size={18} className="text-brand-400" />
        </div>
        <h3 className="font-display text-lg font-bold text-[#e8f0fc] mb-2">{title}</h3>
        <p className="text-sm text-brand-400 leading-relaxed mb-5">{desc}</p>
        <ul className="space-y-2">
          {points.map((p, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-[#3b72cc]">
              <CheckCircle size={10} className="text-brand-600 shrink-0" />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ─── Feature pill ───────────────────────────────────────────────────────── */
function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div className="group rounded-2xl border border-[#1c3a63] bg-[#0d2245] p-6
      hover:border-brand-600 hover:bg-[#0f2850] transition-all duration-300">
      <div className="w-10 h-10 rounded-xl bg-[#132848] border border-[#1c3a63]
        flex items-center justify-center mb-4 group-hover:border-brand-600 transition-colors duration-300">
        <Icon size={16} className="text-brand-400" />
      </div>
      <p className="text-sm font-bold text-[#e8f0fc] mb-1.5">{title}</p>
      <p className="text-xs text-[#3b72cc] leading-relaxed">{desc}</p>
    </div>
  );
}

/* ─── Step ───────────────────────────────────────────────────────────────── */
function Step({ num, title, desc, delay }) {
  return (
    <Reveal delay={delay} className="flex items-start gap-5">
      <div className="shrink-0 w-12 h-12 rounded-2xl bg-[#132848] border border-brand-600
        flex items-center justify-center">
        <span className="font-display font-black text-base text-brand-400">{num}</span>
      </div>
      <div>
        <h3 className="font-bold text-[#e8f0fc] text-sm mb-1.5">{title}</h3>
        <p className="text-sm text-[#3b72cc] leading-relaxed">{desc}</p>
      </div>
    </Reveal>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const nav = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [heroIn, setHeroIn] = useState(false);
  const [statsRef, statsVis] = useReveal(0.2);
  const [probRef, probVis] = useReveal(0.1);

  useEffect(() => {
    const t = setTimeout(() => setHeroIn(true), 80);
    const fn = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", fn);
    return () => { clearTimeout(t); window.removeEventListener("scroll", fn); };
  }, []);

  /* staggered hero animation helper */
  const h = (ms) => ({
    opacity: heroIn ? 1 : 0,
    transform: heroIn ? "none" : "translateY(18px)",
    transition: `opacity 0.65s ease ${ms}ms, transform 0.65s ease ${ms}ms`,
  });

  return (
    <div className="min-h-screen bg-[#0b1d3a] font-body overflow-x-hidden">

      {/* ── Background texture ────────────────────────────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #2455a4 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.07,
        }}
      />

      {/* ── Ambient glows ─────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] left-[15%] w-[700px] h-[700px] rounded-full
          bg-brand-600 blur-[160px] opacity-[0.09]" />
        <div className="absolute bottom-[10%] right-[5%] w-[500px] h-[500px] rounded-full
          bg-brand-500 blur-[130px] opacity-[0.06]" />
      </div>

      {/* ════════════════════════════════════════════════════════════════
          NAV
      ════════════════════════════════════════════════════════════════ */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300
        ${scrolled
          ? "bg-[#0b1d3a]/95 backdrop-blur-md border-b border-[#1c3a63]"
          : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center
              shadow-lg shadow-brand-600/30">
              <GraduationCap size={17} className="text-white" />
            </div>
            <div>
              <span className="font-display font-black text-[#e8f0fc] tracking-tighter text-xl leading-none">
                IAMS
              </span>
              <span className="hidden sm:block text-[9px] font-black text-brand-400
                uppercase tracking-[0.25em] leading-none">
                UB Portal
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => nav("/login")}
              className="text-sm font-semibold text-brand-400 hover:text-[#e8f0fc]
                transition-colors px-4 py-2 rounded-xl hover:bg-[#132848]"
            >
              Sign In
            </button>
            <button
              onClick={() => nav("/register/student")}
              className="text-sm font-black bg-brand-600 hover:bg-brand-500 text-white
                px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-brand-600/25
                hover:shadow-brand-500/35 hover:-translate-y-px"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ════════════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center
        justify-center text-center px-6 pt-24 pb-28">

        {/* Floating notification cards */}
        <div
          className="absolute right-[3%] top-1/2 -translate-y-1/2
            hidden xl:flex flex-col gap-3 pointer-events-none"
          style={h(800)}
        >
          {[
            { color: "bg-[#059669]", textColor: "text-[#34d399]", label: "Logbook approved",  sub: "Week 4 · Ray Gumbo",   anim: "card0" },
            { color: "bg-brand-600", textColor: "text-brand-400",  label: "Match found",        sub: "Ryom Engineering",     anim: "card1" },
            { color: "bg-[#d97706]", textColor: "text-[#f59e0b]",  label: "Visit scheduled",    sub: "Dr. Moyo · May 12",   anim: "card2" },
          ].map((c) => (
            <div
              key={c.label}
              className={`rounded-2xl px-5 py-4 w-56 border border-[#1c3a63]
                bg-[#0d2245] backdrop-blur-sm ${c.anim}`}
              style={{ animation: `${c.anim} ${3.8}s ease-in-out infinite` }}
            >
              <div className="flex items-center gap-2.5 mb-1">
                <span className={`w-2 h-2 rounded-full ${c.color} shadow-sm`} />
                <p className={`text-xs font-black ${c.textColor}`}>{c.label}</p>
              </div>
              <p className="text-[10px] text-[#3b72cc] pl-4.5">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Left decorative card */}
        <div
          className="absolute left-[3%] top-1/2 -translate-y-1/2 hidden xl:block pointer-events-none"
          style={{ ...h(900), animation: "card3 4.5s ease-in-out infinite" }}
        >
          <div className="rounded-2xl border border-[#1c3a63] bg-[#0d2245] p-5 w-48">
            <p className="text-[9px] font-black uppercase tracking-widest text-brand-400 mb-3">
              Attachment Progress
            </p>
            {[
              { label: "Logbooks",  pct: 75, color: "bg-brand-600" },
              { label: "Approved",  pct: 50, color: "bg-[#059669]" },
              { label: "Pending",   pct: 25, color: "bg-[#d97706]" },
            ].map((bar) => (
              <div key={bar.label} className="mb-2.5">
                <div className="flex justify-between mb-1">
                  <span className="text-[9px] text-[#3b72cc]">{bar.label}</span>
                  <span className="text-[9px] font-bold text-[#6b9fe4]">{bar.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#132848]">
                  <div
                    className={`h-1.5 rounded-full ${bar.color}`}
                    style={{ width: `${bar.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Badge ── */}
        <div style={h(80)} className="mb-8">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full
            border border-[#1c3a63] bg-[#132848] text-[10px] font-bold
            uppercase tracking-widest text-brand-400">
            <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
            University of Botswana · Computer Science Department
          </div>
        </div>

        {/* ── Headline ── */}
        <h1
          style={{
            ...h(220),
            fontFamily: "'DM Serif Display', Georgia, serif",
          }}
          className="text-[clamp(2.8rem,8.5vw,6.8rem)] font-black text-[#e8f0fc]
            leading-[0.93] tracking-[-2px] max-w-5xl mb-6"
        >
          Industrial Attachment,{" "}
          <span className="text-brand-400">Reimagined.</span>
        </h1>

        {/* ── Subheading ── */}
        <p
          style={h(380)}
          className="text-[#6b9fe4] text-lg sm:text-xl font-light leading-relaxed
            max-w-2xl mb-12"
        >
          IAMS replaces paper-based chaos with a unified digital platform —
          connecting UB students, host organisations, and supervisors in
          one intelligent system.
        </p>

        {/* ── CTA row ── */}
        <div
          style={h(520)}
          className="flex flex-col sm:flex-row items-center gap-4 mb-24"
        >
          <button
            onClick={() => nav("/register/student")}
            className="group flex items-center gap-2.5 px-8 py-4 bg-brand-600
              hover:bg-brand-500 text-white font-black text-sm rounded-2xl
              transition-all shadow-xl shadow-brand-600/30
              hover:shadow-brand-500/40 hover:-translate-y-0.5"
          >
            Register as Student
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </button>
          <button
            onClick={() => nav("/register/org")}
            className="flex items-center gap-2.5 px-8 py-4 border border-[#1c3a63]
              bg-[#132848] hover:border-brand-600 hover:bg-[#0f2850] text-[#e8f0fc]
              font-bold text-sm rounded-2xl transition-all"
          >
            <Building2 size={15} className="text-brand-400" />
            Partner Organisation
          </button>
          <button
            onClick={() => nav("/login")}
            className="text-[#3b72cc] hover:text-brand-400 font-semibold text-sm
              transition-colors px-4"
          >
            Sign In →
          </button>
        </div>

        {/* ── Scroll hint ── */}
        <div
          style={{ opacity: heroIn ? 0.5 : 0, transition: "opacity 0.7s ease 1.1s" }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2
            flex flex-col items-center gap-1.5 text-[#1c3a63]"
        >
          <span className="text-[9px] font-black uppercase tracking-[0.35em]">Scroll</span>
          <ChevronDown size={14} className="animate-bounce" />
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          STATS
      ════════════════════════════════════════════════════════════════ */}
      <section
        ref={statsRef}
        className="border-y border-[#132848] bg-[#0d2245] py-20 px-6"
      >
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {[
            { to: 5,   s: "",  l: "User Roles" },
            { to: 100, s: "%", l: "Paperless" },
            { to: 8,   s: "+", l: "Weeks Per Cycle" },
            { to: 2,   s: "",  l: "Supervisor Types" },
          ].map((stat, i) => (
            <div
              key={i}
              className="text-center"
              style={{
                opacity: statsVis ? 1 : 0,
                transform: statsVis ? "none" : "translateY(16px)",
                transition: `opacity 0.5s ease ${i * 90}ms, transform 0.5s ease ${i * 90}ms`,
              }}
            >
              <p className="font-display font-black text-5xl text-[#e8f0fc]
                tracking-tighter leading-none mb-2">
                <Counter to={stat.to} suffix={stat.s} />
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#3b72cc]">
                {stat.l}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          PROBLEM / SOLUTION
      ════════════════════════════════════════════════════════════════ */}
      <section ref={probRef} className="py-28 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-start">

          {/* Problem */}
          <div
            style={{
              opacity: probVis ? 1 : 0,
              transform: probVis ? "none" : "translateX(-28px)",
              transition: "opacity 0.7s ease, transform 0.7s ease",
            }}
          >
            <Eyebrow>The Problem</Eyebrow>
            <h2 className="font-display font-black text-[#e8f0fc] leading-tight
              tracking-tight mb-8 text-[clamp(1.8rem,3.5vw,2.8rem)]">
              Manual processes were{" "}
              <span className="text-[#f87171]">breaking down.</span>
            </h2>
            <div className="space-y-4">
              {[
                "Paper logbooks lost, damaged, or submitted late",
                "Coordinators manually matching students to organisations",
                "No real-time visibility into student progress",
                "Supervisors submitting reports via email and paper forms",
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl
                  bg-[#0d2245] border border-[#1c3a63]">
                  <div className="w-5 h-5 rounded-full bg-[#1c0a0a] border border-[#7f1d1d]
                    flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[#f87171] text-[10px] leading-none font-black">✕</span>
                  </div>
                  <p className="text-sm text-[#6b9fe4] leading-relaxed">{t}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Solution */}
          <div
            style={{
              opacity: probVis ? 1 : 0,
              transform: probVis ? "none" : "translateX(28px)",
              transition: "opacity 0.7s ease 160ms, transform 0.7s ease 160ms",
            }}
          >
            <Eyebrow>The Solution</Eyebrow>
            <h2 className="font-display font-black text-[#e8f0fc] leading-tight
              tracking-tight mb-8 text-[clamp(1.8rem,3.5vw,2.8rem)]">
              One platform.{" "}
              <span className="text-brand-400">Every stakeholder.</span>
            </h2>
            <div className="space-y-4">
              {[
                "Digital logbooks with weekly submission and approval workflow",
                "Intelligent heuristic matching engine for student allocation",
                "Real-time dashboards for all coordinators and supervisors",
                "Automated email reminders so no deadline is ever missed",
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl
                  bg-[#0d2245] border border-[#1c3a63] hover:border-brand-600
                  transition-colors duration-200">
                  <div className="w-5 h-5 rounded-full bg-[#0a1c0e] border border-[#14532d]
                    flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle size={10} className="text-[#34d399]" />
                  </div>
                  <p className="text-sm text-[#6b9fe4] leading-relaxed">{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════════════════════ */}
      <section className="py-28 px-6 border-t border-[#132848]">
        <div className="max-w-4xl mx-auto">
          <Reveal className="text-center mb-16">
            <Eyebrow>How It Works</Eyebrow>
            <h2 className="font-display font-black text-[#e8f0fc] tracking-tight
              text-[clamp(1.8rem,3.5vw,2.8rem)]">
              From registration to{" "}
              <span className="text-brand-400">completion.</span>
            </h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 gap-10">
            <Step num="01" title="Register & Set Preferences" delay={0}
              desc="Students and organisations register independently. Students set project and location preferences. Organisations list required skills and available positions." />
            <Step num="02" title="Intelligent Matching" delay={100}
              desc="The coordinator runs the heuristic matching engine, pairing students to organisations based on skill alignment, preferences, GPA, and available slots." />
            <Step num="03" title="Attachment Begins" delay={200}
              desc="Students receive placement confirmation. Industrial and university supervisors are invited. The weekly logbook cycle starts from the placement start date." />
            <Step num="04" title="Track, Assess & Complete" delay={300}
              desc="Students submit weekly logbooks. Industrial supervisors approve or flag entries. University supervisors conduct two site visit assessments." />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          ROLES
      ════════════════════════════════════════════════════════════════ */}
      <section className="py-28 px-6 border-t border-[#132848]">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-16">
            <Eyebrow>Built For Everyone</Eyebrow>
            <h2 className="font-display font-black text-[#e8f0fc] tracking-tight
              text-[clamp(1.8rem,3.5vw,2.8rem)]">
              One system,{" "}
              <span className="text-brand-400">five roles.</span>
            </h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <RoleCard icon={GraduationCap} title="Students" glow="bg-brand-500" delay={0}
              desc="Manage your attachment from application to completion. Submit logbooks, track approvals, and never miss a deadline."
              points={["Set project & location preferences", "Submit weekly digital logbooks", "View supervisor feedback live", "Full attachment progress tracking"]} />
            <RoleCard icon={Building2} title="Organisations" glow="bg-[#d97706]" delay={80}
              desc="Post vacancies, define skill requirements, and manage your student cohort through a dedicated employer portal."
              points={["Post vacancies with skill filters", "Manage active placements", "Assign industrial supervisors", "Access student performance data"]} />
            <RoleCard icon={Users} title="Coordinator" glow="bg-[#7c3aed]" delay={160}
              desc="Run the entire attachment lifecycle from one dashboard. Match, allocate, monitor, and audit every placement."
              points={["Run heuristic matching engine", "Audit student & org registries", "Manage supervisor invitations", "Monitor system-wide progress"]} />
            <RoleCard icon={Shield} title="Industrial Supervisors" glow="bg-[#d97706]" delay={240}
              desc="Review student logbooks weekly, provide actionable feedback, and submit end-of-attachment performance reports."
              points={["Approve or flag logbook weeks", "Write performance reports", "Digital stamp & signature", "Score across 4 criteria"]} />
            <RoleCard icon={Star} title="University Supervisors" glow="bg-[#059669]" delay={320}
              desc="Monitor student progress across all placements and record structured assessments from two scheduled site visits."
              points={["Read-only logbook monitoring", "2 visit assessments per student", "Score across 5 criteria", "Track all assigned students"]} />
            <RoleCard icon={Zap} title="Automated System" glow="bg-[#dc2626]" delay={400}
              desc="IAMS runs background jobs every Monday to keep everyone on track — sending reminders before deadlines slip."
              points={["Weekly logbook reminder emails", "Supervisor invitation emails", "Deadline notifications", "Status change alerts"]} />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 border-t border-[#132848]">
        <div className="max-w-5xl mx-auto">
          <Reveal className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <FeatureCard icon={BookOpen}  title="Digital Logbooks"
              desc="Mon–Fri tabbed entries with weekly reflection and instant auto-save" />
            <FeatureCard icon={BarChart3} title="Heuristic Matching"
              desc="Skills, preferences, location, and GPA-weighted allocation engine" />
            <FeatureCard icon={Clock}     title="Auto Reminders"
              desc="Monday morning email nudges before weekly logbook submission deadlines" />
            <FeatureCard icon={FileText}  title="Fully Web-Based"
              desc="No installs required — runs in any browser on any device, anywhere" />
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          CTA
      ════════════════════════════════════════════════════════════════ */}
      <section className="py-28 px-6 border-t border-[#132848]">
        <Reveal className="max-w-3xl mx-auto text-center">
          {/* Glow ring */}
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 rounded-full bg-brand-600 blur-2xl opacity-20 scale-150" />
            <div className="relative w-16 h-16 rounded-2xl bg-[#132848] border border-brand-600
              flex items-center justify-center mx-auto shadow-xl shadow-brand-600/20">
              <Sparkles size={24} className="text-brand-400" />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
            border border-[#1c3a63] bg-[#132848] text-[10px] font-bold uppercase
            tracking-widest text-[#3b72cc] mb-8 block">
            <FileText size={10} className="inline mr-1" />
            Begin Your Journey here.
          </div>

          <h2 className="font-display font-black text-[#e8f0fc] tracking-tight
            leading-tight mb-6 text-[clamp(2rem,5vw,3.5rem)]">
            Ready to modernise your{" "}
            <span className="text-brand-400">attachment cycle?</span>
          </h2>
          <p className="text-[#3b72cc] text-base leading-relaxed mb-12 max-w-xl mx-auto">
            Join students and organisations already using IAMS to manage the
            entire industrial attachment lifecycle — fully digitally.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => nav("/register/student")}
              className="group flex items-center justify-center gap-2.5 px-10 py-4
                bg-brand-600 hover:bg-brand-500 text-white font-black text-sm
                rounded-2xl transition-all shadow-xl shadow-brand-600/30
                hover:shadow-brand-500/40 hover:-translate-y-0.5"
            >
              Start as Student
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() => nav("/register/org")}
              className="flex items-center justify-center gap-2.5 px-10 py-4
                border border-[#1c3a63] bg-[#132848] hover:border-brand-600
                hover:bg-[#0f2850] text-[#e8f0fc] font-bold text-sm rounded-2xl
                transition-all"
            >
              Register Organisation
            </button>
          </div>
        </Reveal>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-[#132848] bg-[#0d2245] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center
          justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
              <GraduationCap size={14} className="text-white" />
            </div>
            <span className="font-display font-black text-[#3b72cc] tracking-tighter text-lg">
              IAMS
            </span>
          </div>
          <p className="text-[10px] text-[#1c3a63] font-bold text-center tracking-wider uppercase">
            University of Botswana · Dept. of Computer Science · {new Date().getFullYear()}
          </p>
          <div className="flex gap-6">
            {[
              { label: "Sign In",   path: "/login" },
              { label: "Student",   path: "/register/student" },
              { label: "Partner",   path: "/register/org" },
            ].map(({ label, path }) => (
              <button
                key={label}
                onClick={() => nav(path)}
                className="text-xs font-bold text-[#1c3a63] hover:text-brand-400
                  transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </footer>

      {/* Float animations */}
      <style>{`
        @keyframes card0 { 0%,100%{transform:translateY(-6px)} 50%{transform:translateY(6px)} }
        @keyframes card1 { 0%,100%{transform:translateY(5px)} 50%{transform:translateY(-7px)} }
        @keyframes card2 { 0%,100%{transform:translateY(-4px)} 50%{transform:translateY(8px)} }
        @keyframes card3 { 0%,100%{transform:translateY(-3px) translateY(-50%)} 50%{transform:translateY(5px) translateY(-50%)} }
      `}</style>
    </div>
  );
}