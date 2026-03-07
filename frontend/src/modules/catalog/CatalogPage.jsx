import { useState, useEffect } from 'react'
import api from '../../api/client'

// ── Icons ────────────────────────────────────────────────────────
const SparklesIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
)

const LeafIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-1.5 0-6-1.5-6-8 0-4 3-7 6-7s6 3 6 7c0 6.5-4.5 8-6 8z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V11" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15c1-1 2-2 3-3" />
    </svg>
)

const ClockIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)

// ── Loading Skeleton ─────────────────────────────────────────────
function LoadingSkeleton() {
    return (
        <div className="glass-card p-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-5 h-5 rounded-full bg-primary-500/30 animate-pulse-soft" />
                <div className="h-4 w-48 rounded-lg shimmer" />
            </div>
            <div className="space-y-4">
                <div className="h-12 rounded-xl shimmer" />
                <div className="flex gap-2 flex-wrap">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-8 w-24 rounded-full shimmer" />
                    ))}
                </div>
                <div className="flex gap-2 flex-wrap">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-7 w-28 rounded-full shimmer" />
                    ))}
                </div>
                <div className="h-4 w-full rounded-lg shimmer" />
            </div>
        </div>
    )
}

// ── Confidence Bar ───────────────────────────────────────────────
function ConfidenceBar({ score }) {
    const percentage = Math.round(score * 100)
    const getColor = () => {
        if (score >= 0.85) return 'from-primary-500 to-accent-500'
        if (score >= 0.7) return 'from-yellow-500 to-primary-500'
        return 'from-orange-500 to-yellow-500'
    }
    const getLabel = () => {
        if (score >= 0.85) return 'High Confidence'
        if (score >= 0.7) return 'Good Confidence'
        return 'Moderate Confidence'
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{getLabel()}</span>
                <span className="font-mono font-semibold text-white">{percentage}%</span>
            </div>
            <div className="h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full bg-gradient-to-r ${getColor()} transition-all duration-1000 ease-out`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    )
}

// ── Results Card ─────────────────────────────────────────────────
function ResultsCard({ result }) {
    if (!result) return null

    return (
        <div className="glass-card p-8 animate-slide-up space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-display font-bold text-white mb-1">
                        {result.product_name}
                    </h3>
                    <p className="text-xs text-gray-500">
                        Categorized • {new Date(result.created_at).toLocaleString()}
                    </p>
                </div>
                <div className="badge-category">
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                    </svg>
                    {result.primary_category}
                </div>
            </div>

            {/* Sub-category */}
            {result.sub_category && (
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Sub-category</span>
                    <span className="text-sm text-gray-300 font-medium bg-white/[0.04] px-3 py-1 rounded-lg">
                        {result.sub_category}
                    </span>
                </div>
            )}

            {/* SEO Tags */}
            <div>
                <h4 className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" />
                    </svg>
                    SEO Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                    {result.seo_tags.map((tag, i) => (
                        <span key={i} className="badge-tag">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            {/* Sustainability Filters */}
            {result.sustainability_filters.length > 0 && (
                <div>
                    <h4 className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3 flex items-center gap-2">
                        <LeafIcon />
                        Sustainability Filters
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {result.sustainability_filters.map((filter, i) => (
                            <span key={i} className="badge-sustainability">
                                <LeafIcon />
                                <span className="ml-1.5">{filter}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Confidence Score */}
            <div className="pt-2 border-t border-white/[0.06]">
                <ConfidenceBar score={result.confidence_score} />
            </div>
        </div>
    )
}

// ── History Table ────────────────────────────────────────────────
function HistoryTable({ history }) {
    if (!history || history.length === 0) {
        return (
            <div className="glass-card p-8 text-center">
                <div className="text-gray-500 space-y-2">
                    <ClockIcon />
                    <p className="text-sm">No categorization history yet. Try categorizing your first product!</p>
                </div>
            </div>
        )
    }

    return (
        <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/[0.06]">
                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tags</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Confidence</th>
                            <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                        {history.map((item) => (
                            <tr key={item.id} className="hover:bg-white/[0.02] transition-colors duration-150">
                                <td className="px-6 py-4">
                                    <span className="text-sm font-medium text-white">{item.product_name}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs px-2.5 py-1 rounded-md bg-primary-500/10 text-primary-400 font-medium">
                                        {item.primary_category}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1 max-w-xs">
                                        {item.seo_tags.slice(0, 3).map((tag, i) => (
                                            <span key={i} className="text-xs px-2 py-0.5 rounded bg-white/[0.04] text-gray-400">
                                                {tag}
                                            </span>
                                        ))}
                                        {item.seo_tags.length > 3 && (
                                            <span className="text-xs text-gray-600">+{item.seo_tags.length - 3}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-mono text-sm text-gray-300">{Math.round(item.confidence_score * 100)}%</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ── Main Catalog Page ────────────────────────────────────────────
export default function CatalogPage() {
    const [productName, setProductName] = useState('')
    const [description, setDescription] = useState('')
    const [result, setResult] = useState(null)
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [historyLoading, setHistoryLoading] = useState(true)

    // Fetch history on mount
    useEffect(() => {
        fetchHistory()
    }, [])

    const fetchHistory = async () => {
        try {
            const res = await api.get('/catalog/history')
            setHistory(res.data)
        } catch (err) {
            console.error('Failed to fetch history:', err)
        } finally {
            setHistoryLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)
        setResult(null)

        try {
            const res = await api.post('/catalog/categorize', {
                product_name: productName,
                description: description,
            })
            setResult(res.data)
            setProductName('')
            setDescription('')
            // Refresh history
            fetchHistory()
        } catch (err) {
            setError(err.message || 'Failed to categorize product. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const isFormValid = productName.length >= 3 && description.length >= 20

    return (
        <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
            {/* Hero Section */}
            <div className="text-center space-y-4 animate-fade-in">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium mb-4">
                    <SparklesIcon />
                    AI-Powered Categorization
                </div>
                <h2 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight">
                    Auto-Category &{' '}
                    <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                        Tag Generator
                    </span>
                </h2>
                <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                    Enter your product details and let AI instantly categorize it with SEO tags,
                    sustainability filters, and confidence scoring.
                </p>
            </div>

            {/* Form + Results Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Form */}
                <div className="glass-card p-8 animate-slide-up">
                    <h3 className="text-lg font-display font-semibold text-white mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                        Product Details
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Product Name */}
                        <div className="space-y-2">
                            <label htmlFor="product-name" className="block text-sm font-medium text-gray-400">
                                Product Name <span className="text-primary-400">*</span>
                            </label>
                            <input
                                id="product-name"
                                type="text"
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                placeholder="e.g., Bamboo Toothbrush"
                                className="input-field"
                                minLength={3}
                                maxLength={255}
                                required
                            />
                            <p className="text-xs text-gray-600">
                                {productName.length}/255 characters (min 3)
                            </p>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label htmlFor="product-description" className="block text-sm font-medium text-gray-400">
                                Product Description <span className="text-primary-400">*</span>
                            </label>
                            <textarea
                                id="product-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the product in detail — materials, features, sustainability aspects, target audience..."
                                className="input-field min-h-[140px] resize-y"
                                minLength={20}
                                maxLength={1000}
                                required
                                rows={5}
                            />
                            <p className="text-xs text-gray-600">
                                {description.length}/1000 characters (min 20)
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 animate-fade-in">
                                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                </svg>
                                <p className="text-sm text-red-300">{error}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !isFormValid}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Analyzing with AI...
                                </>
                            ) : (
                                <>
                                    <SparklesIcon />
                                    Generate Categories & Tags
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Results / Loading / Empty State */}
                <div>
                    {loading ? (
                        <LoadingSkeleton />
                    ) : result ? (
                        <ResultsCard result={result} />
                    ) : (
                        <div className="glass-card p-8 flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mb-2">
                                <SparklesIcon />
                            </div>
                            <h3 className="text-lg font-display font-semibold text-white">Ready to Categorize</h3>
                            <p className="text-sm text-gray-500 max-w-xs">
                                Fill in the product details and click Generate to get AI-powered categorization, SEO tags, and sustainability analysis.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* History Section */}
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-3">
                    <ClockIcon />
                    <h3 className="text-xl font-display font-bold text-white">Recent History</h3>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-white/[0.06] text-gray-400 font-medium">
                        {history.length} entries
                    </span>
                </div>

                {historyLoading ? (
                    <div className="glass-card p-8">
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-12 rounded-xl shimmer" />
                            ))}
                        </div>
                    </div>
                ) : (
                    <HistoryTable history={history} />
                )}
            </div>
        </div>
    )
}
