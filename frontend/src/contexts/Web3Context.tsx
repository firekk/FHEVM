import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { ethers } from 'ethers'
import Web3Modal from 'web3modal'
import { useQuery } from '@tanstack/react-query'

interface Web3ContextType {
  account: string | null
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
  contracts: {
    fheVoting: ethers.Contract | null
    fheFinance: ethers.Contract | null
  }
  isConnected: boolean
  connect: () => Promise<void>
  connectWallet: () => Promise<void>
  disconnect: () => void
  loading: boolean
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined)

export const useWeb3 = () => {
  const context = useContext(Web3Context)
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider')
  }
  return context
}

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null)
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [contracts, setContracts] = useState({
    fheVoting: null as ethers.Contract | null,
    fheFinance: null as ethers.Contract | null,
  })
  const [loading, setLoading] = useState(false)
  const web3Modal = useRef(new Web3Modal()).current

  const connect = async () => {
    try {
      setLoading(true)
      
      // 如果已有连接，先关闭
      if (provider) {
        await provider.disconnect()
      }
      
      const connection = await web3Modal.connect()
      const browserProvider = new ethers.BrowserProvider(connection)
      const signerInstance = await browserProvider.getSigner()
      
      const address = await signerInstance.getAddress()
      setAccount(address)
      setProvider(browserProvider)
      setSigner(signerInstance)

      // 加载合约实例
      loadContracts(signerInstance)
    } catch (error) {
      console.error('Error connecting to wallet:', error)
    } finally {
      setLoading(false)
    }
  }

  const connectWallet = async () => {
    await connect()
  }

  const disconnect = () => {
    console.log('Disconnect button clicked - disconnecting wallet...')
    console.log('Current account:', account)
    
    // 先清理应用状态，确保UI立即响应
    setAccount(null)
    setProvider(null)
    setSigner(null)
    setContracts({
      fheVoting: null,
      fheFinance: null,
    })
    
    // 然后尝试清理钱包状态
    try {
      // 尝试从 MetaMask 断开连接
      if (window.ethereum && typeof window.ethereum.request === 'function') {
        console.log('Attempting to disconnect from MetaMask...')
        
        // 使用正确的方法断开连接
        window.ethereum.request({ 
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }]
        }).then(() => {
          console.log('MetaMask permissions revoked successfully')
        }).catch((err) => {
          console.log('MetaMask permissions revocation failed:', err)
          // 备用方法：请求空账户列表
          window.ethereum.request({ 
            method: 'eth_requestAccounts',
            params: []
          }).catch((err2) => {
            console.log('Alternative disconnect method also failed:', err2)
          })
        })
      } else {
        console.log('window.ethereum not available, only cleaning app state')
      }
    } catch (error) {
      console.log('Error during wallet disconnect:', error)
    }
    
    // 清理本地存储
    cleanupWalletState()
    
    console.log('Disconnect process completed - app state cleared')
  }
  
  // 辅助函数：清理钱包本地状态
  const cleanupWalletState = () => {
    // 清理 Web3Modal 相关的本地存储
    localStorage.removeItem('walletconnect')
    localStorage.removeItem('walletconnect::bridge')
    localStorage.removeItem('walletconnect::client')
    localStorage.removeItem('walletconnect::session')
    
    // 清理其他可能的 Web3 相关存储
    localStorage.removeItem('web3modal.cachedProvider')
    localStorage.removeItem('web3modal.ethereum')
    
    console.log('Wallet state cleared')
  }

  const loadContracts = async (signerInstance: ethers.JsonRpcSigner) => {
    try {
      console.log('Loading contracts...')
      
      // 读取部署信息文件
      const response = await fetch('/deployment-info.json')
      if (!response.ok) {
        throw new Error(`Failed to load deployment info: ${response.status} ${response.statusText}`)
      }
      const deploymentInfo = await response.json()
      console.log('Deployment info loaded:', deploymentInfo)

      // 读取合约ABI文件
      const [votingAbiResponse, financeAbiResponse] = await Promise.all([
        fetch('/artifacts/contracts/VotingDemo.sol/VotingDemo.json'),
        fetch('/artifacts/contracts/FinanceDemo.sol/FinanceDemo.json')
      ])
      
      if (!votingAbiResponse.ok) {
        throw new Error(`Failed to load voting ABI: ${votingAbiResponse.status} ${votingAbiResponse.statusText}`)
      }
      if (!financeAbiResponse.ok) {
        throw new Error(`Failed to load finance ABI: ${financeAbiResponse.status} ${financeAbiResponse.statusText}`)
      }
      
      const votingAbiData = await votingAbiResponse.json()
      const financeAbiData = await financeAbiResponse.json()
      console.log('ABI data loaded:', votingAbiData.contractName, financeAbiData.contractName)

      const votingAbi = votingAbiData.abi
      const financeAbi = financeAbiData.abi

      // 直接使用合约地址创建合约实例
      const fheVotingContract = new ethers.Contract(deploymentInfo.FHEVoting, votingAbi, signerInstance)
      const fheFinanceContract = new ethers.Contract(deploymentInfo.FHEFinance, financeAbi, signerInstance)

      console.log('Contracts created successfully')
      setContracts({
        fheVoting: fheVotingContract,
        fheFinance: fheFinanceContract,
      })
    } catch (error) {
      console.error('Error loading contracts:', error)
      // 设置一个空状态避免 UI 卡住
      setContracts({
        fheVoting: null,
        fheFinance: null,
      })
    }
  }

  const value: Web3ContextType = {
    account,
    provider,
    signer,
    contracts,
    isConnected: !!account,
    connect,
    connectWallet,
    disconnect,
    loading,
  }

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>
}