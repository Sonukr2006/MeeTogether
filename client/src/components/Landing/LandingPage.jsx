import HeroSection from './HeroSection';
import BentoSection from './BentoSection';
import HowItWorksSection from './HowItWorksSection';
import StatsSection from './StatsSection';
import FooterSection from './FooterSection';

/**
 * LandingPage - Orchestrator component that composes all landing page sections.
 * Renders the full marketing page for unauthenticated visitors.
 * Uses semantic HTML: HeroSection renders as <header>,
 * content sections are wrapped in <main>, FooterSection is a <footer>.
 *
 * Validates: Requirements 4.1, 4.3, 4.4, 9.2, 10.1
 */
const LandingPage = () => {
  return (
    <div className="bg-[#020617] min-h-screen overflow-x-hidden">
      <HeroSection />
      <main aria-label="Landing page main content">
        <BentoSection />
        <HowItWorksSection />
        <StatsSection />
      </main>
      <FooterSection />
    </div>
  );
};

export default LandingPage;
