import { Link } from 'react-router-dom';

const footerLinks = [
  {
    title: 'Product',
    links: [
      { label: 'Build Rooms', href: '#' },
      { label: 'Discussions', href: '#' },
      { label: 'Proof Resume', href: '#' },
      { label: 'Deployments', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Careers', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
    ],
  },
];

/**
 * FooterSection - Site footer with logo, tagline, navigation links,
 * sign-in/sign-up links, and copyright.
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 10.1, 10.2
 */
const FooterSection = () => {
  return (
    <footer
      className="bg-[#020617] border-t border-white/10 py-12 px-6"
      aria-label="Site footer"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Logo and tagline */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <img
                src="/meet.svg"
                alt="MeeTogether logo"
                className="h-12 w-auto"
              />
              <span className="text-white text-xl font-bold">MeeTogether</span>
            </div>
            <p className="text-slate-400 text-sm wrap-break-word">Build-first tech network</p>

            {/* Auth links */}
            <div className="flex gap-4 mt-6">
              <Link
                to="/sign-in"
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
              >
                Sign In
              </Link>
              <Link
                to="/sign-up"
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
              >
                Sign Up
              </Link>
            </div>
          </div>

          {/* Navigation link groups */}
          <nav
            className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-8"
            aria-label="Footer navigation"
          >
            {footerLinks.map((group) => (
              <div key={group.title}>
                <h3 className="text-white font-semibold text-sm mb-3">
                  {group.title}
                </h3>
                <ul className="space-y-2">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-slate-400 text-sm hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 mt-10 pt-6 text-center">
          <p className="text-slate-500 text-sm">
            © 2026 MeeTogether. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
