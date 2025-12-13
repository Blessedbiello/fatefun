'use client'

import { useState } from 'react'
import { useMatchTransactions } from '@/hooks/useMatchTransactions'
import { MARKETS } from '@/lib/anchor/setup'
import { PublicKey } from '@solana/web3.js'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

interface CreateMatchModalProps {
  onMatchCreated?: (matchAddress: string) => void
  onOpenChange?: (open: boolean) => void
}

export function CreateMatchModal({ onMatchCreated, onOpenChange }: CreateMatchModalProps) {
  const { createMatch, loading } = useMatchTransactions()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  const [formData, setFormData] = useState({
    market: 'SOL/USD',
    matchType: 'flashDuel' as 'flashDuel' | 'battleRoyale' | 'tournament',
    entryFee: '0.1',
    maxPlayers: '10',
    predictionMinutes: '5',
    durationMinutes: '10',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('[CreateMatch] Form submitted', formData)

    try {
      const predictionWindow = parseInt(formData.predictionMinutes) * 60
      const matchDuration = parseInt(formData.durationMinutes) * 60

      // Get market address
      const marketAddress = MARKETS[formData.market as keyof typeof MARKETS]

      console.log('[CreateMatch] Creating match with params:', {
        marketAddress: marketAddress.toString(),
        matchType: formData.matchType,
        entryFee: parseFloat(formData.entryFee),
        maxPlayers: parseInt(formData.maxPlayers),
        predictionWindow,
        matchDuration,
      })

      const result = await createMatch({
        marketAddress,
        matchType: formData.matchType,
        entryFee: parseFloat(formData.entryFee),
        maxPlayers: parseInt(formData.maxPlayers),
        predictionWindow,
        matchDuration,
      })

      console.log('[CreateMatch] Match created successfully:', result)

      toast({
        title: 'Match Created!',
        description: `Match ID: ${result.matchId.toString()}`,
      })

      alert(`Match created successfully! ID: ${result.matchId.toString()}`)

      setOpen(false)
      onMatchCreated?.(result.matchAddress.toString())

      // Reset form
      setFormData({
        market: 'SOL/USD',
        matchType: 'flashDuel',
        entryFee: '0.1',
        maxPlayers: '10',
        predictionMinutes: '5',
        durationMinutes: '10',
      })
    } catch (error: any) {
      console.error('[CreateMatch] Error:', error)

      toast({
        title: 'Failed to Create Match',
        description: error.message || 'Unknown error occurred',
        variant: 'destructive',
      })

      alert(`Error creating match: ${error.message || 'Unknown error'}`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600">
          Create New Match
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Match</DialogTitle>
          <DialogDescription>
            Set up a new price prediction match. Players will compete to predict price movements.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Market Selection */}
          <div className="space-y-2">
            <Label htmlFor="market">Market</Label>
            <Select
              value={formData.market}
              onValueChange={(value) => setFormData({ ...formData, market: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select market" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SOL/USD">SOL/USD</SelectItem>
                <SelectItem value="BTC/USD">BTC/USD</SelectItem>
                <SelectItem value="ETH/USD">ETH/USD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Match Type */}
          <div className="space-y-2">
            <Label htmlFor="matchType">Match Type</Label>
            <Select
              value={formData.matchType}
              onValueChange={(value: any) => setFormData({ ...formData, matchType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flashDuel">Flash Duel (Quick Match)</SelectItem>
                <SelectItem value="battleRoyale">Battle Royale</SelectItem>
                <SelectItem value="tournament">Tournament</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Entry Fee */}
          <div className="space-y-2">
            <Label htmlFor="entryFee">Entry Fee (SOL)</Label>
            <Input
              id="entryFee"
              type="number"
              step="0.01"
              min="0.01"
              max="100"
              value={formData.entryFee}
              onChange={(e) => setFormData({ ...formData, entryFee: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Between 0.01 and 100 SOL
            </p>
          </div>

          {/* Max Players */}
          <div className="space-y-2">
            <Label htmlFor="maxPlayers">Max Players (2-10)</Label>
            <Input
              id="maxPlayers"
              type="number"
              min="2"
              max="10"
              value={formData.maxPlayers}
              onChange={(e) => setFormData({ ...formData, maxPlayers: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Maximum 10 players allowed per match
            </p>
          </div>

          {/* Prediction Window */}
          <div className="space-y-2">
            <Label htmlFor="predictionMinutes">Prediction Window (minutes)</Label>
            <Input
              id="predictionMinutes"
              type="number"
              min="0.5"
              max="60"
              step="0.5"
              value={formData.predictionMinutes}
              onChange={(e) => setFormData({ ...formData, predictionMinutes: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              30 seconds to 60 minutes - How long players have to submit predictions
            </p>
          </div>

          {/* Match Duration */}
          <div className="space-y-2">
            <Label htmlFor="durationMinutes">Match Duration (minutes)</Label>
            <Input
              id="durationMinutes"
              type="number"
              min="1"
              max="1440"
              step="1"
              value={formData.durationMinutes}
              onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              1 to 1440 minutes (24 hours) - Total time until match resolves
            </p>
          </div>

          {/* Prize Pool Preview */}
          <div className="rounded-lg bg-muted p-4">
            <h4 className="font-semibold mb-2">Match Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entry Fee:</span>
                <span>{formData.entryFee} SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Prize Pool:</span>
                <span>{(parseFloat(formData.entryFee) * parseInt(formData.maxPlayers)).toFixed(2)} SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Protocol Fee (5%):</span>
                <span>{(parseFloat(formData.entryFee) * parseInt(formData.maxPlayers) * 0.05).toFixed(2)} SOL</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Match'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
