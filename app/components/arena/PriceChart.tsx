'use client'

import { useEffect, useRef } from 'react'
import { createChart, IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts'
import { useGameStore } from '@/store/gameStore'
import { Match } from '@/types/arena'

interface PriceChartProps {
  match: Match
  height?: number
}

export function PriceChart({ match, height = 400 }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const startPriceLineRef = useRef<any>(null)
  const higherAreaRef = useRef<ISeriesApi<'Area'> | null>(null)
  const lowerAreaRef = useRef<ISeriesApi<'Area'> | null>(null)

  const priceHistory = useGameStore((s) => s.priceHistory)
  const currentPrice = useGameStore((s) => s.currentPrice)

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { color: '#0a0a0a' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#374151',
      },
      timeScale: {
        borderColor: '#374151',
        timeVisible: true,
        secondsVisible: true,
      },
    })

    chartRef.current = chart

    // Create candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    })

    candleSeriesRef.current = candleSeries

    // Add starting price line
    const startPrice = Number(match.startingPrice)
    startPriceLineRef.current = candleSeries.createPriceLine({
      price: startPrice,
      color: '#8b5cf6',
      lineWidth: 2,
      lineStyle: 2, // Dashed
      axisLabelVisible: true,
      title: 'Start Price',
    })

    // Handle resize
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [match.startingPrice, height])

  // Update chart data when price history changes
  useEffect(() => {
    if (!candleSeriesRef.current || priceHistory.length === 0) return

    const chartData = priceHistory.map((point) => ({
      time: Math.floor(point.time) as UTCTimestamp,
      open: point.open,
      high: point.high,
      low: point.low,
      close: point.close,
    }))

    candleSeriesRef.current.setData(chartData)

    // Auto-scroll to latest
    if (chartRef.current) {
      chartRef.current.timeScale().scrollToRealTime()
    }
  }, [priceHistory])

  // Add prediction zones (higher/lower areas)
  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current) return

    const startPrice = Number(match.startingPrice)

    // Remove old zones if they exist
    if (higherAreaRef.current) {
      chartRef.current.removeSeries(higherAreaRef.current)
    }
    if (lowerAreaRef.current) {
      chartRef.current.removeSeries(lowerAreaRef.current)
    }

    // Higher zone (above start price)
    const higherArea = chartRef.current.addAreaSeries({
      topColor: 'rgba(16, 185, 129, 0.1)',
      bottomColor: 'rgba(16, 185, 129, 0.0)',
      lineColor: 'rgba(16, 185, 129, 0.3)',
      lineWidth: 1,
      priceLineVisible: false,
    })

    // Create data points for higher zone
    if (priceHistory.length > 0) {
      const higherZoneData = priceHistory.map((point) => ({
        time: Math.floor(point.time) as UTCTimestamp,
        value: Math.max(point.close, startPrice),
      }))
      higherArea.setData(higherZoneData)
    }

    higherAreaRef.current = higherArea

    // Lower zone (below start price)
    const lowerArea = chartRef.current.addAreaSeries({
      topColor: 'rgba(239, 68, 68, 0.1)',
      bottomColor: 'rgba(239, 68, 68, 0.0)',
      lineColor: 'rgba(239, 68, 68, 0.3)',
      lineWidth: 1,
      priceLineVisible: false,
    })

    // Create data points for lower zone
    if (priceHistory.length > 0) {
      const lowerZoneData = priceHistory.map((point) => ({
        time: Math.floor(point.time) as UTCTimestamp,
        value: Math.min(point.close, startPrice),
      }))
      lowerArea.setData(lowerZoneData)
    }

    lowerAreaRef.current = lowerArea

  }, [match.startingPrice, priceHistory])

  return (
    <div className="relative">
      <div ref={containerRef} className="rounded-lg overflow-hidden" />

      {/* Chart Legend */}
      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm border border-gray-700 rounded-lg p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full" />
          <span className="text-xs text-gray-300">
            Start: ${Number(match.startingPrice).toFixed(2)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span className="text-xs text-gray-300">Higher Zone</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          <span className="text-xs text-gray-300">Lower Zone</span>
        </div>

        <div className="pt-2 border-t border-gray-700">
          <div className="text-xs text-gray-400">Current</div>
          <div className="text-lg font-bold text-white">
            ${currentPrice.toFixed(2)}
          </div>
          <div className={`text-xs font-medium ${
            currentPrice > Number(match.startingPrice) ? 'text-green-400' : 'text-red-400'
          }`}>
            {currentPrice > Number(match.startingPrice) ? '▲' : '▼'}{' '}
            {(((currentPrice - Number(match.startingPrice)) / Number(match.startingPrice)) * 100).toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Chart Instructions */}
      <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm border border-gray-700 rounded-lg px-3 py-2">
        <div className="text-xs text-gray-400">
          <div>Scroll: Zoom</div>
          <div>Drag: Pan</div>
          <div>Double-click: Reset</div>
        </div>
      </div>
    </div>
  )
}

// Simple line chart variant (lighter weight)
export function SimplePriceChart({ match, height = 300 }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)

  const priceHistory = useGameStore((s) => s.priceHistory)
  const currentPrice = useGameStore((s) => s.currentPrice)

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { color: 'transparent' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: '#1f2937' },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        visible: false,
      },
    })

    chartRef.current = chart

    const lineSeries = chart.addLineSeries({
      color: '#8b5cf6',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    })

    lineSeriesRef.current = lineSeries

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [height])

  useEffect(() => {
    if (!lineSeriesRef.current || priceHistory.length === 0) return

    const chartData = priceHistory.map((point) => ({
      time: Math.floor(point.time) as UTCTimestamp,
      value: point.close,
    }))

    lineSeriesRef.current.setData(chartData)
  }, [priceHistory])

  return <div ref={containerRef} className="rounded-lg" />
}
