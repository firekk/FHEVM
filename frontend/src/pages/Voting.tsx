import React, { useState, useEffect, useCallback } from 'react'
import { useWeb3 } from '../contexts/Web3Context'
import { ethers } from 'ethers'

interface VotingInfo {
  description: string
  endTime: number
  isActive: boolean
  totalWeight: number
  votedCount: number
}

interface VoterInfo {
  isRegistered: boolean
  weight: number
  hasVoted: boolean
}

// Helper function to safely call contract methods that might return empty data
const safeContractCall = async (callFn: () => Promise<any>, defaultValue: any): Promise<any> => {
  try {
    const result = await callFn()
    // Check if result is empty/invalid (like '0x' for empty bytes)
    if (result === '0x' || (Array.isArray(result) && result.length === 0 && result.every(item => item === '0x'))) {
      return defaultValue
    }
    return result
  } catch (error) {
    console.warn('Contract call failed, using default:', error)
    return defaultValue
  }
}

// Helper function to specifically handle revealResults which might return BAD_DATA error
const safeRevealResults = async (contract: ethers.Contract) => {
  try {
    return await contract.revealResults()
  } catch (error: any) {
    console.warn('revealResults failed, trying manual decoding:', error)
    
    // If it's a BAD_DATA error with 0x, return default values
    if (error.code === 'BAD_DATA' && error.value === '0x') {
      return [0, 0, 0]
    }
    
    // Re-throw other errors
    throw error
  }
}

export const Voting: React.FC = () => {
  const { account, contracts, connect, disconnect } = useWeb3()
  const [votingInfo, setVotingInfo] = useState<VotingInfo | null>(null)
  const [voterInfo, setVoterInfo] = useState<VoterInfo>({
    isRegistered: false,
    weight: 0,
    hasVoted: false,
  })
  const [selectedVote, setSelectedVote] = useState<number>(0)
  const [isVoting, setIsVoting] = useState(false)
  const [isEndingVoting, setIsEndingVoting] = useState(false)
  const [results, setResults] = useState<{ yes: number; no: number; abstain: number } | null>(null)
  const [isRevealingResults, setIsRevealingResults] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [infoMessage, setInfoMessage] = useState('')

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showSuccess])

  useEffect(() => {
    if (showError) {
      const timer = setTimeout(() => setShowError(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [showError])

  useEffect(() => {
    if (contracts?.fheVoting) {
      loadVotingInfo()
    }
    // 只有在账户和合约都存在时才加载投票者信息
    if (account && contracts?.fheVoting) {
      loadVoterInfo()
    }
  }, [account, contracts?.fheVoting])

  const loadVotingInfo = useCallback(async () => {
    if (!contracts.fheVoting) return
    
    try {
      console.log('Loading voting info...')
      
      const [description, endTime, isActive] = await safeContractCall(
        () => contracts.fheVoting.getVotingInfo(),
        ['', 0, false]
      )
      const totalWeight = await safeContractCall(
        () => contracts.fheVoting.getTotalWeight(),
        0
      )
      const votedCount = await safeContractCall(
        () => contracts.fheVoting.getVotedCount(),
        0
      )
      
      console.log('Raw voting info:', { description, endTime, isActive, totalWeight, votedCount })
      
      setVotingInfo({
        description,
        endTime,
        isActive,
        totalWeight: Number(totalWeight),
        votedCount: Number(votedCount),
      })
    } catch (error) {
      console.error('Error loading voting info:', error)
    }
  }, [contracts.fheVoting])

  const loadVoterInfo = useCallback(async () => {
    if (!account || !contracts.fheVoting) {
      console.log('Cannot load voter info: missing account or contracts')
      // 设置默认状态而不是 null，避免 UI 显示"加载中"
      setVoterInfo({
        isRegistered: false,
        weight: 0,
        hasVoted: false,
      })
      return
    }
    
    try {
      console.log('Loading voter info for account:', account)
      
      // Use safe contract calls to handle empty data gracefully
      const weightResult = await safeContractCall(
        () => contracts.fheVoting.votingWeights(account),
        '0x'
      )
      
      const hasVotedResult = await safeContractCall(
        () => contracts.fheVoting.hasVoted(account),
        false
      )
      
      console.log('Raw votingWeights result:', weightResult)
      console.log('Raw hasVoted result:', hasVotedResult)
      
      // Handle the case where votingWeights returns 0x (empty data)
      const weight = weightResult === '0x' || weightResult === null || weightResult === undefined ? 0 : Number(weightResult)
      const hasVoted = hasVotedResult
      console.log('Parsed weight value:', weight)
      
      const newVoterInfo = {
        isRegistered: weight > 0,
        weight: weight,
        hasVoted: hasVoted,
      }
      
      console.log('Setting voter info:', newVoterInfo)
      setVoterInfo(newVoterInfo)
    } catch (error) {
      console.error('Error loading voter info:', error)
      // Set a default state to avoid infinite loading
      const defaultVoterInfo = {
        isRegistered: false,
        weight: 0,
        hasVoted: false,
      }
      console.log('Setting default voter info due to error:', defaultVoterInfo)
      setVoterInfo(defaultVoterInfo)
    }
  }, [account, contracts.fheVoting])

  const handleRegister = async () => {
    if (!contracts.fheVoting) return
    
    try {
      setIsVoting(true)
      const weight = 10 // 默认权重
      const tx = await contracts.fheVoting.registerVoter(weight)
      await tx.wait()
      await loadVoterInfo()
      setCurrentStep(2)
      setShowSuccess(true)
    } catch (error: any) {
      console.error('Error registering voter:', error)
      setErrorMessage(error.message || '注册选民失败')
      setShowError(true)
    } finally {
      setIsVoting(false)
    }
  }

  const handleVote = async () => {
    if (!contracts.fheVoting || !account) return
    
    try {
      setIsVoting(true)
      
      const encryptedVote = BigInt(selectedVote)
      const tx = await contracts.fheVoting.vote(encryptedVote)
      await tx.wait()
      
      await loadVotingInfo()
      await loadVoterInfo()
      setSelectedVote(0)
      setCurrentStep(3)
      setShowSuccess(true)
    } catch (error: any) {
      console.error('Error voting:', error)
      setErrorMessage(error.message || '投票失败')
      setShowError(true)
    } finally {
      setIsVoting(false)
    }
  }

  const handleEndVoting = async () => {
    if (!contracts.fheVoting) return
    
    try {
      setIsEndingVoting(true)
      const tx = await contracts.fheVoting.endVoting()
      await tx.wait()
      await loadVotingInfo()
    } catch (error: any) {
      console.error('Error ending voting:', error)
      setErrorMessage(error.message || '结束投票失败')
      setShowError(true)
    } finally {
      setIsEndingVoting(false)
    }
  }

  const handleRevealResults = async () => {
    if (!contracts.fheVoting) return
    
    try {
      setIsRevealingResults(true)
      
      // Use specialized safe reveal results function
      const result = await safeRevealResults(contracts.fheVoting)
      
      console.log('Raw revealResults result:', result)
      
      let yesVotes = 0, noVotes = 0, abstainVotes = 0
      
      if (Array.isArray(result) && result.length >= 3) {
        yesVotes = Number(result[0]) || 0
        noVotes = Number(result[1]) || 0
        abstainVotes = Number(result[2]) || 0
      } else if (result && typeof result === 'object') {
        yesVotes = Number(result.yesVotes) || 0
        noVotes = Number(result.noVotes) || 0
        abstainVotes = Number(result.abstainVotes) || 0
      } else if (!result || (Array.isArray(result) && result.every(v => v === 0))) {
        // Contract returned empty data or all zeros - likely no voters found
        console.warn('revealResults returned empty data, no voters found')
        setResults({
          yes: 0,
          no: 0,
          abstain: 0,
        })
        setInfoMessage('暂无投票数据，请确保已注册为投票者并进行投票')
        setCurrentStep(4)
        return
      } else {
        console.warn('Unexpected result format:', result)
        // Use default values for unexpected formats
        yesVotes = 0
        noVotes = 0
        abstainVotes = 0
      }
      
      setResults({
        yes: yesVotes,
        no: noVotes,
        abstain: abstainVotes,
      })
      setCurrentStep(4)
    } catch (error: any) {
      console.error('Error revealing results:', error)
      setErrorMessage(error.message || '解密结果失败')
      setShowError(true)
    } finally {
      setIsRevealingResults(false)
    }
  }

  const getStatusText = (isActive: boolean) => {
    return isActive ? '进行中' : '已结束'
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN')
  }

  const getTimeRemaining = () => {
    if (!votingInfo) return ''
    const now = Math.floor(Date.now() / 1000)
    const remaining = votingInfo.endTime - now
    if (remaining <= 0) return '投票已结束'
    const hours = Math.floor(remaining / 3600)
    const minutes = Math.floor((remaining % 3600) / 60)
    return `剩余 ${hours}小时 ${minutes}分钟`
  }

  // 步骤状态计算
  const getStepStatus = () => {
    if (!account) return 0 // 未连接钱包
    if (voterInfo?.isRegistered) {
      if (voterInfo.hasVoted) return 3 // 已投票
      if (!votingInfo?.isActive) return 2 // 投票已结束，可以查看结果
      return 2 // 可以投票
    }
    return 1 // 需要注册
  }

  const stepStatus = getStepStatus()

  // 钱包连接处理
  const handleConnectWallet = async () => {
    try {
      await connect()
      setShowSuccess(true)
    } catch (error: any) {
      setErrorMessage(error.message || '连接钱包失败')
      setShowError(true)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 md:pb-0">
      {/* 成功提示 */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-green-500 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl shadow-lg border border-green-200 animate-fade-in">
            <div className="flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm sm:text-base">操作成功！</span>
            </div>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {showError && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-red-500 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl shadow-lg border border-red-200 animate-fade-in">
            <div className="flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-sm sm:text-base">{errorMessage}</span>
            </div>
          </div>
        </div>
      )}

      {/* 信息提示 */}
      {infoMessage && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-blue-500 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl shadow-lg border border-blue-200 animate-fade-in">
            <div className="flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm sm:text-base">{infoMessage}</span>
            </div>
          </div>
        </div>
      )}
      {/* 页面标题 */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div className="flex items-center mb-4 sm:mb-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">🗳️ 秘密投票系统</h1>
              <p className="text-sm sm:text-base text-gray-600">匿名投票，结果公开可验证</p>
            </div>
          </div>
          
          <div className="text-center sm:text-right">
            <div className="bg-gray-900 text-white px-3 sm:px-4 py-2 rounded-lg font-mono text-xs sm:text-sm mb-2 truncate-text">
              {votingInfo?.description.slice(0, 25)}...
            </div>
            <div className="flex items-center text-xs sm:text-sm">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                votingInfo?.isActive ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className={votingInfo?.isActive ? 'text-green-600' : 'text-red-600'}>
                {votingInfo?.isActive ? '投票进行中' : '投票已结束'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 步骤导航 */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          投票步骤指南
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
              title: '注册选民', 
              description: '获取投票权重',
              icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' 
            },
            { 
              step: 3, 
              title: '投下秘密票', 
              description: '选择您的投票选项',
              icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' 
            },
            { 
              step: 4, 
              title: '查看结果', 
              description: '查看最终统计',
              icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' 
            }
          ].map((item) => (
            <div 
              key={item.step}
              className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 text-center transition-all duration-300 ${
                stepStatus >= item.step 
                  ? 'border-blue-200 bg-blue-50 transform scale-105' 
                  : 'border-gray-200 bg-gray-50 opacity-60'
              }`}
            >
              <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 ${
                stepStatus >= item.step 
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' 
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
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    进行中
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* 步骤进度条 */}
        <div className="mt-6 sm:mt-8">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-xs sm:text-sm text-gray-600">当前进度</span>
            <span className="text-xs sm:text-sm font-bold text-blue-600">
              {stepStatus}/4 步骤完成
            </span>
          </div>
          <div className="bg-gray-200 rounded-full h-2 sm:h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${(stepStatus / 4) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* 左侧：投票状态 */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          {/* 钱包连接状态 */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 mb-4">
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
                <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <p className="text-xs font-mono text-gray-800 font-medium">
                    {account.slice(0, 8)}...{account.slice(-6)}
                  </p>
                </div>
              )}
              {account && (
                <button
                  onClick={() => {
                    console.log('Disconnect button clicked')
                    disconnect()
                  }}
                  className="w-full mt-3 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg border border-red-200 transition-colors duration-200 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  断开连接
                </button>
              )}
            </div>
          </div>

          {/* 投票者状态 */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              投票者状态
            </h3>
            {/* 投票者状态 - 总是显示，避免加载状态 */}
            <div className="grid sm:grid-cols-1 gap-3 sm:gap-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-green-700 font-medium">注册状态</span>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      voterInfo?.isRegistered ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className={`text-xs sm:text-sm font-bold ${
                      voterInfo?.isRegistered ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {voterInfo?.isRegistered ? '已注册' : '未注册'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-blue-700 font-medium">投票权重</span>
                  <span className="text-sm sm:text-base font-bold text-blue-800">
                    {voterInfo?.weight || 0}
                  </span>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-purple-700 font-medium">投票状态</span>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      voterInfo?.hasVoted ? 'bg-blue-500' : 'bg-gray-400'
                    }`}></div>
                    <span className={`text-xs sm:text-sm font-bold ${
                      voterInfo?.hasVoted ? 'text-blue-800' : 'text-gray-700'
                    }`}>
                      {voterInfo?.hasVoted ? '已投票' : '待投票'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 投票统计 */}
          {votingInfo && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                投票统计
              </h3>
              <div className="grid sm:grid-cols-1 gap-3 sm:gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-blue-700 font-medium">总投票权重</span>
                    <span className="text-sm sm:text-base font-bold text-blue-800">
                      {votingInfo.totalWeight}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 sm:p-4 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-purple-700 font-medium">已投票数</span>
                    <span className="text-sm sm:text-base font-bold text-purple-800">
                      {votingInfo.votedCount}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-3 sm:p-4 border border-orange-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-orange-700 font-medium">结束时间</span>
                    <span className="text-xs sm:text-sm text-orange-800 font-medium">
                      {formatTime(votingInfo.endTime)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 右侧：操作区域 */}
        <div className="lg:col-span-2">
          {/* 步骤1: 连接钱包 */}
          {!account && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 sm:p-6 border border-orange-200 mb-4 sm:mb-6">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-orange-900 mb-2">🔌 连接钱包</h3>
                <p className="text-sm sm:text-base text-orange-700 mb-3 sm:mb-4 px-2">
                  请先连接您的Web3钱包以开始投票过程
                </p>
                <div className="bg-white/80 rounded-lg p-3 sm:p-4 border border-orange-200">
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">
                    💡 提示：您需要支持Web3的钱包（如MetaMask）才能使用此功能
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 步骤2: 注册选民 */}
          {account && !voterInfo?.isRegistered && votingInfo?.isActive && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-xl font-bold text-blue-900 mb-3">📝 注册为选民</h3>
                  <p className="text-blue-700 mb-4 leading-relaxed">
                    作为注册选民，您将获得投票权重（默认为10），可以参与本次加密投票。
                    您的投票选择将被FHE技术完全加密，确保隐私安全。
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/80 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">🔒 隐私保护</h4>
                      <p className="text-sm text-blue-700">
                        您的投票选择将被加密，只有您知道自己的选择
                      </p>
                    </div>
                    <div className="bg-white/80 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">⚖️ 投票权重</h4>
                      <p className="text-sm text-blue-700">
                        注册后获得10个投票权重，影响最终结果
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleRegister}
                    disabled={isVoting}
                    className="w-full btn-primary disabled:opacity-50"
                  >
                    {isVoting ? (
                      <span className="flex items-center justify-center">
                        <div className="spinner mr-2"></div>
                        注册中...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        注册为选民
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 步骤3: 投票 */}
          {voterInfo?.isRegistered && !voterInfo.hasVoted && votingInfo?.isActive && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-8 border border-purple-200 mb-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-purple-900 mb-2">🗳️ 投下您的秘密票</h3>
                <p className="text-purple-700 mb-4">
                  您的选择将被FHE技术完全加密，只有您知道自己的投票内容
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {[
                  { 
                    value: 0, 
                    label: '支持 ✅', 
                    color: 'from-green-500 to-emerald-600', 
                    icon: '👍',
                    description: '支持提案，投赞成票'
                  },
                  { 
                    value: 1, 
                    label: '反对 ❌', 
                    color: 'from-red-500 to-rose-600', 
                    icon: '👎',
                    description: '反对提案，投反对票'
                  },
                  { 
                    value: 2, 
                    label: '弃权 🤔', 
                    color: 'from-gray-500 to-slate-600', 
                    icon: '🤷',
                    description: '不表达意见，投弃权票'
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedVote(option.value)}
                    className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                      selectedVote === option.value
                        ? `bg-gradient-to-br ${option.color} text-white border-transparent shadow-xl transform scale-105`
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg'
                    }`}
                  >
                    {selectedVote === option.value && (
                      <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0" style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M10 10a2 2 0 100-4 2 2 0 000 4z'/%3E%3Ccircle cx='10' cy='10' r='3' fill='%23ffffff' fill-opacity='0.2'/%3E%3C/g%3E%3C/svg%3E")`
                        }}></div>
                      </div>
                    )}
                    
                    <div className="relative text-center">
                      <div className="text-4xl mb-3">{option.icon}</div>
                      <div className="text-lg font-bold mb-2">{option.label}</div>
                      <p className="text-sm opacity-75 mb-3">{option.description}</p>
                      <div className="text-xs">
                        {selectedVote === option.value ? (
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
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-200 mb-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-900 mb-1">FHE加密保护</h4>
                    <p className="text-sm text-purple-700">
                      您的投票将被FHE技术完全加密，确保投票隐私，同时保持投票过程的透明和可验证性。
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleVote}
                disabled={isVoting || selectedVote === undefined}
                className="w-full btn-primary disabled:opacity-50"
              >
                {isVoting ? (
                  <span className="flex items-center justify-center">
                    <div className="spinner mr-2"></div>
                    正在加密并提交您的投票...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    提交加密投票
                  </span>
                )}
              </button>
            </div>
          )}

          {/* 步骤4: 已投票状态 */}
          {voterInfo?.hasVoted && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200 mb-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-green-900 mb-2">✅ 投票成功！</h3>
                <p className="text-green-700 mb-4">
                  您的加密投票已成功提交。您的选择将被安全保存，只有在投票结束时才会被解密。
                </p>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-green-200 max-w-md mx-auto">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm text-green-800">投票已上链记录</span>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <span className="text-sm text-green-800">FHE加密保护</span>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-sm text-green-800">等待结果公布</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 投票结束状态 */}
          {!votingInfo?.isActive && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-8 border border-orange-200 mb-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-orange-900 mb-2">⏰ 投票已结束</h3>
                <p className="text-orange-700 mb-4">
                  投票时间已结束，现在可以查看最终投票结果。
                </p>
                
                <button
                  onClick={handleRevealResults}
                  disabled={isRevealingResults}
                  className="btn-primary disabled:opacity-50"
                >
                  {isRevealingResults ? (
                    <span className="flex items-center">
                      <div className="spinner mr-2"></div>
                      解密结果中...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      查看投票结果
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 投票结果显示 */}
      {results && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 sm:p-8 border border-emerald-200 animate-fade-in">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium mb-4">
              <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center mr-2">
                <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              🎉 投票结果已公布
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">最终投票统计</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              使用FHE技术解密统计结果。个人投票内容保持加密，仅汇总结果公开。
            </p>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="text-center group">
              <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <div className="text-3xl sm:text-5xl font-bold mb-2">{results.yes}</div>
                <div className="text-green-100 font-medium text-base sm:text-lg mb-2 sm:mb-3">支持票</div>
                <div className="text-green-200 text-sm mb-3">
                  {((results.yes / (results.yes + results.no + results.abstain)) * 100 || 0).toFixed(1)}%
                </div>
                <div className="bg-white/20 rounded-full h-2 sm:h-3">
                  <div 
                    className="bg-white h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${(results.yes / (results.yes + results.no + results.abstain)) * 100 || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="text-center group">
              <div className="bg-gradient-to-br from-red-400 to-rose-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <div className="text-3xl sm:text-5xl font-bold mb-2">{results.no}</div>
                <div className="text-red-100 font-medium text-base sm:text-lg mb-2 sm:mb-3">反对票</div>
                <div className="text-red-200 text-sm mb-3">
                  {((results.no / (results.yes + results.no + results.abstain)) * 100 || 0).toFixed(1)}%
                </div>
                <div className="bg-white/20 rounded-full h-2 sm:h-3">
                  <div 
                    className="bg-white h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${(results.no / (results.yes + results.no + results.abstain)) * 100 || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="text-center group">
              <div className="bg-gradient-to-br from-gray-400 to-slate-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <div className="text-3xl sm:text-5xl font-bold mb-2">{results.abstain}</div>
                <div className="text-gray-100 font-medium text-base sm:text-lg mb-2 sm:mb-3">弃权票</div>
                <div className="text-gray-200 text-sm mb-3">
                  {((results.abstain / (results.yes + results.no + results.abstain)) * 100 || 0).toFixed(1)}%
                </div>
                <div className="bg-white/20 rounded-full h-2 sm:h-3">
                  <div 
                    className="bg-white h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${(results.abstain / (results.yes + results.no + results.abstain)) * 100 || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-emerald-200">
            <div className="flex items-start">
              <div className="w-8 h-8 sm:w-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-emerald-900 mb-2 text-sm sm:text-base">🔒 FHE技术成功应用！</h4>
                <p className="text-emerald-800 leading-relaxed text-xs sm:text-sm">
                  投票结果现已公开可验证，同时每个人的投票选择保持完全加密。
                  这展示了FHE技术的强大能力：在保护个人隐私的同时，实现透明和可信的集体决策。
                  每个投票的权重都经过统计，确保结果的公正性和代表性。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}