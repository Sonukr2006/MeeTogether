import GlassCard from './GlassCard';

const metrics = [
  { value: '+-+', label: 'Active Builders' },
  { value: '+-+', label: 'Projects Shipped' },
  { value: '+-+', label: 'Peer Reviews Given' },
];

/**
 * StatsSection - Displays community metrics as social proof.
 * Uses GlassCard components in a responsive grid layout.
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 10.3
 */
const StatsSection = () => {
  return (
    <section className="py-20 px-6" aria-labelledby="stats-heading">
      <h2
        id="stats-heading"
        className="text-3xl md:text-4xl font-bold text-white text-center mb-12"
      >
        Community in numbers
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {metrics.map((metric) => (
          <GlassCard key={metric.label} className="text-center py-8">
            <p className="text-3xl sm:text-4xl font-bold text-white">
              {metric.value}
            </p>
            <p className="text-sm text-slate-400 mt-2">{metric.label}</p>
          </GlassCard>
        ))}
      </div>
    </section>
  );
};

export default StatsSection;
