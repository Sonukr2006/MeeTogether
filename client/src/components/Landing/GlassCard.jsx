/**
 * GlassCard - A reusable glassmorphism card primitive for the landing page.
 *
 * @param {object} props
 * @param {string} [props.title] - Card heading text (rendered as h3)
 * @param {React.ReactNode} props.children - Card body content
 * @param {string} [props.className] - Additional CSS classes
 */
const GlassCard = ({ title, children, className = "", tag }) => {
  return (
    <div
      className={`
    relative overflow-hidden
    backdrop-blur-xl 
    bg-white/5 
    border border-white/10 
    rounded-2xl 
    p-8
    ${className}
  `}
    >
      {tag && (
        <span
          className="
        absolute 
        top-5 
        -left-10
        w-36
        bg-linear-to-r 
        from-purple-500 
        to-pink-500
        text-white 
        text-xs 
        font-bold 
        py-1
        text-center
        -rotate-45
        shadow-lg
      "
        >
          {tag}
        </span>
      )}

      {title && (
        <h3 className="text-xl font-semibold text-white mb-10 pl-5">{title}</h3>
      )}

      <div>{children}</div>
    </div>
  );
};

export default GlassCard;
