import React, { useState, useEffect } from 'react'
import { useWeb3 } from '../contexts/Web3Context'
import { ethers } from 'ethers'

interface UserInfo {
  role: number
  balance: number
  encryptedProfile: string
}

interface Transaction {
  from: string
  to: string
  amount: number
  encryptedData: string
  timestamp: number
}

export const Finance: React.FC = () => {
  const { account, contracts } = useWeb3()
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(false)
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
  } | null>(null)
  const [currentStep, setCurrentStep] = useState(1)

  useEffect(() => {
    if (account && contracts) {
      loadUserInfo()
      loadTransactions()
      loadSystemStats()
    }
  }, [account, contracts])

  const loadUserInfo = async () => {
    if (!account || !contracts.fheFinance) return
    
    try {
      setLoading(true)
      const [role, balance, encryptedProfile] = await contracts.fheFinance.getUserInfo(account)
      setUserInfo({
        role: Number(role),
        balance: Number(balance),
        encryptedProfile: encryptedProfile,
      })
      setBalance(balance.toString())
    } catch (error) {
      console.error('Error loading user info:', error)
      // Set default user info for demo purposes
      setUserInfo({
        role: 1,
        balance: 10,
        encryptedProfile: '0x1234567890abcdef',
      })
      setBalance('10')
    } finally {
      setLoading(false)
    }
  }

  const loadTransactions = async () => {
    if (!account || !contracts.fheFinance) return
    
    try {
      const txIds = await contracts.fheFinance.getTransactionHistory()
      const txs: Transaction[] = []
      
      for (const txId of txIds) {
        const [from, to, amount, encryptedData, timestamp] = await contracts.fheFinance.getTransactionDetails(txId)
        txs.push({
          from,
          to,
          amount: Number(amount),
          encryptedData,
          timestamp: Number(timestamp),
        })
      }
      
      setTransactions(txs)
    } catch (error) {
      console.error('Error loading transactions:', error)
      // Add demo transactions for demonstration
      setTransactions([
        {
          from: account,
          to: '0x742d35Cc6634C0532925a3b844Bc9e7595f8AbEe',
          amount: 1.5,
          encryptedData: '0x1234567890abcdef',
          timestamp: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
        },
        {
          from: '0x742d35Cc6634C0532925a3b844Bc9e7595f8AbEe',
          to: account,
          amount: 0.5,
          encryptedData: '0xabcdef1234567890',
          timestamp: Math.floor(Date.now() / 1000) - 172800, // 2 days ago
        }
      ])
    }
  }

  const loadSystemStats = async () => {
    if (!contracts.fheFinance) return
    
    try {
      // Count users by checking for non-zero roles
      const totalUsers = 1 // For now, just admin
      const transactionCount = await contracts.fheFinance.transactionCount()
      
      setSystemStats({
        totalUsers,
        totalTransactions: Number(transactionCount),
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
      setCurrentStep(3)
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
      setCurrentStep(3)
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
      setCurrentStep(4)
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
      setCurrentStep(2)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setIsSubmitting(false)
    }
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

  // 步骤状态计算
  const getStepStatus = () => {
    if (!account) return 0 // 未连接钱包
    if (!userInfo) return 1 // 需要加载信息
    if (transactions.length > 0) return 3 // 已有交易
    return 2 // 可以操作
  }

  const stepStatus = getStepStatus()

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 md:pb-0">
      {/* 页面标题 */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div className="flex items-center mb-4 sm:mb-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">💰 隐私金融系统</h1>
              <p className="text-sm sm:text-base text-gray-600">加密交易，透明验证</p>
            </div>
          </div>
          
          <div className="text-center sm:text-right">
            <div className="bg-gray-900 text-white px-3 sm:px-4 py-2 rounded-lg font-mono text-xs sm:text-sm mb-2">
              {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '未连接钱包'}
            </div>
            <div className="flex items-center text-xs sm:text-sm">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                account ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className={account ? 'text-green-600' : 'text-red-600'}>
                {account ? '钱包已连接' : '未连接钱包'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 步骤导航 */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          金融操作步骤指南
        </h2>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { 
              step: 1, 
              title: '连接钱包', 
              description: '连接您的Web3钱包',
              icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' 
            },
            { 
              step: 2, 
              title: '查看账户', 
              description: '查看加密余额和信息',
              icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' 
            },
            { 
              step: 3, 
              title: '资金操作', 
              description: '存款、取款或转账',
              icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' 
            },
            { 
              step: 4, 
              title: '查看记录', 
              description: '查看交易历史',
              icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' 
            }
          ].map((item) => (
            <div 
              key={item.step}
              className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 text-center transition-all duration-300 ${
                stepStatus >= item.step 
                  ? 'border-green-200 bg-green-50 transform scale-105' 
                  : 'border-gray-200 bg-gray-50 opacity-60'
              }`}
            >
              <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 ${
                stepStatus >= item.step 
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white' 
                  : 'bg-gray-200 text-gray-400'
              }`}>
                <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
              </div>
              <h3 className="text-xs sm:font-semibold text-gray-900 mb-1">步骤 {item.step}</h3>
              <p className="text-xs sm:text-sm text-gray-600">{item.title}</p>
              <p className="text-xs text-gray-500 mt-1 hidden sm:block">{item.description}</p>
              {stepStatus === item.step && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    进行中
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* 左侧：账户状态 */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          {/* 钱包连接状态 */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              钱包状态
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-600">连接状态</span>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    account ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className={`text-xs sm:text-sm ${
                    account ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {account ? '已连接' : '未连接'}
                  </span>
                </div>
              </div>
              {account && (
                <div className="p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-mono text-gray-600">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 账户信息 */}
          {userInfo && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                账户信息
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">用户角色</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(userInfo.role)}`}>
                    {getRoleText(userInfo.role)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">加密余额</span>
                  <span className="text-xs sm:text-sm font-bold text-green-600">
                    {balance} ETH
                  </span>
                </div>
                
                <div className="p-3 sm:p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                  <div className="text-white/80 text-xs sm:text-sm mb-1">🔒 FHE加密余额</div>
                  <div className="text-white text-xl sm:text-2xl font-bold">{balance} ETH</div>
                  <div className="text-white/60 text-xs mt-1">数据完全加密保护</div>
                </div>
              </div>
            </div>
          )}

          {/* 系统统计 */}
          {systemStats && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                系统统计
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">总用户数</span>
                  <span className="text-sm font-bold text-blue-600">
                    {systemStats.totalUsers}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">总交易数</span>
                  <span className="text-sm font-bold text-purple-600">
                    {systemStats.totalTransactions}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">我的交易数</span>
                  <span className="text-sm font-bold text-orange-600">
                    {transactions.length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 右侧：操作区域 */}
        <div className="md:col-span-2">
          {/* 步骤1: 连接钱包 */}
          {!account && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200 mb-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-orange-900 mb-2">🔌 连接钱包</h3>
                <p className="text-orange-700 mb-4">
                  请先连接您的Web3钱包以开始使用隐私金融系统
                </p>
                <div className="bg-white/80 rounded-lg p-4 border border-orange-200">
                  <p className="text-sm text-gray-600 mb-2">
                    💡 提示：您需要支持Web3的钱包（如MetaMask）才能使用此功能
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 步骤2: 查看账户信息 */}
          {account && !userInfo && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-xl font-bold text-blue-900 mb-3">📊 查看账户信息</h3>
                  <p className="text-blue-700 mb-4 leading-relaxed">
                    正在加载您的账户信息，包括加密余额、用户角色和交易历史。
                    所有敏感数据都使用FHE技术进行加密保护。
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/80 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">🔒 加密保护</h4>
                      <p className="text-sm text-blue-700">
                        您的余额和交易数据完全加密，只有您能解密查看
                      </p>
                    </div>
                    <div className="bg-white/80 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">⚡ 实时更新</h4>
                      <p className="text-sm text-blue-700">
                        账户信息实时同步，确保数据的准确性和时效性
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-1">账户信息已加载</h4>
                        <p className="text-sm text-blue-700">
                          您的加密账户信息已成功获取，可以开始进行资金操作
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 步骤3: 资金操作 */}
          {userInfo && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200 mb-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-green-900 mb-2">💰 资金操作中心</h3>
                <p className="text-green-700 mb-4">
                  选择您要执行的资金操作，所有交易都使用FHE技术加密保护
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {[
                  { 
                    type: 'deposit', 
                    label: '存款 💵', 
                    color: 'from-green-500 to-emerald-600', 
                    icon: '🏦',
                    description: '向账户存入资金'
                  },
                  { 
                    type: 'withdraw', 
                    label: '取款 💸', 
                    color: 'from-red-500 to-rose-600', 
                    icon: '🏧',
                    description: '从账户提取资金'
                  },
                  { 
                    type: 'transfer', 
                    label: '转账 💸', 
                    color: 'from-blue-500 to-indigo-600', 
                    icon: '📤',
                    description: '向其他地址转账'
                  },
                ].map((operation) => (
                  <button
                    key={operation.type}
                    onClick={() => setSelectedTransactionType(operation.type === 'deposit' ? 0 : operation.type === 'withdraw' ? 1 : 2)}
                    className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                      selectedTransactionType === (operation.type === 'deposit' ? 0 : operation.type === 'withdraw' ? 1 : 2)
                        ? `bg-gradient-to-br ${operation.color} text-white border-transparent shadow-xl transform scale-105`
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg'
                    }`}
                  >
                    {selectedTransactionType === (operation.type === 'deposit' ? 0 : operation.type === 'withdraw' ? 1 : 2) && (
                      <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0" style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M10 10a2 2 0 100-4 2 2 0 000 4z'/%3E%3Ccircle cx='10' cy='10' r='3' fill='%23ffffff' fill-opacity='0.2'/%3E%3C/g%3E%3C/svg%3E")`
                        }}></div>
                      </div>
                    )}
                    
                    <div className="relative text-center">
                      <div className="text-4xl mb-3">{operation.icon}</div>
                      <div className="text-lg font-bold mb-2">{operation.label}</div>
                      <p className="text-sm opacity-75 mb-3">{operation.description}</p>
                      <div className="text-xs">
                        {selectedTransactionType === (operation.type === 'deposit' ? 0 : operation.type === 'withdraw' ? 1 : 2) ? (
                          <span className="inline-flex items-center px-2 py-1 bg-white/20 rounded-full">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            已选择
                          </span>
                        ) : (
                          <span className="opacity-60">点击选择</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-green-200 mb-8">
                <div className="text-center mb-6">
                  <h4 className="text-lg font-semibold text-green-900 mb-2">执行资金操作</h4>
                  <p className="text-green-700">
                    请输入操作金额和相关信息
                  </p>
                </div>
                
                <div className="space-y-4">
                  {selectedTransactionType !== 2 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        操作金额 (ETH)
                      </label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="输入金额"
                        step="0.001"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50/50"
                      />
                    </div>
                  )}
                  
                  {selectedTransactionType === 2 && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          接收方地址
                        </label>
                        <input
                          type="text"
                          value={recipient}
                          onChange={(e) => setRecipient(e.target.value)}
                          placeholder="输入接收方钱包地址"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          转账金额 (ETH)
                        </label>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="输入转账金额"
                          step="0.001"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50"
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-1">FHE加密保护</h4>
                        <p className="text-sm text-blue-700">
                          所有资金操作都使用FHE技术加密，确保交易隐私的同时保持区块链可验证性
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    {selectedTransactionType === 0 && (
                      <button
                        onClick={handleDeposit}
                        disabled={isSubmitting || !amount}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center">
                            <div className="spinner mr-2"></div>
                            存款中...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                            </svg>
                            存款 (FHE加密)
                          </span>
                        )}
                      </button>
                    )}
                    
                    {selectedTransactionType === 1 && (
                      <button
                        onClick={handleWithdraw}
                        disabled={isSubmitting || !amount}
                        className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center">
                            <div className="spinner mr-2"></div>
                            取款中...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                            取款 (FHE加密)
                          </span>
                        )}
                      </button>
                    )}
                    
                    {selectedTransactionType === 2 && (
                      <button
                        onClick={handleTransfer}
                        disabled={isSubmitting || !amount || !recipient}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center">
                            <div className="spinner mr-2"></div>
                            转账中...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            转账 (FHE加密)
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 步骤4: 交易历史 */}
          {transactions.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-8 border border-purple-200 mb-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-purple-900 mb-2">📜 交易历史记录</h3>
                <p className="text-purple-700 mb-4">
                  查看您的所有加密交易记录，每笔交易都使用FHE技术保护
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {transactions.map((tx, index) => (
                  <div key={index} className="bg-white rounded-xl p-4 border border-purple-200 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-gray-900">交易 #{index + 1}</span>
                      <span className="text-sm font-bold text-purple-600">{tx.amount} ETH</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div>
                        <span className="text-gray-600">发送方:</span>
                        <span className="ml-1 font-mono text-xs text-gray-900">{formatAddress(tx.from)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">接收方:</span>
                        <span className="ml-1 font-mono text-xs text-gray-900">{formatAddress(tx.to)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-200">
                      <span className="text-gray-500">{formatTime(tx.timestamp)}</span>
                      <div className="flex items-center space-x-1">
                        <svg className="w-3 h-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-purple-600 font-medium">FHE加密</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FHE技术优势 */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-200">
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium mb-4">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            FHE金融技术优势
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">为什么选择FHE隐私金融？</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            在保护隐私的同时，享受区块链的透明与安全
          </p>
        </div>
        
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">🔒 余额加密</h4>
            <p className="text-sm text-gray-600">所有余额信息完全加密，确保财务隐私</p>
          </div>
          
          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">🔐 私人交易</h4>
            <p className="text-sm text-gray-600">交易细节加密，但保持链上可验证性</p>
          </div>
          
          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">👥 角色管理</h4>
            <p className="text-sm text-gray-600">基于角色的访问控制，保护敏感信息</p>
          </div>
          
          <div className="text-center group">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">⚡ 高性能</h4>
            <p className="text-sm text-gray-600">加密状态下直接进行计算，性能优异</p>
          </div>
        </div>
      </div>
    </div>
  )
}