import React, { useState, useEffect } from 'react'
import { useWeb3 } from '../contexts/Web3Context'
import { ethers } from 'ethers'

interface VotingInfo {
  description: string
  status: number
  startTime: number
  endTime: number
  totalWeight: number
  votedCount: number
}

interface VoterInfo {
  isRegistered: boolean
  weight: number
  hasVoted: boolean
}

export const Voting: React.FC = () => {
  const { account, contracts } = useWeb3()
  const [votingInfo, setVotingInfo] = useState<VotingInfo | null>(null)
  const [voterInfo, setVoterInfo] = useState<VoterInfo | null>(null)
  const [selectedVote, setSelectedVote] = useState<number>(0)
  const [isVoting, setIsVoting] = useState(false)
  const [isEndingVoting, setIsEndingVoting] = useState(false)
  const [results, setResults] = useState<{ yes: number; no: number; abstain: number } | null>(null)
  const [isRevealingResults, setIsRevealingResults] = useState(false)

  useEffect(() => {
    loadVotingInfo()
    loadVoterInfo()
  }, [account, contracts])

  const loadVotingInfo = async () => {
    if (!contracts.fheVoting) return
    
    try {
      const info = await contracts.fheVoting.getVotingInfo()
      setVotingInfo({
        description: info[0],
        status: info[2],
        startTime: info[1],
        endTime: info[1],
        totalWeight: info[3],
        votedCount: info[4],
      })
    } catch (error) {
      console.error('Error loading voting info:', error)
    }
  }

  const loadVoterInfo = async () => {
    if (!account || !contracts.fheVoting) return
    
    try {
      const weight = await contracts.fheVoting.votingWeights(account)
      const hasVoted = await contracts.fheVoting.hasVoted(account)
      
      setVoterInfo({
        isRegistered: weight > 0,
        weight: Number(weight),
        hasVoted: hasVoted,
      })
    } catch (error) {
      console.error('Error loading voter info:', error)
    }
  }

  const handleRegister = async () => {
    if (!contracts.fheVoting) return
    
    try {
      const weight = 10 // 默认权重
      const tx = await contracts.fheVoting.registerVoter(weight)
      await tx.wait()
      await loadVoterInfo()
    } catch (error) {
      console.error('Error registering voter:', error)
    }
  }

  const handleVote = async () => {
    if (!contracts.fheVoting || !account) return
    
    try {
      setIsVoting(true)
      
      const encryptedVote = ethers.toBeBigInt(selectedVote)
      const tx = await contracts.fheVoting.vote(encryptedVote)
      await tx.wait()
      
      await loadVotingInfo()
      await loadVoterInfo()
      setSelectedVote(0)
    } catch (error) {
      console.error('Error voting:', error)
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
    } catch (error) {
      console.error('Error ending voting:', error)
    } finally {
      setIsEndingVoting(false)
    }
  }

  const handleRevealResults = async () => {
    if (!contracts.fheVoting) return
    
    try {
      setIsRevealingResults(true)
      const result = await contracts.fheVoting.revealResults()
      setResults({
        yes: Number(result.yesVotes),
        no: Number(result.noVotes),
        abstain: Number(result.abstainVotes),
      })
    } catch (error) {
      console.error('Error revealing results:', error)
    } finally {
      setIsRevealingResults(false)
    }
  }

  const getStatusText = (status: number) => {
    const statuses = ['Not Started', 'Active', 'Ended']
    return statuses[status] || 'Unknown'
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const getTimeRemaining = () => {
    if (!votingInfo) return ''
    const now = Math.floor(Date.now() / 1000)
    const remaining = votingInfo.endTime - now
    if (remaining <= 0) return 'Voting ended'
    const hours = Math.floor(remaining / 3600)
    const minutes = Math.floor((remaining % 3600) / 60)
    return ` ${hours}h ${minutes}m remaining`
  }

  return (
    <div className="space-y-8">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🗳️ Encrypted Voting</h1>
              <p className="text-gray-600">Private Ballots, Public Results</p>
            </div>
          </div>
        </div>

        {votingInfo && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Voting Session</h3>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Description</p>
                  <p className="font-medium text-gray-900">{votingInfo.description}</p>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <p className={`font-medium ${
                    votingInfo.status === 1 ? 'text-green-600' : 
                    votingInfo.status === 2 ? 'text-gray-600' : 'text-red-600'
                  }`}>
                    {getStatusText(votingInfo.status)}
                    {votingInfo.status === 1 && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {getTimeRemaining()}
                      </span>
                    )}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Start Time</p>
                    <p className="font-medium text-gray-900 text-sm">{formatTime(votingInfo.startTime)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">End Time</p>
                    <p className="font-medium text-gray-900 text-sm">{formatTime(votingInfo.endTime)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <p className="text-sm text-blue-600 mb-1">Total Weight</p>
                    <p className="font-bold text-blue-900 text-lg">{votingInfo.totalWeight}</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <p className="text-sm text-purple-600 mb-1">Votes Cast</p>
                    <p className="font-bold text-purple-900 text-lg">{votingInfo.votedCount}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Voting Status</h3>
              {voterInfo ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Registration Status</p>
                        <p className={`font-medium ${voterInfo.isRegistered ? 'text-green-600' : 'text-red-600'}`}>
                          {voterInfo.isRegistered ? '✅ Registered' : '❌ Not Registered'}
                        </p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${voterInfo.isRegistered ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Your Voting Weight</p>
                    <p className="font-bold text-2xl text-gray-900">{voterInfo.weight}</p>
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min((voterInfo.weight / 20) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Voting Status</p>
                        <p className={`font-medium ${voterInfo.hasVoted ? 'text-blue-600' : 'text-gray-600'}`}>
                          {voterInfo.hasVoted ? '✅ Vote Cast' : '🗳️ Ready to Vote'}
                        </p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${voterInfo.hasVoted ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <div className="spinner"></div>
                  <span className="ml-2 text-gray-600">Loading voter info...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Voting Actions Card */}
        <div className="card">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-4">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Voting Actions</h2>
          </div>
          
          <div className="space-y-6">
            {!voterInfo?.isRegistered && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Join the Voting Process</h3>
                    <p className="text-gray-600 mb-4">
                      Register as a voter to participate in encrypted voting. You'll receive a voting weight 
                      based on your stake in the system.
                    </p>
                    <button
                      onClick={handleRegister}
                      className="btn-primary"
                    >
                      <span>Register as Voter</span>
                      <span className="ml-2 text-sm opacity-80">(Weight: 10)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {voterInfo?.isRegistered && !voterInfo.hasVoted && votingInfo?.status === 1 && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200 mb-6">
                <div className="flex items-start mb-6">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Cast Your Secret Vote</h3>
                    <p className="text-gray-600">
                      Your vote will be encrypted using FHE technology. No one can see your choice, 
                      but the voting process is fully transparent and verifiable.
                    </p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  {[
                    { value: 0, label: 'Yes ✅', color: 'from-green-500 to-emerald-600', icon: '👍' },
                    { value: 1, label: 'No ❌', color: 'from-red-500 to-rose-600', icon: '👎' },
                    { value: 2, label: 'Abstain 🤔', color: 'from-gray-500 to-slate-600', icon: '🤷' },
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
                        <div className="text-3xl mb-3">{option.icon}</div>
                        <div className="text-lg font-medium mb-2">{option.label}</div>
                        <div className="text-xs opacity-75">
                          {selectedVote === option.value ? 'Selected' : 'Click to choose'}
                        </div>
                        {selectedVote === option.value && (
                          <div className="mt-3">
                            <div className="inline-flex items-center px-2 py-1 bg-white/20 rounded-full text-xs">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              FHE Encrypted
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={handleVote}
                  disabled={isVoting || selectedVote === undefined}
                  className="btn-primary disabled:opacity-50 w-full"
                >
                  {isVoting ? (
                    <span className="flex items-center justify-center">
                      <div className="spinner mr-2"></div>
                      Encrypting and casting your vote...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Cast Encrypted Vote
                    </span>
                  )}
                </button>
              </div>
            )}

            {voterInfo?.hasVoted && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">Vote Successfully Cast!</h3>
                    <p className="text-green-700">
                      Your encrypted vote has been recorded. Your choice remains completely private 
                      and will only be revealed when voting ends.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {votingInfo?.status === 1 && (
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-orange-900 mb-1">Voting in Progress</h3>
                    <p className="text-orange-700 text-sm">
                      Voting will end automatically at {formatTime(votingInfo.endTime)}
                    </p>
                  </div>
                  <button
                    onClick={handleEndVoting}
                    disabled={isEndingVoting}
                    className="btn-secondary disabled:opacity-50"
                  >
                    {isEndingVoting ? (
                      <span className="flex items-center">
                        <div className="spinner mr-2"></div>
                        Ending...
                      </span>
                    ) : 'End Voting Early'}
                  </button>
                </div>
              </div>
            )}

            {votingInfo?.status === 2 && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-purple-900 mb-1">Voting Ended</h3>
                    <p className="text-purple-700 text-sm">
                      Time to reveal the encrypted results and see the final tally.
                    </p>
                  </div>
                  <button
                    onClick={handleRevealResults}
                    disabled={isRevealingResults}
                    className="btn-primary disabled:opacity-50"
                  >
                    {isRevealingResults ? (
                      <span className="flex items-center">
                        <div className="spinner mr-2"></div>
                        Decrypting Results...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Reveal Results
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {results && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
            <div className="text-center mb-6">
              <div className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium mb-4">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                VOTING RESULTS REVEALED
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Final Voting Results</h3>
              <p className="text-gray-600">
                Decrypted using FHE technology. Individual votes remain encrypted.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="text-center group">
                <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl p-6 text-white shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <div className="text-4xl font-bold mb-2">{results.yes}</div>
                  <div className="text-green-100 font-medium">Yes Votes</div>
                  <div className="mt-3 bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${(results.yes / (results.yes + results.no + results.abstain)) * 100 || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="text-center group">
                <div className="bg-gradient-to-br from-red-400 to-rose-500 rounded-2xl p-6 text-white shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <div className="text-4xl font-bold mb-2">{results.no}</div>
                  <div className="text-red-100 font-medium">No Votes</div>
                  <div className="mt-3 bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${(results.no / (results.yes + results.no + results.abstain)) * 100 || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="text-center group">
                <div className="bg-gradient-to-br from-gray-400 to-slate-500 rounded-2xl p-6 text-white shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <div className="text-4xl font-bold mb-2">{results.abstain}</div>
                  <div className="text-gray-100 font-medium">Abstain</div>
                  <div className="mt-3 bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${(results.abstain / (results.yes + results.no + results.abstain)) * 100 || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-emerald-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-emerald-800 font-medium">
                  🎉 FHE Technology Success! Results are now publicly verifiable while individual votes remain encrypted.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}