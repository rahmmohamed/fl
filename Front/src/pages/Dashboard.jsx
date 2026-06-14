import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import { fetchDashboard } from '../features/dashboard/dashboardSlice';

function KpiCard({ title, value, change, prefix = '' }) {
  const isPositive = change >= 0;
  return (
    <div className="kpi-card">
      <p className="kpi-title">{title}</p>
      <p className="kpi-value">{prefix}{value}</p>
      <span className={`kpi-change ${isPositive ? 'positive' : 'negative'}`}>
        {isPositive ? '▲' : '▼'} {Math.abs(change)}% vs last week
      </span>
    </div>
  );
}

export default function Dashboard() {
  const dispatch = useDispatch();
  const { summary, revenueWeekly, topCustomers, topProducts, loading, error } = useSelector((s) => s.dashboard);

  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  if (loading) return <div className="empty-state">Loading dashboard…</div>;
  if (error) return <div className="empty-state">Couldn't load dashboard: {error}</div>;
  if (!summary) return null;

  const chartData = revenueWeekly.map((row) => ({
    week: new Date(row.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: Number(row.revenue),
  }));

  const productChartData = topProducts.map((p) => ({
    name: p.name.length > 14 ? p.name.slice(0, 14) + '…' : p.name,
    revenue: Number(p.total_revenue),
  }));

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Weekly overview of deals, revenue, and performance</p>
      </div>

      <div className="kpi-grid">
        <KpiCard title="Deals this week" value={summary.deals.value} change={summary.deals.change} />
        <KpiCard title="Revenue this week" value={summary.revenue.value.toLocaleString()} change={summary.revenue.change} prefix="$" />
        <KpiCard title="Deals won" value={summary.won.value} change={summary.won.change} />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Revenue by week</h3>
          {chartData.length === 0 ? (
            <div className="empty-state">No closed deals yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                <XAxis dataKey="week" stroke="#8b98ad" fontSize={12} />
                <YAxis stroke="#8b98ad" fontSize={12} />
                <Tooltip contentStyle={{ background: '#1a2230', border: '1px solid #2d3748', borderRadius: 8 }} />
                <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Top customers</h3>
          {topCustomers.length === 0 ? (
            <div className="empty-state">No data yet</div>
          ) : (
            topCustomers.map((c) => (
              <div className="list-item" key={c.id}>
                <span className="list-item-name">{c.name}</span>
                <span className="list-item-value">${Number(c.total_revenue).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Top products by revenue</h3>
        {productChartData.length === 0 ? (
          <div className="empty-state">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={productChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
              <XAxis dataKey="name" stroke="#8b98ad" fontSize={12} />
              <YAxis stroke="#8b98ad" fontSize={12} />
              <Tooltip contentStyle={{ background: '#1a2230', border: '1px solid #2d3748', borderRadius: 8 }} />
              <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
