'use client'

import { ProposalList } from '@/components/governance/proposal-list'
import { CreateProposal } from '@/components/governance/create-proposal'
import { GovernanceStats } from '@/components/governance/governance-stats'

export default function GovernancePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gradient">FATE Council</h1>
        <CreateProposal />
      </div>

      <GovernanceStats />

      <div className="mt-8">
        <ProposalList />
      </div>
    </div>
  )
}
