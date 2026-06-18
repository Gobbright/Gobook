import { Card } from '../../components/ui/Card.jsx';

export function DashboardMetrics({ metrics }) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-7">
      {metrics.map((metric) => (
        <Card className="min-h-37.5" key={metric.label}>
          <span>{metric.label}</span>
          <strong className="block my-4 text-2xl">{metric.value}</strong>
          <small>{metric.trend}</small>
        </Card>
      ))}
    </section>
  );
}
