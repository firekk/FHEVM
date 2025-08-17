import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Web3Provider } from './contexts/Web3Context'
import { Header } from './components/Header'
import { MobileNavigation } from './components/MobileNavigation'
import { Home } from './pages/Home'
import { Voting } from './pages/Voting'
import { Finance } from './pages/Finance'
import { ConnectWallet } from './components/ConnectWallet'

function App() {
  return (
    <Web3Provider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="container mx-auto px-4 py-4 md:py-8">
            <ConnectWallet>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/voting" element={<Voting />} />
                <Route path="/finance" element={<Finance />} />
              </Routes>
            </ConnectWallet>
          </main>
          <MobileNavigation />
        </div>
      </Router>
    </Web3Provider>
  )
}

export default App