import React, { useState } from 'react'
import CatalogPage from './modules/catalog/CatalogPage'
import ProposalsPage from './modules/proposals/ProposalsPage'
import ImpactPage from './modules/impact/ImpactPage'

function App() {
    const [currentModule, setCurrentModule] = useState('proposals')

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="border-b border-white/[0.06]">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-display font-bold text-white tracking-tight">Rayeva AI</h1>
                            <p className="text-xs text-gray-500 font-medium">Sustainable Commerce Platform</p>
                        </div>
                    </div>
                    <nav className="flex gap-2">
                        <button
                            onClick={() => setCurrentModule('catalog')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${currentModule === 'catalog' ? 'bg-primary-500/10 text-primary-400 border-primary-500/20' : 'bg-transparent text-gray-500 border-transparent hover:text-gray-300'}`}
                        >
                            Auto-Categorizer
                        </button>
                        <button
                            onClick={() => setCurrentModule('proposals')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${currentModule === 'proposals' ? 'bg-primary-500/10 text-primary-400 border-primary-500/20' : 'bg-transparent text-gray-500 border-transparent hover:text-gray-300'}`}
                        >
                            Proposal Generator
                        </button>
                        <button
                            onClick={() => setCurrentModule('impact')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${currentModule === 'impact' ? 'bg-primary-500/10 text-primary-400 border-primary-500/20' : 'bg-transparent text-gray-500 border-transparent hover:text-gray-300'}`}
                        >
                            Impact Reports
                        </button>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main>
                {currentModule === 'catalog' && <CatalogPage />}
                {currentModule === 'proposals' && <ProposalsPage />}
                {currentModule === 'impact' && <ImpactPage />}
            </main>

            {/* Footer */}
            <footer className="border-t border-white/[0.06] mt-16">
                <div className="max-w-7xl mx-auto px-6 py-6 text-center text-gray-600 text-sm">
                    © 2026 Rayeva AI Systems — Powering Sustainable Commerce with AI
                </div>
            </footer>
        </div>
    )
}

export default App
