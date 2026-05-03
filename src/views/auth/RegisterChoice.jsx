import { useNavigate, Link } from "react-router-dom";
import { GraduationCap, Building2, ArrowRight, ChevronLeft } from "lucide-react";

export default function RegisterChoice() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-brand-950 flex flex-col items-center justify-center p-4 font-body">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-4
          text-brand-300 rounded-full text-xs font-bold uppercase tracking-widest
          border border-brand-800">
          University of Botswana · IAMS
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-3">
          Create Your Account
        </h1>
        <p className="text-base font-light">
          Who are you registering as?
        </p>
      </div>

      {/* Cards */}
      <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Student */}
        <button
          onClick={() => navigate("/register/student")}
          className="group relative bg-brand-900 hover:bg-brand-800 border border-brand-800
            hover:border-brand-600 rounded-3xl p-8 text-left transition-all duration-300
            cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-900/60
            animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          {/* Icon */}
          <div className="w-14 h-14 bg-brand-800 group-hover:bg-brand-700 rounded-2xl
            flex items-center justify-center mb-6 transition-colors">
            <GraduationCap size={26} className="text-brand-300" />
          </div>

          {/* Label */}
          <p className="text-[10px] font-black text-brand-500 uppercase tracking-widest mb-2">
            For Students
          </p>
          <h2 className="font-display text-2xl font-bold text-white mb-3">
            I'm a Student
          </h2>
          <p className="text-brand-400 text-sm leading-relaxed mb-8 font-medium">
            Register with your UB email and student ID to apply for industrial attachment placements.
          </p>

          {/* CTA */}
          <div className="flex items-center gap-2 text-brand-400 group-hover:text-white
            text-xs font-black uppercase tracking-wider transition-colors">
            Get Started
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>

          {/* Subtle corner accent */}
          <div className="absolute top-0 right-0 w-24 h-24 rounded-tl-full rounded-tr-3xl
            bg-brand-800/50 group-hover:bg-brand-700/50 transition-colors -z-10" />
        </button>

        {/* Employer */}
        <button
          onClick={() => navigate("/register/org")}
          className="group relative bg-white hover:bg-gray-50 border border-gray-200
            hover:border-brand-300 rounded-3xl p-8 text-left transition-all duration-300
            cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:shadow-gray-200/60
            animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75"
        >
          {/* Icon */}
          <div className="w-14 h-14 bg-gray-100 group-hover:bg-brand-50 rounded-2xl
            flex items-center justify-center mb-6 transition-colors">
            <Building2 size={26} className="text-brand-900" />
          </div>

          {/* Label */}
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
            For Employers
          </p>
          <h2 className="font-display text-2xl font-bold text-brand-900 mb-3">
            I'm an Employer
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8 font-medium">
            Register your organisation to post vacancies and receive algorithm-matched student candidates.
          </p>

          {/* CTA */}
          <div className="flex items-center gap-2 text-gray-400 group-hover:text-brand-900
            text-xs font-black uppercase tracking-wider transition-colors">
            Get Started
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

      </div>

      {/* Footer */}
      <p className="text-brand-500 text-xs font-medium mt-10">
        Already have an account?{" "}
        <Link to="/login" className="text-brand-400 font-bold transition-colors">
          Sign in →
        </Link>
      </p>

    </div>
  );
}