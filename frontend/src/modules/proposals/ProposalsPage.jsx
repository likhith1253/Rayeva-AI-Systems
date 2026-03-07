import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ProposalsPage() {
    const [clientName, setClientName] = useState('');
    const [industry, setIndustry] = useState('Technology');
    const [budget, setBudget] = useState('');
    const [headcount, setHeadcount] = useState('');

    // Sustainability Priorities
    const priorityOptions = [
        'Plastic Reduction',
        'Carbon Footprint',
        'Employee Wellness',
        'Local Sourcing',
        'Waste Reduction'
    ];
    const [priorities, setPriorities] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [proposal, setProposal] = useState(null);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/proposals/history');
            if (!response.ok) throw new Error('Failed to fetch history');
            const data = await response.json();
            setHistory(data);
        } catch (err) {
            console.error(err);
            // Don't show global error for history fetch failure
        }
    };

    const handlePriorityChange = (priority) => {
        if (priorities.includes(priority)) {
            setPriorities(priorities.filter(p => p !== priority));
        } else {
            if (priorities.length < 5) {
                setPriorities([...priorities, priority]);
            }
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!clientName || !budget || !headcount || priorities.length === 0) {
            setError('Please fill all required fields and select at least one priority.');
            return;
        }

        setLoading(true);
        setError(null);
        setProposal(null);

        try {
            const response = await fetch('http://localhost:8000/api/proposals/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    client_name: clientName,
                    industry: industry,
                    budget: parseInt(budget, 10),
                    headcount: parseInt(headcount, 10),
                    sustainability_priorities: priorities
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to generate proposal');
            }

            const data = await response.json();
            setProposal(data);
            fetchHistory(); // Refresh history

            // Scroll to proposal output
            setTimeout(() => {
                document.getElementById('proposal-output')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleViewProposal = async (id) => {
        setLoading(true);
        setError(null);
        setProposal(null);

        try {
            const response = await fetch(`http://localhost:8000/api/proposals/${id}`);
            if (!response.ok) throw new Error('Failed to fetch proposal details');
            const data = await response.json();
            setProposal(data);

            // Scroll to proposal output
            setTimeout(() => {
                document.getElementById('proposal-output')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        if (!proposal) return;

        try {
            const response = await fetch(`http://localhost:8000/api/proposals/${proposal.id}/export`, {
                method: 'POST'
            });

            if (!response.ok) throw new Error('Failed to export proposal');

            const markdownData = await response.text();

            // Trigger download
            const blob = new Blob([markdownData], { type: 'text/markdown' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${proposal.client_name.replace(/\s+/g, '_')}_Proposal.md`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (err) {
            setError(err.message);
        }
    };

    // Prepare chart data
    const chartData = proposal ? proposal.proposed_products.reduce((acc, current) => {
        const existingCategory = acc.find(item => item.category === current.category);
        if (existingCategory) {
            existingCategory.spend += current.total_price;
        } else {
            acc.push({ category: current.category, spend: current.total_price });
        }
        return acc;
    }, []) : [];

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

                    <div className="mb-8">
                        <h1 className="text-3xl font-heading font-bold text-gray-900">AI B2B Proposal Generator</h1>
                        <p className="mt-2 text-gray-600">Generate structured, budget-conscious sustainability proposals tailored to client profiles.</p>
                    </div>

                    {/* SECTION 1 — Input Form */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                        <h2 className="text-xl font-heading font-semibold mb-6 flex items-center">
                            <span className="bg-green-100 text-green-700 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">1</span>
                            Client Details
                        </h2>

                        <form onSubmit={handleGenerate} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Client Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
                                        placeholder="e.g. GreenTech Solutions"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Industry <span className="text-red-500">*</span></label>
                                    <select
                                        value={industry}
                                        onChange={(e) => setIndustry(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow bg-white"
                                    >
                                        <option value="Technology">Technology</option>
                                        <option value="Manufacturing">Manufacturing</option>
                                        <option value="Healthcare">Healthcare</option>
                                        <option value="Education">Education</option>
                                        <option value="Finance">Finance</option>
                                        <option value="Retail">Retail</option>
                                        <option value="Hospitality">Hospitality</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Budget (INR) <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 font-medium">₹</span>
                                        </div>
                                        <input
                                            type="number"
                                            min="5000"
                                            value={budget}
                                            onChange={(e) => setBudget(e.target.value)}
                                            required
                                            className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
                                            placeholder="e.g. 50000"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Headcount <span className="text-red-500">*</span></label>
                                    <input
                                        type="number"
                                        min="5"
                                        value={headcount}
                                        onChange={(e) => setHeadcount(e.target.value)}
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow"
                                        placeholder="e.g. 150"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Sustainability Priorities <span className="text-red-500">*</span> (Select up to 5)</label>
                                <div className="flex flex-wrap gap-3">
                                    {priorityOptions.map(priority => (
                                        <label
                                            key={priority}
                                            className={`cursor-pointer inline-flex items-center px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${priorities.includes(priority)
                                                    ? 'bg-green-50 border-green-200 text-green-700'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={priorities.includes(priority)}
                                                onChange={() => handlePriorityChange(priority)}
                                            />
                                            {priorities.includes(priority) && (
                                                <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                            {priority}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700 font-medium">{error}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-4 border-t border-gray-100">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed min-w-[200px]"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Generating Proposal...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                            </svg>
                                            Generate Proposal
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* SECTION 2 — Proposal Output */}
                    {proposal && (
                        <div id="proposal-output" className="space-y-6">
                            <h2 className="text-xl font-heading font-semibold flex items-center pt-4">
                                <span className="bg-green-100 text-green-700 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">2</span>
                                Proposal Details
                            </h2>

                            {proposal.budget_adjusted && (
                                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-amber-700 font-medium">Automatic Adjustment Applied</p>
                                        <p className="text-sm text-amber-600 mt-1">AI-suggested quantities were scaled down slightly to remain within your strict budget limit of {formatCurrency(proposal.budget)}.</p>
                                    </div>
                                </div>
                            )}

                            {/* Header Card */}
                            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium mb-1">Client Name</p>
                                    <p className="text-lg font-heading font-bold text-gray-900">{proposal.client_name}</p>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-2">
                                        {proposal.industry}
                                    </span>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500 font-medium mb-1">Total Budget</p>
                                    <p className="text-lg font-heading font-bold text-gray-900">{formatCurrency(proposal.budget)}</p>
                                    <p className="text-sm text-gray-600 mt-1">Total Cost: <span className="font-semibold text-green-600">{formatCurrency(proposal.total_cost)}</span></p>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500 font-medium mb-1">Cost Per Employee</p>
                                    <p className="text-lg font-heading font-bold text-gray-900">{formatCurrency(proposal.cost_per_employee)}</p>
                                    <p className="text-sm text-gray-600 mt-1">Based on {proposal.headcount} headcount</p>
                                </div>

                                <div className="flex flex-col justify-center">
                                    <div className="flex justify-between items-end mb-2">
                                        <p className="text-sm font-medium text-gray-700">Budget Utilized</p>
                                        <p className="text-sm font-bold text-green-600">{proposal.budget_utilization_percent.toFixed(1)}%</p>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div className="bg-green-600 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${proposal.budget_utilization_percent}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Impact Summary Callout */}
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm p-8 border border-green-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10">
                                    <svg width="150" height="150" viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
                                        <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1.05-5.69l5.66-6.66a1 1 0 00-1.52-1.3l-5.02 5.9L7.9 12a1 1 0 00-1.4 1.42l3.45 3.45a1 1 0 001.05-1.2l-.05-.06z" />
                                    </svg>
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-sm font-bold tracking-widest text-green-600 uppercase mb-4">Executive Impact Summary</h3>
                                    <blockquote className="text-lg sm:text-xl font-heading text-gray-800 leading-relaxed italic">
                                        "{proposal.impact_summary}"
                                    </blockquote>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Budget Breakdown Chart */}
                                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 lg:col-span-1 h-[400px] flex flex-col">
                                    <h3 className="text-lg font-heading font-semibold mb-6">Spend by Category</h3>
                                    <div className="flex-1 w-full relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                                <XAxis
                                                    dataKey="category"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                                    angle={-45}
                                                    textAnchor="end"
                                                    height={60}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                                    tickFormatter={(value) => `₹${value / 1000}k`}
                                                />
                                                <Tooltip
                                                    cursor={{ fill: '#f3f4f6' }}
                                                    formatter={(value) => formatCurrency(value)}
                                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                                />
                                                <Bar dataKey="spend" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Products Table */}
                                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 lg:col-span-2 flex flex-col h-[400px]">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-heading font-semibold">Recommended Products</h3>
                                        <button
                                            onClick={handleExport}
                                            className="text-green-600 bg-green-50 hover:bg-green-100 font-medium px-4 py-2 rounded-lg transition-colors flex items-center text-sm border border-green-200"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                            </svg>
                                            Export as Markdown
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-auto border border-gray-200 rounded-lg pr-2 max-h-full">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50 sticky top-0 z-10 w-full shadow-sm">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty/Price</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Benefit</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {proposal.proposed_products.map((item, index) => (
                                                    <tr key={index} className="hover:bg-gray-50 transition-colors group">
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-start">
                                                                <div className="flex-shrink-0 mt-1 mr-3">
                                                                    <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5 ring-4 ring-green-100 group-hover:ring-green-200 transition-all"></div>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                                                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 uppercase tracking-wider">
                                                                        {item.category}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">{item.quantity} units</div>
                                                            <div className="text-sm text-gray-500">@ {formatCurrency(item.unit_price)}</div>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-semibold text-gray-900">{formatCurrency(item.total_price)}</div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="text-sm text-gray-700">{item.sustainability_benefit}</div>
                                                            <div className="text-xs text-gray-500 italic mt-1">{item.why_recommended}</div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
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
                            Recent Proposals
                        </h2>

                        {history.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No proposals yet</h3>
                                <p className="mt-1 text-sm text-gray-500">Get started by creating a new proposal above.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client / Industry</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget / Headcount</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {history.map((record) => (
                                            <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-gray-900">{record.client_name}</div>
                                                    <div className="text-sm text-gray-500">{record.industry}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{formatCurrency(record.budget)}</div>
                                                    <div className="text-sm text-gray-500">{record.headcount} employees</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(record.created_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => handleViewProposal(record.id)}
                                                        className="text-green-600 hover:text-green-800 font-medium px-3 py-1.5 rounded-md hover:bg-green-50 transition-colors inline-block"
                                                        disabled={loading}
                                                    >
                                                        View
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
