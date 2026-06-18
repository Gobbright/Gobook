export function Card({ children, className = '' }) {
  return (
    <section className={`bg-white border border-[#dfe7f1] rounded-lg p-5 ${className}`}>
      {children}
    </section>
  );
}
