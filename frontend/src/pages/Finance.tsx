import React, { useState, useEffect } from 'react'
import { useWeb3 } from '../contexts/Web3Context'
import { ethers } from 'ethers'

interface UserInfo {
  role: number
  balance: number
  isActive: boolean
  encryptedProfile: string
}

interface Transaction {
  from: string
  to: string
  amount: number
  type: number
  timestamp: number
  encryptedData: string
  isVerified: boolean
}

export const Finance: React.FC = () => {
  const { account, contracts } = useWeb3()
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [balance, setBalance] = useState<string>('0')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [amount, setAmount] = useState<string>('')
  const [recipient, setRecipient] = useState<string>('')
  const [profileData, setProfileData] = useState<string>('')
  const [selectedTransactionType, setSelectedTransactionType] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [systemStats, setSystemStats] = useState<{
    totalUsers: number
    totalTransactions: number
    currentTotalSupply: number
  } | null>(null)

  useEffect(() => {
    loadUserInfo()
    loadTransactions()
    loadSystemStats()
  }, [account, contracts])

  const loadUserInfo = async () => {
    if (!account || !contracts.fheFinance) return
    
    try {
      const info = await contracts.fheFinance.getUserInfo(account)
      setUserInfo({
        role: info.role,
        balance: Number(info.balance),
        isActive: info.isActive,
        encryptedProfile: info.encryptedProfile,
      })
      setBalance(info.balance.toString())
    } catch (error) {
      console.error('Error loading user info:', error)
    }
  }

  const loadTransactions = async () => {
    if (!account || !contracts.fheFinance) return
    
    try {
      const txIds = await contracts.fheFinance.getUserTransactions(account)
      const txs: Transaction[] = []
      
      for (const txId of txIds) {
        const tx = await contracts.fheFinance.getTransactionInfo(txId)
        txs.push({
          from: tx.from,
          to: tx.to,
          amount: Number(tx.amount),
          type: tx.type,
          timestamp: tx.timestamp,
          encryptedData: tx.encryptedData,
          isVerified: tx.isVerified,
        })
      }
      
      setTransactions(txs)
    } catch (error) {
      console.error('Error loading transactions:', error)
    }
  }

  const loadSystemStats = async () => {
    if (!contracts.fheFinance) return
    
    try {
      const stats = await contracts.fheFinance.getSystemStats()
      setSystemStats({
        totalUsers: Number(stats.totalUsers),
        totalTransactions: Number(stats.totalTransactions),
        currentTotalSupply: Number(stats.currentTotalSupply),
      })
    } catch (error) {
      console.error('Error loading system stats:', error)
    }
  }

  const handleDeposit = async () => {
    if (!contracts.fheFinance || !account || !amount) return
    
    try {
      setIsSubmitting(true)
      const amountValue = ethers.parseEther(amount)
      const encryptedData = ethers.toUtf8Bytes('Encrypted deposit data')
      const encryptedBytes32 = ethers.id(encryptedData)
      
      const tx = await contracts.fheFinance.deposit(amountValue, encryptedBytes32)
      await tx.wait()
      
      setAmount('')
      await loadUserInfo()
      await loadTransactions()
      await loadSystemStats()
    } catch (error) {
      console.error('Error processing deposit:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleWithdraw = async () => {
    if (!contracts.fheFinance || !account || !amount) return
    
    try {
      setIsSubmitting(true)
      const amountValue = ethers.parseEther(amount)
      const encryptedData = ethers.toUtf8Bytes('Encrypted withdrawal data')
      const encryptedBytes32 = ethers.id(encryptedData)
      
      const tx = await contracts.fheFinance.withdraw(amountValue, encryptedBytes32)
      await tx.wait()
      
      setAmount('')
      await loadUserInfo()
      await loadTransactions()
      await loadSystemStats()
    } catch (error) {
      console.error('Error processing withdrawal:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTransfer = async () => {
    if (!contracts.fheFinance || !account || !amount || !recipient) return
    
    try {
      setIsSubmitting(true)
      const amountValue = ethers.parseEther(amount)
      const encryptedData = ethers.toUtf8Bytes('Encrypted transfer data')
      const encryptedBytes32 = ethers.id(encryptedData)
      
      const tx = await contracts.fheFinance.transfer(recipient, amountValue, encryptedBytes32)
      await tx.wait()
      
      setAmount('')
      setRecipient('')
      await loadUserInfo()
      await loadTransactions()
      await loadSystemStats()
    } catch (error) {
      console.error('Error processing transfer:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleProfileUpdate = async () => {
    if (!contracts.fheFinance || !account || !profileData) return
    
    try {
      setIsSubmitting(true)
      const encryptedData = ethers.toUtf8Bytes(profileData)
      const encryptedBytes32 = ethers.id(encryptedData)
      
      const tx = await contracts.fheFinance.updateEncryptedProfile(encryptedBytes32)
      await tx.wait()
      
      setProfileData('')
      await loadUserInfo()
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTransactionTypeText = (type: number) => {
    const types = ['Deposit', 'Withdrawal', 'Transfer']
    return types[type] || 'Unknown'
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const getRoleText = (role: number) => {
    const roles = ['Admin', 'User']
    return roles[role] || 'Unknown'
  }

  const getRoleColor = (role: number) => {
    return role === 0 ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">💰 Private Finance System</h1>
              <p className="text-gray-600">Experience encrypted financial transactions with FHE</p>
            </div>
          </div>
        </div>

        {/* System Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 mb-1">Total Users</p>
                <p className="text-2xl font-bold text-blue-900">{systemStats?.totalUsers || 0}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 mb-1">Total Transactions</p>
                <p className="text-2xl font-bold text-green-900">{systemStats?.totalTransactions || 0}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 mb-1">Total Supply</p>
                <p className="text-2xl font-bold text-purple-900">{(systemStats?.currentTotalSupply / 1e18 || 0).toFixed(2)} ETH</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 mb-1">Your Transactions</p>
                <p className="text-2xl font-bold text-orange-900">{transactions.length}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Account Information */}
        {userInfo && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Account Overview
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/70 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-600">Address</span>
                  <span className="font-mono text-sm text-gray-900">{account}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white/70 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-600">Role</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(userInfo.role)}`}>
                    {getRoleText(userInfo.role)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white/70 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${userInfo.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {userInfo.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                  <div className="text-white/80 text-sm mb-1">Encrypted Balance</div>
                  <div className="text-white text-3xl font-bold">{balance} ETH</div>
                  <div className="text-white/60 text-xs mt-1">🔒 Data is FHE-encrypted</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Encrypted Profile
              </h3>
              
              <div className="bg-white/70 rounded-lg p-4 mb-4 border border-purple-200">
                <p className="text-sm text-gray-600 mb-2">Profile Hash:</p>
                <p className="font-mono text-xs text-gray-800 break-all">
                  {userInfo.encryptedProfile || 'No encrypted profile data'}
                </p>
              </div>
              
              <div className="space-y-3">
                <input
                  type="text"
                  value={profileData}
                  onChange={(e) => setProfileData(e.target.value)}
                  placeholder="Enter profile data to encrypt"
                  className="input-field"
                />
                <button
                  onClick={handleProfileUpdate}
                  disabled={isSubmitting || !profileData}
                  className="btn-primary disabled:opacity-50 w-full"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <div className="spinner mr-2"></div>
                      Encrypting Profile...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Update Encrypted Profile
                    </span>
                  )}
                </button>
                <p className="text-sm text-gray-600 text-center">
                  Your profile data will be encrypted using FHE technology
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              Transaction Actions
            </h3>
            
            <div className="space-y-6">
              {/* Deposit */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">💵 Deposit Funds</h4>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-3">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount in ETH"
                    step="0.001"
                    className="input-field"
                  />
                  <button
                    onClick={handleDeposit}
                    disabled={isSubmitting || !amount}
                    className="btn-success disabled:opacity-50 w-full"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <div className="spinner mr-2"></div>
                        Depositing...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                        Deposit (FHE Encrypted)
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Withdraw */}
              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-5 border border-red-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">💸 Withdraw Funds</h4>
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-3">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount in ETH"
                    step="0.001"
                    className="input-field"
                  />
                  <button
                    onClick={handleWithdraw}
                    disabled={isSubmitting || !amount}
                    className="btn-danger disabled:opacity-50 w-full"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <div className="spinner mr-2"></div>
                        Withdrawing...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                        Withdraw (FHE Encrypted)
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Transfer */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">🔄 Private Transfer</h4>
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Recipient address"
                    className="input-field"
                  />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount in ETH"
                    step="0.001"
                    className="input-field"
                  />
                  <button
                    onClick={handleTransfer}
                    disabled={isSubmitting || !amount || !recipient}
                    className="btn-primary disabled:opacity-50 w-full"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <div className="spinner mr-2"></div>
                        Transferring...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Private Transfer (FHE Encrypted)
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Transaction History
            </h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-600">No transactions yet</p>
                  <p className="text-sm text-gray-500 mt-1">Your encrypted transactions will appear here</p>
                </div>
              ) : (
                transactions.map((tx, index) => (
                  <div key={index} className="bg-gradient-to-r from-gray-50 to-slate-100 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-900">{getTransactionTypeText(tx.type)}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          tx.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {tx.isVerified ? '✅ Verified' : '⏳ Pending'}
                        </span>
                        <span className="text-xs text-gray-500">{tx.amount} ETH</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">From:</span>
                        <span className="ml-1 font-mono text-xs text-gray-900">{formatAddress(tx.from)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">To:</span>
                        <span className="ml-1 font-mono text-xs text-gray-900">{formatAddress(tx.to)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">{formatTime(tx.timestamp)}</span>
                        <div className="flex items-center space-x-1">
                          <svg className="w-3 h-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className="text-purple-600">FHE Encrypted</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* FHE Features */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-200">
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium mb-4">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              FHE Technology Features
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Why Choose FHE Finance?</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Experience the perfect balance between privacy and transparency in decentralized finance
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">🔒 Encrypted Balances</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                All balance information is encrypted using FHE technology, ensuring complete privacy while maintaining on-chain verifiability.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">🔐 Private Transactions</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Transaction details remain encrypted while being mathematically verifiable on the blockchain, ensuring both privacy and transparency.
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">👥 Role-Based Access</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Different user roles with appropriate access controls ensure that only authorized parties can access specific encrypted information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}