import { Link } from 'react-router-dom';

export default function PageHero({ title, subtitle, breadcrumbs = [] }) {
  return (
    <section className="relative overflow-hidden px-6 pt-7 pb-8"
             style={{ background: 'linear-gradient(135deg, #3E2723, #4E342E)' }}>
      <div className="absolute inset-0"
           style={{ background: 'radial-gradient(circle at 80% 30%, rgba(230,180,34,0.08) 0%, transparent 50%)' }} />
      <div className="max-w-[1200px] mx-auto relative z-[1]">
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-2 text-[13px] text-white/40 mb-3">
            {breadcrumbs.map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span>›</span>}
                {item.href ? (
                  <Link to={item.href} className="text-white/50 no-underline hover:text-gold-400 transition-colors">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-white/70">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        {title && (
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-1">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-[15px] text-white/50 max-w-[500px]">{subtitle}</p>
        )}
      </div>
    </section>
  );
}
