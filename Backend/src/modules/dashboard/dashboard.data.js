export const dashboardSummary = {
  metrics: [
    { label: "Today's Sales", value: 'INR 50,542', trend: '12.5%', tone: 'blue' },
    { label: 'Monthly Revenue', value: 'INR 12,45,000', trend: '18.3%', tone: 'green' },
    { label: 'Pending Payments', value: 'INR 2,35,450', trend: '8.7%', tone: 'orange' },
    { label: 'GST Payable', value: 'INR 78,650', trend: 'Due on 20 Jun 2026', tone: 'purple' },
  ],
  transactions: [
    { invoice: 'INV-2026-105', customer: 'ABC Enterprises', amount: 'INR 12,450', status: 'Paid', date: '02 Jun 2026' },
    { invoice: 'INV-2026-104', customer: 'Krishna Traders', amount: 'INR 8,750', status: 'Pending', date: '02 Jun 2026' },
    { invoice: 'INV-2026-103', customer: 'Sharma Stores', amount: 'INR 5,600', status: 'Paid', date: '01 Jun 2026' },
    { invoice: 'INV-2026-102', customer: 'Om Retail', amount: 'INR 9,850', status: 'Pending', date: '01 Jun 2026' },
    { invoice: 'INV-2026-101', customer: 'Modern Mart', amount: 'INR 4,300', status: 'Paid', date: '31 May 2026' },
  ],
  reminders: [
    { title: 'GST Payment Due', description: 'INR 78,650 due on 20 Jun 2026' },
    { title: 'Follow up with 12 customers', description: 'Pending payments' },
    { title: 'Inventory Low Stock Alert', description: '23 items are running low' },
    { title: 'Employee Payroll', description: 'May payroll processing' },
  ],
  insights: [
    'Sales will increase by 18%',
    'Focus on Wireless Earbuds',
    'Follow up with 12 customers',
    'Best performing salesperson Rahul Sharma',
  ],
};
