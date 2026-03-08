import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ImpactPage() {
    const [orderId, setOrderId] = useState('');
    const [products, setProducts] = useState([
        { name: '', category: '', quantity: 1, weight_grams: 0, is_sustainable: false, is_local: false }
    ]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [report, setReport] = useState(null);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await fetch('/api/impact/history');
            if (!response.ok) throw new Error('Failed to fetch history');
            const data = await response.json();
            setHistory(data);
        } catch (err) {
            console.error('History fetch error:', err);
        }
    };

    const handleAddProduct = () => {
        setProducts([...products, { name: '', category: '', quantity: 1, weight_grams: 0, is_sustainable: false, is_local: false }]);
    };

    const handleRemoveProduct = (index) => {
        setProducts(products.filter((_, i) => i !== index));
    };

    const handleProductChange = (index, field, value) => {
        const updatedProducts = [...products];
        updatedProducts[index][field] = value;
        setProducts(updatedProducts);
    };

    const handleGenerate = async (e) => {
        e.preventDefault();

        if (!orderId || orderId.length < 3) {
            setError('Order ID must be at least 3 characters.');
            return;
        }

        const invalidProduct = products.find(p => !p.name || p.name.length < 2 || p.quantity < 1 || p.weight_grams <= 0);
        if (invalidProduct) {
            setError('Please ensure all products have valid names, quantities (>=1), and weights (>0).');
            return;
        }

        setLoading(true);
        setError(null);
        setReport(null);

        try {
            const formattedProducts = products.map(p => ({
                ...p,
                quantity: parseInt(p.quantity, 10),
                weight_grams: parseFloat(p.weight_grams)
            }));

            const response = await fetch('/api/impact/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: orderId,
                    products: formattedProducts
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to generate impact report');
            }

            const data = await response.json();
            setReport(data);
            fetchHistory();

            setTimeout(() => {
                document.getElementById('report-output')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleViewReport = async (id) => {
        setLoading(true);
        setError(null);
        setReport(null);

        try {
            const response = await fetch(`/api/impact/${id}`);
            if (!response.ok) throw new Error('Failed to fetch report details');

            const data = await response.json();
            setReport(data);

            setTimeout(() => {
                document.getElementById('report-output')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const chartData = report ? report.products.map(p => ({
        name: p.name,
        plastic_saved: p.is_sustainable ? parseFloat((p.quantity * p.weight_grams * 0.6).toFixed(2)) : 0
    })).filter(p => p.plastic_saved > 0) : [];

    return (
        <>
            <style>
                {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');
          
          .font-heading { font-family: 'Plus Jakarta Sans', sans-serif; }
          .font-body { font-family: 'Inter', sans-serif; }
        `}
            </style>

            <div className="min-h-screen bg-gray-50 font-body py-8 px-4 sm:px-6 lg:px-8 text-gray-900">
                <div className="max-w-7xl mx-auto space-y-8">

                    <div className="mb-8 border-b border-gray-200 pb-5">
                        <h1 className="text-3xl font-heading font-bold text-gray-900">AI Impact Reporting Generator</h1>
                        <p className="mt-2 text-gray-600">Calculate sustainability metrics and generate personalized, positive impact statements for customer orders.</p>
                    </div>

                    {/* SECTION 1 — Order Input Form */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                        <h2 className="text-xl font-heading font-semibold mb-6 flex items-center">
                            <span className="bg-green-100 text-green-700 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">1</span>
                            Order Details
                        </h2>

                        <form onSubmit={handleGenerate} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Order ID <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={orderId}
                                    onChange={(e) => setOrderId(e.target.value)}
                                    className="w-full md:w-1/2 border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
                                    placeholder="e.g. ORD-2024-001"
                                    required
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-t-lg border border-gray-200 border-b-0">
                                    <h3 className="text-md font-medium text-gray-900">Products in Order ({products.length})</h3>
                                    <button
                                        type="button"
                                        onClick={handleAddProduct}
                                        className="text-sm font-medium text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-md transition-colors flex items-center"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                        Add Product
                                    </button>
                                </div>

                                <div className="border border-gray-200 rounded-b-lg divide-y divide-gray-100 bg-white">
                                    {products.map((product, index) => (
                                        <div key={index} className="p-4 sm:px-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-end hover:bg-gray-50 transition-colors">

                                            <div className="md:col-span-3">
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Product Name</label>
                                                <input type="text" value={product.name} onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="e.g. Bamboo Toothbrush" required />
                                            </div>

                                            <div className="md:col-span-3">
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                                                <input type="text" value={product.category} onChange={(e) => handleProductChange(index, 'category', e.target.value)}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="e.g. Personal Care" required />
                                            </div>

                                            <div className="md:col-span-1">
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                                                <input type="number" min="1" value={product.quantity} onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" required />
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Weight (g)</label>
                                                <input type="number" min="0.1" step="0.1" value={product.weight_grams} onChange={(e) => handleProductChange(index, 'weight_grams', e.target.value)}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent" required />
                                            </div>

                                            <div className="md:col-span-2 flex flex-col space-y-2 pb-2">
                                                <label className="flex items-center space-x-2 cursor-pointer group">
                                                    <input type="checkbox" checked={product.is_sustainable} onChange={(e) => handleProductChange(index, 'is_sustainable', e.target.checked)}
                                                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
                                                    <span className="text-xs font-medium text-gray-700 group-hover:text-green-700 transition">Sustainable</span>
                                                </label>
                                                <label className="flex items-center space-x-2 cursor-pointer group">
                                                    <input type="checkbox" checked={product.is_local} onChange={(e) => handleProductChange(index, 'is_local', e.target.checked)}
                                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                                    <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700 transition">Locally Sourced</span>
                                                </label>
                                            </div>

                                            <div className="md:col-span-1 flex justify-end pb-1">
                                                {products.length > 1 && (
                                                    <button type="button" onClick={() => handleRemoveProduct(index)}
                                                        className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Remove Product">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                    </button>
                                                )}
                                            </div>

                                        </div>
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg flex items-start">
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700 font-medium">{error}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-4 border-t border-gray-100">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-green-600/20"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Generating Report...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                                            Generate Impact Report
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* SECTION 2 — Impact Report Output */}
                    {report && (
                        <div id="report-output" className="space-y-6">
                            <h2 className="text-xl font-heading font-semibold flex items-center pt-4">
                                <span className="bg-green-100 text-green-700 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">2</span>
                                Generated Impact Analysis
                            </h2>

                            {/* Impact Statement Callout */}
                            <div className="bg-green-50 border-l-4 border-green-600 p-8 rounded-r-xl shadow-md relative overflow-hidden">
                                <div className="absolute top-0 right-0 -mr-6 -mt-6 opacity-5">
                                    <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor" className="text-green-800">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                                    </svg>
                                </div>
                                <div className="relative z-10 flex gap-6 items-start">
                                    <div className="hidden sm:block flex-shrink-0 bg-white p-3 rounded-full shadow-sm text-green-600">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold tracking-widest text-green-700 uppercase mb-3">Custom Impact Statement</h3>
                                        <blockquote className="text-xl font-heading text-gray-800 leading-relaxed italic pr-4">
                                            "{report.impact_statement}"
                                        </blockquote>
                                        <p className="mt-4 text-sm font-medium text-gray-500">
                                            Generated on {formatDate(report.created_at)} for Order ID: {report.order_id}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Metric Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {/* Plastic Saved */}
                                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 flex items-center hover:shadow-lg transition-shadow">
                                    <div className="bg-green-100 p-4 rounded-full text-green-600 mr-4">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-heading font-black text-gray-900">{report.metrics.plastic_saved_grams}g</p>
                                        <p className="text-sm font-medium text-gray-500 mt-1">Plastic Saved</p>
                                    </div>
                                </div>
                                {/* Carbon Avoided */}
                                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 flex items-center hover:shadow-lg transition-shadow">
                                    <div className="bg-emerald-100 p-4 rounded-full text-emerald-600 mr-4">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-heading font-black text-gray-900">{report.metrics.carbon_avoided_kg}kg</p>
                                        <p className="text-sm font-medium text-gray-500 mt-1">Carbon Avoided</p>
                                    </div>
                                </div>
                                {/* Local Sourcing */}
                                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 flex items-center hover:shadow-lg transition-shadow">
                                    <div className="bg-blue-100 p-4 rounded-full text-blue-600 mr-4">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                    </div>
                                    <div className="w-full">
                                        <div className="flex justify-between items-end mb-1">
                                            <p className="text-3xl font-heading font-black text-gray-900">{report.metrics.local_sourcing_percent}%</p>
                                        </div>
                                        <p className="text-sm font-medium text-gray-500 mt-1">Local Sourcing</p>
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${report.metrics.local_sourcing_percent}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                                {/* Trees Equivalent */}
                                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 flex items-center hover:shadow-lg transition-shadow">
                                    <div className="bg-teal-100 p-4 rounded-full text-teal-600 mr-4">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01"></path></svg>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-heading font-black text-gray-900">{report.metrics.trees_equivalent}</p>
                                        <p className="text-sm font-medium text-gray-500 mt-1">Trees Equivalent</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                                {/* Products Summary Table */}
                                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 lg:col-span-3">
                                    <h3 className="text-lg font-heading font-semibold mb-6 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                        Products in Order
                                    </h3>
                                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Traits</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {report.products.map((item, index) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-center">{item.quantity}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap flex gap-2">
                                                            {item.is_sustainable && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 uppercase border border-green-200">
                                                                    Eco
                                                                </span>
                                                            )}
                                                            {item.is_local && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase border border-blue-200">
                                                                    Local
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Recharts Bar Chart */}
                                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 lg:col-span-2 h-[350px] flex flex-col">
                                    <h3 className="text-lg font-heading font-semibold mb-6 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
                                        Plastic Saved per Product (g)
                                    </h3>
                                    <div className="flex-1 w-full min-h-0">
                                        {chartData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                                                    <Tooltip cursor={{ fill: '#f3f4f6' }} formatter={(value) => [`${value}g`, 'Plastic Saved']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                                    <Bar dataKey="plastic_saved" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                                <svg className="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
                                                <p className="text-sm">No sustainable items</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION 3 — History Table */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                        <h2 className="text-xl font-heading font-semibold mb-6 flex items-center">
                            <span className="bg-gray-100 text-gray-700 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </span>
                            Generation History
                        </h2>

                        {history.length === 0 ? (
                            <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No impact reports generated</h3>
                                <p className="mt-1 text-sm text-gray-500">Your recent reports will appear here.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metrics</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {history.map((record) => (
                                            <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-gray-900">{record.order_id}</div>
                                                    <div className="text-xs text-gray-500">{record.total_quantity} items</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-green-700 font-medium">{record.plastic_saved_grams}g Plastic Saved</div>
                                                    <div className="text-xs text-gray-500 mt-1">{record.carbon_avoided_kg}kg Carbon Avoided</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(record.created_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => handleViewReport(record.order_id)}
                                                        className="text-green-600 hover:text-green-800 hover:bg-green-50 px-4 py-2 rounded-md transition-colors"
                                                    >
                                                        View Report
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </>
    );
}
