import { useState, useEffect, useRef } from 'react';
import {
  Upload, Download, CheckCircle, AlertCircle,
  TrendingDown, DollarSign, Users, AlertTriangle, Loader2,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RevenueMetrics {
  estimated_revenue_loss: number;
  total_likely_churn: number;
  avg_revenue_per_customer: number;
  high_value_at_risk: number;
}

interface HighValueCustomer {
  id: string;
  monthly_revenue: number;
  churn_prob: number;
  risk_factors: string;
}

interface CustomerSegment {
  name: string;
  value: number;
  color: string;
}

interface FeatureImportance {
  feature: string;
  importance: number;
}

interface ModelResult {
  model: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
}

interface ShapValue {
  feature: string;
  value: number;
  feature_value: number;
  description: string;
}

interface TopCustomerAnalysis {
  id: string;
  monthly_revenue: number;
  churn_prob: number;
  shap_values: ShapValue[];
}

interface PipelineResults {
  model_results: ModelResult[];
  best_model_name: string;
  confusion_matrix: { tn: number; fp: number; fn: number; tp: number };
  feature_importance: FeatureImportance[];
  customer_segments: CustomerSegment[];
  high_value_customers: HighValueCustomer[];
  revenue_metrics: RevenueMetrics;
  top_customer_analysis: TopCustomerAnalysis;
  model_comparison_chart: { model: string; accuracy: number; roc_auc: number }[];
}

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

// ─── Component ───────────────────────────────────────────────────────────────

export default function App() {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [data, setData] = useState<PipelineResults | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus('uploading');
    setErrorMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);

      const { job_id } = await res.json();
      setUploadStatus('processing');

      // Poll every 2 s for completion
      pollRef.current = setInterval(async () => {
        const statusRes = await fetch(`/api/status/${job_id}`);
        const statusData = await statusRes.json();

        if (statusData.status === 'complete') {
          clearInterval(pollRef.current!);
          const resultsRes = await fetch(`/api/results/${job_id}`);
          const results: PipelineResults = await resultsRes.json();
          setData(results);
          setUploadStatus('complete');
        } else if (statusData.status === 'error') {
          clearInterval(pollRef.current!);
          setErrorMessage(statusData.error ?? 'Pipeline failed');
          setUploadStatus('error');
        }
      }, 2000);
    } catch (err) {
      setErrorMessage(String(err));
      setUploadStatus('error');
    }
  };

  const handleExport = () => {
    if (!data) return;
    const rows = ['id,monthly_revenue,churn_prob,risk_factors',
      ...data.high_value_customers.map(
        c => `${c.id},${c.monthly_revenue},${c.churn_prob},"${c.risk_factors}"`
      )];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'high_value_customers_at_risk.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Upload prompt ──────────────────────────────────────────────────────────
  const UploadPrompt = () => (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <Upload className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="text-[22px] mb-2">Upload Your Customer Dataset</h2>
      <p className="text-[14px] text-muted-foreground mb-6 max-w-md">
        Upload a CSV file to run the full ML pipeline — 5 models, SHAP analysis,
        and revenue impact calculations. Compatible with the Telco Customer Churn format.
      </p>
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
      >
        <Upload className="w-4 h-4" />
        <span>Choose CSV File</span>
      </button>
    </div>
  );

  // ─── Processing state ───────────────────────────────────────────────────────
  const ProcessingState = () => (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
      <h2 className="text-[22px] mb-2">
        {uploadStatus === 'uploading' ? 'Uploading Dataset…' : 'Running ML Pipeline…'}
      </h2>
      <p className="text-[14px] text-muted-foreground">
        {uploadStatus === 'processing'
          ? 'Training 5 models with GridSearchCV + SMOTE, then running SHAP analysis…'
          : 'Uploading your CSV file…'}
      </p>
    </div>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#fafafa]">

      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="max-w-[1400px] mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[28px] tracking-tight">Customer Churn Prediction</h1>
              <p className="text-[14px] text-muted-foreground mt-1">AI-powered revenue retention analytics</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Hidden file input — triggered by all Upload buttons */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />

              {uploadStatus === 'idle' && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Dataset</span>
                </button>
              )}
              {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="text-[15px] text-blue-600">
                    {uploadStatus === 'uploading' ? 'Uploading…' : 'Running ML Pipeline…'}
                  </span>
                </div>
              )}
              {uploadStatus === 'complete' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-[#dcfce7] border border-[#16a34a]/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-[#16a34a]" />
                  <span className="text-[15px] text-[#16a34a]">Analysis Complete</span>
                </div>
              )}
              {uploadStatus === 'error' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-[15px] text-red-600">{errorMessage || 'Error'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-8 py-8">

        {uploadStatus === 'idle'    && <UploadPrompt />}
        {(uploadStatus === 'uploading' || uploadStatus === 'processing') && <ProcessingState />}

        {uploadStatus === 'complete' && data && (
          <>
            {/* ── Revenue Impact Cards ────────────────────────────────────── */}
            <section className="mb-8">
              <h2 className="text-[20px] mb-6">Revenue Impact Analysis</h2>
              <div className="grid grid-cols-4 gap-4">

                <div className="bg-gradient-to-br from-[#dc2626] to-[#b91c1c] text-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div className="text-[13px] opacity-90">Estimated Revenue Loss</div>
                  </div>
                  <div className="text-[32px] tracking-tight mb-1">
                    ${data.revenue_metrics.estimated_revenue_loss}K
                  </div>
                  <div className="text-[13px] opacity-75">Annual projection</div>
                </div>

                <div className="bg-gradient-to-br from-[#f59e0b] to-[#d97706] text-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="text-[13px] opacity-90">High-Value at Risk</div>
                  </div>
                  <div className="text-[32px] tracking-tight mb-1">
                    {data.revenue_metrics.high_value_at_risk}
                  </div>
                  <div className="text-[13px] opacity-75">Customers</div>
                </div>

                <div className="bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <TrendingDown className="w-5 h-5" />
                    </div>
                    <div className="text-[13px] opacity-90">Total Likely to Churn</div>
                  </div>
                  <div className="text-[32px] tracking-tight mb-1">
                    {data.revenue_metrics.total_likely_churn}
                  </div>
                  <div className="text-[13px] opacity-75">In test set</div>
                </div>

                <div className="bg-gradient-to-br from-[#16a34a] to-[#15803d] text-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="text-[13px] opacity-90">Avg Revenue Per Customer</div>
                  </div>
                  <div className="text-[32px] tracking-tight mb-1">
                    ${data.revenue_metrics.avg_revenue_per_customer}
                  </div>
                  <div className="text-[13px] opacity-75">Monthly</div>
                </div>

              </div>
            </section>

            {/* ── High-Value Customers Table ──────────────────────────────── */}
            <section className="bg-white border border-border rounded-lg mb-8">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-[20px]">High-Value Customers at Risk</h2>
                  <p className="text-[13px] text-muted-foreground mt-1">
                    Top customers likely to churn — immediate action required
                  </p>
                </div>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
                >
                  <Download className="w-4 h-4" />
                  <span>Export List</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {['Customer ID', 'Monthly Revenue', 'Churn Probability', 'Top Risk Factor'].map(h => (
                        <th key={h} className="px-6 py-4 text-left text-[13px] text-muted-foreground uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.high_value_customers.map(c => (
                      <tr key={c.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4 font-mono text-[14px]">{c.id}</td>
                        <td className="px-6 py-4 font-medium">${c.monthly_revenue.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 max-w-[100px] h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#dc2626] rounded-full transition-all duration-500"
                                style={{ width: `${c.churn_prob * 100}%` }}
                              />
                            </div>
                            <span className={`text-[14px] font-medium ${c.churn_prob > 0.8 ? 'text-[#dc2626]' : 'text-[#f59e0b]'}`}>
                              {Math.round(c.churn_prob * 100)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[13px] text-muted-foreground">{c.risk_factors}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── Charts Grid ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-8 mb-8">

              {/* Customer Risk Segmentation */}
              <div className="bg-white border border-border rounded-lg p-6">
                <h3 className="text-[18px] mb-1">Customer Risk Segmentation</h3>
                <p className="text-[13px] text-muted-foreground mb-6">
                  Distribution by churn probability
                </p>
                <div className="flex items-center gap-8">
                  <ResponsiveContainer width="55%" height={240}>
                    <PieChart>
                      <Pie
                        data={data.customer_segments}
                        cx="50%" cy="50%"
                        innerRadius={60} outerRadius={90}
                        paddingAngle={2} dataKey="value"
                      >
                        {data.customer_segments.map((seg, i) => (
                          <Cell key={i} fill={seg.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="flex-1 space-y-4">
                    {data.customer_segments.map(seg => {
                      const total = data.customer_segments.reduce((s, x) => s + x.value, 0);
                      return (
                        <div key={seg.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
                            <span className="text-[14px]">{seg.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-[16px] font-medium">{seg.value}</div>
                            <div className="text-[12px] text-muted-foreground">
                              {Math.round((seg.value / total) * 100)}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Model Performance Comparison */}
              <div className="bg-white border border-border rounded-lg p-6">
                <h3 className="text-[18px] mb-1">Model Performance Comparison</h3>
                <p className="text-[13px] text-muted-foreground mb-6">
                  Accuracy vs ROC-AUC across all trained models
                </p>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.model_comparison_chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="model" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={[70, 100]} unit="%" />
                    <Tooltip formatter={(v: number) => `${v}%`} />
                    <Legend wrapperStyle={{ fontSize: 13 }} />
                    <Bar dataKey="accuracy" fill="#2563eb" name="Accuracy"  radius={[4, 4, 0, 0]} />
                    <Bar dataKey="roc_auc"  fill="#16a34a" name="ROC-AUC" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

            </div>

            {/* ── Feature Importance ──────────────────────────────────────── */}
            <section className="bg-white border border-border rounded-lg p-6 mb-8">
              <h3 className="text-[18px] mb-1">Why Customers Churn</h3>
              <p className="text-[13px] text-muted-foreground mb-6">
                Top features driving churn (Random Forest importance)
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.feature_importance.slice(0, 6)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="feature" type="category" width={200} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="importance" fill="#dc2626" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>

            {/* ── SHAP Individual Customer Analysis ───────────────────────── */}
            {data.top_customer_analysis && (
              <section className="bg-white border border-border rounded-lg p-6 mb-8">
                <h3 className="text-[18px] mb-1">Individual Customer Analysis</h3>
                <p className="text-[13px] text-muted-foreground mb-6">
                  SHAP values explaining why the highest-risk customer is predicted to churn
                </p>

                <div className="bg-muted/30 border border-border rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[14px] font-medium">
                      Customer: {data.top_customer_analysis.id}
                    </span>
                    <span className="px-3 py-1 bg-[#dc2626] text-white rounded-full text-[13px]">
                      {Math.round(data.top_customer_analysis.churn_prob * 100)}% Churn Risk
                    </span>
                  </div>
                  <div className="text-[13px] text-muted-foreground">
                    Monthly Revenue: ${data.top_customer_analysis.monthly_revenue}
                    &nbsp;·&nbsp;Best Model: {data.best_model_name}
                  </div>
                </div>

                <div className="space-y-4">
                  {data.top_customer_analysis.shap_values.map(shap => {
                    const absMax = Math.max(
                      ...data.top_customer_analysis.shap_values.map(s => Math.abs(s.value))
                    );
                    const widthPct  = Math.round((Math.abs(shap.value) / absMax) * 100);
                    const isPositive = shap.value > 0;

                    return (
                      <div key={shap.feature} className="border border-border rounded-lg p-5 hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[15px]">{shap.feature}</span>
                          <span className={`text-[15px] font-medium ${isPositive ? 'text-[#dc2626]' : 'text-[#16a34a]'}`}>
                            {isPositive ? '+' : ''}{shap.value.toFixed(3)}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${isPositive ? 'bg-[#dc2626]' : 'bg-[#16a34a]'}`}
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                        <div className="text-[12px] text-muted-foreground mt-2">{shap.description}</div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Model Comparison Table ───────────────────────────────────── */}
            <section className="bg-white border border-border rounded-lg mb-8">
              <div className="p-6 border-b border-border">
                <h2 className="text-[20px]">Model Comparison</h2>
                <p className="text-[13px] text-muted-foreground mt-1">
                  Best model: <strong>{data.best_model_name}</strong> (highest ROC-AUC)
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {['Model', 'Accuracy', 'Precision', 'Recall', 'F1', 'ROC-AUC'].map(h => (
                        <th key={h} className="px-6 py-4 text-left text-[13px] text-muted-foreground uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.model_results.map(row => (
                      <tr
                        key={row.model}
                        className={`border-b border-border transition-colors ${
                          row.model === data.best_model_name ? 'bg-green-50' : 'hover:bg-muted/20'
                        }`}
                      >
                        <td className="px-6 py-4 font-medium">
                          {row.model}
                          {row.model === data.best_model_name && (
                            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded text-[11px]">
                              Best
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">{(row.accuracy  * 100).toFixed(1)}%</td>
                        <td className="px-6 py-4">{(row.precision * 100).toFixed(1)}%</td>
                        <td className="px-6 py-4">{(row.recall    * 100).toFixed(1)}%</td>
                        <td className="px-6 py-4">{(row.f1        * 100).toFixed(1)}%</td>
                        <td className="px-6 py-4">{(row.roc_auc   * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

          </>
        )}
      </div>
    </div>
  );
}
