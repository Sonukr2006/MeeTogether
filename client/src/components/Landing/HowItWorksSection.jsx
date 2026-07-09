import { UserPlus, Users, Rocket, Award } from 'lucide-react';

const steps = [
  {
    number: 1,
    label: 'Sign Up',
    description: 'Create your account in seconds',
    Icon: UserPlus,
  },
  {
    number: 2,
    label: 'Join a Project',
    description: 'Find a team that matches your stack',
    Icon: Users,
  },
  {
    number: 3,
    label: 'Ship Tasks',
    description: 'Complete real work, get peer reviews',
    Icon: Rocket,
  },
  {
    number: 4,
    label: 'Build Your Proof Resume',
    description: 'Every contribution is verified and visible',
    Icon: Award,
  },
];

/**
 * HowItWorksSection — Displays the platform workflow in 4 sequential steps.
 * Responsive: horizontal on desktop (md+), vertical stacked on mobile.
 * Visually connects steps with a line between numbered indicators.
 *
 * Validates: Requirements 5.1, 5.2, 5.3
 */
const HowItWorksSection = () => {
  return (
    <section
      className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto"
      aria-labelledby="how-it-works-heading"
    >
      <h2
        id="how-it-works-heading"
        className="text-3xl sm:text-4xl font-bold text-white text-center mb-16"
      >
        How It Works
      </h2>

      {/* Connecting line — vertical on mobile, horizontal on desktop */}
      {/* Mobile vertical line */}
      <div
        className="relative"
      >
        <div
          className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 to-purple-500 md:hidden"
          aria-hidden="true"
        />
        {/* Desktop horizontal line */}
        <div
          className="absolute hidden md:block top-6 left-[calc(12.5%+24px)] right-[calc(12.5%+24px)] h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500"
          aria-hidden="true"
        />

        <ol
          className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-12 md:gap-0 list-none p-0 m-0"
        >
          {steps.map(({ number, label, description, Icon }) => (
            <li
              key={number}
              className="relative flex items-start md:flex-col md:items-center md:flex-1 gap-4 md:gap-3 z-10"
            >
              {/* Numbered circle indicator */}
              <div
                className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/25"
                aria-hidden="true"
              >
                {number}
              </div>

              {/* Content */}
              <div className="flex flex-col md:items-center md:text-center mt-1 md:mt-2">
                <Icon
                  className="w-5 h-5 text-indigo-400 mb-1"
                  aria-hidden="true"
                />
                <h3 className="text-white font-semibold text-base mb-1">
                  {label}
                </h3>
                <p className="text-slate-400 text-sm max-w-[180px] break-words">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default HowItWorksSection;
