import { BookOpen, MessageSquare, BarChart3 } from 'lucide-react';
import GlassCard from './GlassCard';
import LottieAnimation from './LottieAnimation';
import mentorAnimationData from '../../assets/animations/dazzle-line-man-studying-in-an-online-lesson.json';
import recruiterAnimationData from '../../assets/animations/social-colleagues-at-an-online-meeting-1.json';
// import recruiterAnimationData from '../../assets/animations/office-desk-working.json';
import studentAnimationData from '../../assets/animations/juicy-girl-working-at-home.json'

/**
 * BentoSection - Value proposition grid showing benefits for Students, Mentors, and Recruiters.
 * Renders exactly 3 GlassCard components in a responsive grid layout.
 *
 * Validates: Requirements 3.1, 10.1, 10.3
 */
const BentoSection = () => {
  return (
    <section
      className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      aria-labelledby="bento-heading"
    >
      <h2
        id="bento-heading"
        className="text-3xl sm:text-4xl font-bold text-white text-center mb-12"
      >
        Built for every builder
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Student Card */}
        <GlassCard title="Ship Work, Build Proof" tag='Student'>
          <LottieAnimation
            animationData={studentAnimationData}
            fallback={<BookOpen className="w-16 h-16 text-indigo-400" aria-hidden="true" />}
            ariaLabel="Student completing tasks illustration"
            className="mb-4 flex items-center justify-center h-50 min-h-[250px]"
            
          />
          <p className="text-gray-300 text-sm leading-relaxed wrap-break-words p-5">
            Complete tasks, ship real work, and watch your Proof Resume update instantly.
            Every contribution is verified and visible to those who matter.
          </p>
        </GlassCard>

        {/* Mentor Card */}
        <GlassCard title="Guide with Micro-Mentorship" tag='Mentor'>
          <LottieAnimation
            animationData={mentorAnimationData}
            fallback={<MessageSquare className="w-16 h-16 text-indigo-400" aria-hidden="true" />}
            ariaLabel="Mentor reviewing code illustration"
            className="mb-4 flex items-center justify-center h-50 min-h-[250px]"
            
          />
          <p className="text-gray-300 text-sm leading-relaxed flex-wrap-reverse p-5">
            Leave helpful comments on code and Issues. Small guidance moments that
            shape developers and build your mentorship track record.
          </p>
        </GlassCard>

        {/* Recruiter Card */}
       <GlassCard title="Hire Execution, Not Buzzwords" tag='Recruiter' className=''>
          <LottieAnimation
            animationData={recruiterAnimationData}
            fallback={<BarChart3 className="w-16 h-16 text-indigo-400 " aria-hidden="true" />}
            ariaLabel="Recruiter viewing dashboard illustration"
            className="mb-4 flex items-center justify-center h-50 min-h-[250px] sm:min-h-0 "
            
          />
          <p className="text-gray-300 text-sm leading-relaxed p-5 wrap-anywhere">
            See verified skills, completed tasks, and Proof Score - not self-reported
            buzzwords. Hire based on what candidates have actually shipped.
          </p>
        </GlassCard>
      </div>
    </section>
  );
};

export default BentoSection;
