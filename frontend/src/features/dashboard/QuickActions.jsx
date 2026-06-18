import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';

const actions = ['Create Invoice', 'Create Quotation', 'Add Customer', 'Add Product', 'Record Payment', 'Stock In', 'Stock Out'];

export function QuickActions() {
  return (
    <Card className="mt-5">
      <h2 className="m-0 mb-4 text-base font-semibold">Quick Actions</h2>
      <div className="flex flex-wrap gap-4">
        {actions.map((action) => <Button key={action} variant="ghost">{action}</Button>)}
      </div>
    </Card>
  );
}
