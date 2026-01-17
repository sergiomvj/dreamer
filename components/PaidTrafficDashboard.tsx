import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { AdMetric } from '../types';

interface PaidTrafficDashboardProps {
  tenantId: string;
}

const PaidTrafficDashboard: React.FC<PaidTrafficDashboardProps> = ({ tenantId }) => {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);

      // 1. Get Ad Accounts for Tenant
      const { data: accounts } = await supabase
        .from('ad_accounts')
        .select('id')
        .eq('tenant_id', tenantId);

      if (!accounts || accounts.length === 0) {
        setMetrics([]);
        setLoading(false);
        return;
      }

      const accountIds = accounts.map(a => a.id);

      // 2. Get Metrics
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
      const startDateStr = startDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('ad_metrics')
        .select(`
          *,
          ad_campaigns ( name ),
          ad_sets ( name ),
          ads ( name )
        `)
        .in('ad_account_id', accountIds)
        .gte('metric_date', startDateStr);

      if (error) {
        console.error('Error fetching metrics:', error);
      } else {
        setMetrics(data || []);
      }
      setLoading(false);
    };

    fetchMetrics();
  }, [tenantId, dateRange]);

  // Aggregation
  const totals = metrics.reduce(
    (acc, curr) => ({
      spend: acc.spend + (curr.spend || 0),
      impressions: acc.impressions + (curr.impressions || 0),
      clicks: acc.clicks + (curr.clicks || 0),
      conversions: acc.conversions + (curr.conversions || 0),
    }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
  );

  const cpc = totals.clicks > 0 ? (totals.spend / totals.clicks).toFixed(2) : '0.00';
  const ctr = totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : '0.00';
  const cpa = totals.conversions > 0 ? (totals.spend / totals.conversions).toFixed(2) : '0.00';

  if (loading) return <div className="text-slate-400 p-4">Carregando dashboard...</div>;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex justify-end">
        <select 
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="bg-slate-800 text-white border border-slate-700 rounded p-2 text-sm"
        >
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="Investimento" value={`R$ ${totals.spend.toFixed(2)}`} icon="attach_money" />
        <KPICard title="Impressões" value={totals.impressions.toLocaleString()} icon="visibility" />
        <KPICard title="Cliques" value={totals.clicks.toLocaleString()} icon="mouse" />
        <KPICard title="Conversões" value={totals.conversions.toLocaleString()} icon="flag" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="CPC Médio" value={`R$ ${cpc}`} icon="trending_flat" subtext="Custo por Clique" />
        <KPICard title="CTR" value={`${ctr}%`} icon="percent" subtext="Taxa de Cliques" />
        <KPICard title="CPA" value={`R$ ${cpa}`} icon="shopping_cart" subtext="Custo por Ação" />
      </div>

      {/* Campaigns Table */}
      <div className="bg-surface-dark/30 border border-border-dark rounded-xl p-6 overflow-hidden">
        <h3 className="text-lg font-bold text-white mb-4">Performance por Campanha</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-400">
            <thead className="text-xs text-slate-200 uppercase bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Campanha</th>
                <th className="px-4 py-3">Investimento</th>
                <th className="px-4 py-3">Impr.</th>
                <th className="px-4 py-3">Cliques</th>
                <th className="px-4 py-3">CTR</th>
                <th className="px-4 py-3">Conv.</th>
                <th className="px-4 py-3 rounded-tr-lg">CPA</th>
              </tr>
            </thead>
            <tbody>
              {/* Group metrics by Campaign */}
              {Object.values(metrics.reduce((acc: any, curr) => {
                 const id = curr.ad_campaign_id;
                 if (!id) return acc;
                 if (!acc[id]) {
                   acc[id] = {
                     name: curr.ad_campaigns?.name || 'Unknown',
                     spend: 0, impressions: 0, clicks: 0, conversions: 0
                   };
                 }
                 acc[id].spend += (curr.spend || 0);
                 acc[id].impressions += (curr.impressions || 0);
                 acc[id].clicks += (curr.clicks || 0);
                 acc[id].conversions += (curr.conversions || 0);
                 return acc;
              }, {})).map((camp: any, idx) => (
                <tr key={idx} className="border-b border-slate-700/50 hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-white">{camp.name}</td>
                  <td className="px-4 py-3">R$ {camp.spend.toFixed(2)}</td>
                  <td className="px-4 py-3">{camp.impressions.toLocaleString()}</td>
                  <td className="px-4 py-3">{camp.clicks.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {camp.impressions > 0 ? ((camp.clicks / camp.impressions) * 100).toFixed(2) : '0.00'}%
                  </td>
                  <td className="px-4 py-3">{camp.conversions.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {camp.conversions > 0 ? `R$ ${(camp.spend / camp.conversions).toFixed(2)}` : '-'}
                  </td>
                </tr>
              ))}
              {metrics.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8">Nenhum dado encontrado para o período.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon, subtext }: { title: string, value: string, icon: string, subtext?: string }) => (
  <div className="bg-surface-dark/30 border border-border-dark p-6 rounded-xl flex items-center justify-between">
    <div>
      <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-black text-white mt-1">{value}</p>
      {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
    </div>
    <div className="bg-primary/10 p-3 rounded-lg text-primary">
      <span className="material-symbols-outlined">{icon}</span>
    </div>
  </div>
);

export default PaidTrafficDashboard;
