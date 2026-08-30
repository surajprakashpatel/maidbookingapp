'use client';

import { AppShell } from '@/components/layout/AppShell';
import { formatINR, formatINRCompact } from '@/lib/utils';
import { TrendingUp, TrendingDown, Wallet, Clock, CheckCircle, Lightbulb } from 'lucide-react';

const MONTHLY_DATA = [
  { month: 'Mar', amount: 12400 },
  { month: 'Apr', amount: 18600 },
  { month: 'May', amount: 15200 },
  { month: 'Jun', amount: 21000 },
  { month: 'Jul', amount: 19800 },
  { month: 'Aug', amount: 24500 },
];

const TRANSACTIONS = [
  { id: 'MB-240801', service: 'House Cleaning', customer: 'Rahul Gupta', date: '2024-08-30', amount: 570, status: 'paid' },
  { id: 'MB-240799', service: 'Cooking', customer: 'Priya Singh', date: '2024-08-28', amount: 285, status: 'paid' },
  { id: 'MB-240795', service: 'House Cleaning', customer: 'Amit Sharma', date: '2024-08-25', amount: 760, status: 'paid' },
  { id: 'MB-240788', service: 'Laundry', customer: 'Neha Gupta', date: '2024-08-22', amount: 380, status: 'pending' },
];

export default function MaidEarningsPage() {
  const maxAmount = Math.max(...MONTHLY_DATA.map(d => d.amount));

  return (
    <AppShell role="maid" headerProps={{ title: 'Earnings', showNotifications: false }}>
      <div className="animate-fade-in">
        {/* Overview cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: 'Total Earnings', value: formatINRCompact(145000), trend: '+12%', up: true, Icon: Wallet, color: 'var(--success-600)' },
            { label: 'This Month', value: formatINR(24500), trend: '+₹4,200', up: true, Icon: TrendingUp, color: 'var(--primary-600)' },
            { label: 'Pending', value: formatINR(380), trend: '1 booking', up: false, Icon: Clock, color: 'var(--accent-600)' },
            { label: 'Completed Jobs', value: '148', trend: 'all time', up: true, Icon: CheckCircle, color: 'var(--success-600)' },
          ].map(({ label, value, trend, up, Icon, color }) => (
            <div key={label} className="stats-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Icon size={22} style={{ color }} />
                <span className={`stats-change ${up ? 'positive' : 'negative'}`}>
                  {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {trend}
                </span>
              </div>
              <div className="stats-value" style={{ fontSize: '20px' }}>{value}</div>
              <div className="stats-label">{label}</div>
            </div>
          ))}
        </div>

        {/* Bar Chart */}
        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '20px', marginBottom: '20px', border: '1px solid var(--border-light)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 20px' }}>Monthly Earnings</h2>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '120px' }}>
            {MONTHLY_DATA.map((d, i) => {
              const height = (d.amount / maxAmount) * 100;
              const isLast = i === MONTHLY_DATA.length - 1;
              return (
                <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600 }}>{formatINRCompact(d.amount)}</div>
                  <div style={{
                    width: '100%',
                    height: `${height}%`,
                    background: isLast
                      ? 'linear-gradient(180deg, var(--primary-500), var(--primary-400))'
                      : 'var(--gray-100)',
                    borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                    transition: 'height 0.5s ease',
                    minHeight: '4px',
                  }} />
                  <div style={{ fontSize: '11px', color: isLast ? 'var(--primary-600)' : 'var(--text-muted)', fontWeight: isLast ? 700 : 400 }}>{d.month}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Platform fee note */}
        <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)', padding: '12px 16px', marginBottom: '20px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Lightbulb size={16} style={{ color: 'var(--primary-600)', flexShrink: 0 }} /> Platform charges 5% per booking. Your earnings shown are after the platform fee deduction.
        </div>

        {/* Recent transactions */}
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Recent Payments</h2>
          <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
            {TRANSACTIONS.map((txn, i) => (
              <div key={txn.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderBottom: i < TRANSACTIONS.length - 1 ? '1px solid var(--border-light)' : 'none',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', background: txn.status === 'paid' ? 'var(--success-50)' : 'var(--accent-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {txn.status === 'paid' ? <CheckCircle size={18} style={{ color: 'var(--success-600)' }} /> : <Clock size={18} style={{ color: 'var(--accent-600)' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{txn.service}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{txn.customer} • {txn.date}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{txn.id}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: txn.status === 'paid' ? 'var(--success-600)' : 'var(--accent-600)' }}>
                    +{formatINR(txn.amount)}
                  </div>
                  <div style={{ fontSize: '10px', color: txn.status === 'paid' ? 'var(--success-500)' : 'var(--accent-500)', fontWeight: 600 }}>
                    {txn.status === 'paid' ? 'Received' : 'Pending'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: '24px' }} />
      </div>
    </AppShell>
  );
}
