import { DonutChart } from '../../components/charts/DonutChart.jsx';
import { GaugeChart } from '../../components/charts/GaugeChart.jsx';
import { LineChart } from '../../components/charts/LineChart.jsx';
import { Card } from '../../components/ui/Card.jsx';

export function DashboardOverview() {
  return (
    <>
      <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-4 mt-5">
        <Card>
          <h2 className="m-0 mb-4 text-base font-semibold">Sales Overview</h2>
          <LineChart />
        </Card>
        <Card>
          <h2 className="m-0 mb-4 text-base font-semibold">Cash Flow Summary</h2>
          <DonutChart />
        </Card>
      </section>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        <Card><h2 className="m-0 mb-4 text-base font-semibold">Top Customers</h2></Card>
        <Card><h2 className="m-0 mb-4 text-base font-semibold">Top Salespersons</h2></Card>
        <Card><h2 className="m-0 mb-4 text-base font-semibold">Inventory Status</h2></Card>
        <Card>
          <h2 className="m-0 mb-4 text-base font-semibold">Business Growth Score</h2>
          <GaugeChart />
        </Card>
      </section>
    </>
  );
}
