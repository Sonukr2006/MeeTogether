import { Link } from 'react-router-dom';
import LottieAnimation from './LottieAnimation';
import { Monitor, ArrowRight } from 'lucide-react';
import heroAnimationData from '../../assets/animations/men-shake-hands.json';
// import heroAnimationData from '../../assets/animations/working-on-laptop-at-desk-remote-job-or-home-office-workspace-1.json';



const HeroSection = () => {
  return (
    <header
      className="relative min-h-screen flex flex-col items-center justify-center bg-[#020617] overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Multi-layer gradient overlay for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: `
            radial-gradient(ellipse at 50% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(168, 85, 247, 0.08) 0%, transparent 40%),
            radial-gradient(ellipse at 20% 80%, rgba(59, 130, 246, 0.06) 0%, transparent 40%)
          `,
        }}
      />

      {/* MeeTogether Logo */}
      <div className="absolute top-6 left-6 z-10">
        <img
          src="/meet.svg"
          alt="MeeTogether logo"
          className="h-12 w-auto"
        />
      </div>

      {/* Content + Animation side by side on desktop */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-12 px-6 max-w-7xl mx-auto w-full">
        
        {/* Text Content */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-2xl gap-6">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            Build-first tech network
          </span>

          {/* Main Headline with per-character hover effect */}
          <h1
            id="hero-heading"
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-white select-none"
          >
            <InteractiveText text="Stop talking," />
            <br />
            <InteractiveText text="start showing" />
          </h1>

          {/* Sub-headline */}
          <p className="text-lg sm:text-xl text-slate-400 leading-relaxed max-w-lg">
            Prove your skills through shipped projects and peer reviews — not just claims on a resume.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <Link
              to="/sign-up"
              className="group inline-flex items-center justify-center gap-2 min-h-[48px] px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-lg rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-[#020617]"
            >
              Join Now
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/sign-in"
              className="inline-flex items-center justify-center min-h-[48px] px-8 py-4 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-medium text-lg rounded-xl transition-all duration-200 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-[#020617]"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Lottie Animation */}
        <div className="w-full max-w-sm lg:max-w-md">
          <LottieAnimation
            animationData={heroAnimationData}
            fallback={<Monitor className="w-50 h-50 text-indigo-400 mx-auto" aria-hidden="true" />}
            ariaLabel="Person working on laptop at desk illustration"
            className="w-full"
          />
        </div>
      </div>
    </header>
  );
};

/**
 * InteractiveText - Each character changes to a unique color on hover and reverts on mouse leave.
 */
const colors = [
  '#818cf8', // indigo-400
  '#a78bfa', // violet-400
  '#c084fc', // purple-400
  '#e879f9', // fuchsia-400
  '#f472b6', // pink-400
  '#fb923c', // orange-400
  '#facc15', // yellow-400
  '#34d399', // emerald-400
  '#22d3ee', // cyan-400
  '#60a5fa', // blue-400
];

const InteractiveText = ({ text }) => {
  return (
    <span>
      {text.split('').map((char, i) => (
        <span
          key={i}
          className="inline-block transition-all duration-300 cursor-default"
          style={{ whiteSpace: char === ' ' ? 'pre' : undefined }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = colors[i % colors.length];
            e.currentTarget.style.transform = 'scale(1.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '';
            e.currentTarget.style.transform = '';
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
};

export default HeroSection;
