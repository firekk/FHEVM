import React, { useState, useEffect } from 'react'
import { useWeb3 } from '../contexts/Web3Context'

export const Home: React.FC = () => {
  const { account, contracts, connectWallet, isConnecting } = useWeb3()
  const [activeDemo, setActiveDemo] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

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

  const demos = [
    {
      id: 'voting',
      title: '🗳️ 秘密投票系统',
      description: '匿名投票，公开结果',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-100',
      borderColor: 'border-blue-200',
      steps: [
        { title: '连接钱包', description: '连接您的加密钱包开始使用' },
        { title: '注册为选民', description: '获取您的投票权重' },
        { title: '选择投票选项', description: '您的选择将被加密保护' },
        { title: '查看结果', description: '所有投票结果公开可验证' }
      ]
    },
    {
      id: 'finance',
      title: '💰 隐私金融系统',
      description: '加密交易，透明验证',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-100',
      borderColor: 'border-green-200',
      steps: [
        { title: '查看加密余额', description: '您的余额信息完全加密' },
        { title: '存款操作', description: '资金自动加密存储' },
        { title: '转账交易', description: '接收方地址明文，金额加密' },
        { title: '查看历史', description: '所有交易记录加密保护' }
      ]
    }
  ]

  return (
    <div className="space-y-6 md:space-y-8 pb-20 md:pb-0">
      {/* 顶部状态栏 */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div className="flex items-center mb-4 sm:mb-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">FHEVM 隐私演示平台</h1>
              <p className="text-sm sm:text-base text-gray-600">体验全同态加密技术的强大功能</p>
            </div>
          </div>
          
          <div className="text-center sm:text-right">
            <div className="bg-gray-900 text-white px-3 sm:px-4 py-2 rounded-lg font-mono text-xs sm:text-sm mb-2">
              {isConnecting ? '连接中...' : account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '未连接钱包'}
            </div>
            <div className="flex items-center text-xs sm:text-sm">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                isConnecting ? 'bg-yellow-500 animate-pulse' : account ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className={
                isConnecting ? 'text-yellow-600' : 
                account ? 'text-green-600' : 'text-red-600'
              }>
                {isConnecting ? '正在连接...' : 
                 account ? '钱包已连接' : '请连接钱包开始使用'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 钱包连接状态 */}
      {!account && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 border border-blue-200">
          <div className="text-center">
            <h3 className="text-lg sm:text-xl font-bold text-blue-900 mb-3 sm:mb-4">🔌 连接钱包</h3>
            <p className="text-sm sm:text-base text-blue-700 mb-4 sm:mb-6 px-2">
              连接您的Web3钱包以开始体验FHE技术的强大功能
            </p>
            <button
              onClick={async () => {
                try {
                  await connectWallet()
                  setShowSuccess(true)
                } catch (error: any) {
                  setErrorMessage(error.message || '连接钱包失败')
                  setShowError(true)
                }
              }}
              disabled={isConnecting}
              className="btn-primary disabled:opacity-50 w-full sm:w-auto"
            >
              {isConnecting ? (
                <span className="flex items-center justify-center">
                  <div className="spinner mr-2"></div>
                  正在连接钱包...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="w-4 sm:w-5 h-4 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  连接钱包
                </span>
              )}
            </button>
            <div className="mt-4 p-3 bg-white/80 rounded-lg border border-blue-200">
              <p className="text-xs text-gray-600">
                💡 提示：您需要支持Web3的钱包（如MetaMask）才能使用此功能
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 成功提示 */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg border border-green-200 animate-fade-in">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>操作成功！</span>
            </div>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {showError && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg border border-red-200 animate-fade-in">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          </div>
        </div>
      )}

      {/* 快速开始 */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-4 sm:p-8 text-white">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-3xl font-bold mb-3 sm:mb-4">🚀 快速开始使用 FHEVM</h2>
          <p className="text-base sm:text-xl opacity-90 max-w-2xl mx-auto px-2">
            FHE技术让您在保护隐私的同时，享受区块链的透明与安全
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center mr-3 sm:mr-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold">1. 连接钱包</h3>
                <p className="text-xs sm:text-sm opacity-80">连接您的Web3钱包</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center mr-3 sm:mr-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold">2. 选择功能</h3>
                <p className="text-xs sm:text-sm opacity-80">开始使用加密功能</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 功能演示卡片 */}
      <div className="space-y-4 sm:space-y-6">
        {demos.map((demo) => (
          <div 
            key={demo.id}
            className={`group relative rounded-xl sm:rounded-2xl p-4 sm:p-8 border-2 transition-all duration-500 overflow-hidden cursor-pointer ${
              activeDemo === demo.id 
                ? `shadow-2xl transform scale-[1.02] ${demo.borderColor}` 
                : `hover:shadow-lg sm:hover:shadow-xl ${demo.borderColor} hover:border-opacity-80`
            } ${demo.bgColor}`}
            onClick={() => setActiveDemo(activeDemo === demo.id ? null : demo.id)}
          >
            {/* 背景图案 */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`
              }}></div>
            </div>
            
            <div className="relative">
              <div className="flex items-center mb-4 sm:mb-6">
                <div className={`w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br ${demo.color} rounded-xl flex items-center justify-center mr-3 sm:mr-4 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110`}>
                  <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={demo.icon} />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">{demo.title}</h2>
                  <p className="text-sm sm:text-base text-gray-700 font-medium">{demo.description}</p>
                </div>
                <div className="ml-2 sm:ml-4">
                  <svg 
                    className={`w-5 h-5 sm:w-6 sm:h-6 text-gray-400 transform transition-transform duration-300 ${
                      activeDemo === demo.id ? 'rotate-180' : ''
                    }`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* 步骤说明 */}
              {activeDemo === demo.id && (
                <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4 animate-fade-in">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-200">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      使用步骤
                    </h3>
                    
                    <div className="space-y-3 sm:space-y-4">
                      {demo.steps.map((step, index) => (
                        <div key={index} className="flex items-start">
                          <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3 sm:mr-4 mt-0.5 sm:mt-1">
                            <span className="text-white text-xs sm:text-sm font-bold">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm sm:font-medium text-gray-900 mb-1">{step.title}</h4>
                            <p className="text-xs sm:text-sm text-gray-600">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 gap-3 sm:gap-0">
                    <div className="flex items-center">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                        <svg className="w-2 h-2 sm:w-3 sm:h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-700">FHE加密保护，隐私安全</span>
                    </div>
                    <a
                      href={`/${demo.id}`}
                      className="inline-flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-xs sm:text-sm w-full sm:w-auto justify-center"
                    >
                      立即体验
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 技术优势 */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            FHE技术优势
          </div>
          <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-4">为什么选择全同态加密？</h2>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">🔒 数据隐私</h3>
            <p className="text-xs sm:text-sm text-gray-600">数据全程加密，只有您能解密</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">✅ 可验证性</h3>
            <p className="text-xs sm:text-sm text-gray-600">结果公开可验证，过程透明</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">⚡ 高性能</h3>
            <p className="text-xs sm:text-sm text-gray-600">加密状态下直接进行计算</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">🛡️ 安全可靠</h3>
            <p className="text-xs sm:text-sm text-gray-600">基于数学难题，无法破解</p>
          </div>
        </div>
      </div>
    </div>
  )
}