import React, { createContext, useContext, useEffect, useState } from 'react'
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

  const connect = async () => {
    try {
      setLoading(true)
      const web3Modal = new Web3Modal()
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

  const disconnect = () => {
    setAccount(null)
    setProvider(null)
    setSigner(null)
    setContracts({
      fheVoting: null,
      fheFinance: null,
    })
  }

  const loadContracts = async (signerInstance: ethers.JsonRpcSigner) => {
    try {
      // 读取部署信息文件
      const response = await fetch('/deployment-info.json')
      const deploymentInfo = await response.json()

      const FHEVotingFactory = await ethers.getContractFactory('FHEVoting', signerInstance)
      const FHEFinanceFactory = await ethers.getContractFactory('FHEFinance', signerInstance)

      const fheVotingContract = await FHEVotingFactory.attach(deploymentInfo.FHEVoting)
      const fheFinanceContract = await FHEFinanceFactory.attach(deploymentInfo.FHEFinance)

      setContracts({
        fheVoting: fheVotingContract,
        fheFinance: fheFinanceContract,
      })
    } catch (error) {
      console.error('Error loading contracts:', error)
    }
  }

  const value: Web3ContextType = {
    account,
    provider,
    signer,
    contracts,
    isConnected: !!account,
    connect,
    disconnect,
    loading,
  }

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>
}