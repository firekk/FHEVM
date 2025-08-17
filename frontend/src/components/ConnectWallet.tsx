import React from 'react'
import { useWeb3 } from '../contexts/Web3Context'

interface ConnectWalletProps {
  children: React.ReactNode
  onConnect?: () => void
}

export const ConnectWallet: React.FC<ConnectWalletProps> = ({ children, onConnect }) => {
  const { isConnected, loading, connectWallet } = useWeb3()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to wallet...</p>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4"></div>
          </div>
          <p className="text-gray-600 mb-4">Please connect your wallet to continue</p>
          <button
            onClick={() => {
              if (onConnect) {
                onConnect()
              } else {
                connectWallet()
              }
            }}
            className="btn-primary"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}