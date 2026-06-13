'use client'

import { useEffect, useRef } from 'react'

interface KnowledgeGraphMiniProps {
  data?: {
    nodes: Array<{ id: string; concept: string; subject: string; mastery_level: number; status: string }>
    edges: Array<{ id: string; source: string; target: string }>
    mastery_summary?: Record<string, number>
  }
}

const SUBJECT_COLORS: Record<string, string> = {
  biology: '#10b981',
  chemistry: '#a855f7',
  physics: '#3b82f6',
  mathematics: '#f59e0b',
  engineering: '#ef4444',
  environmental: '#22a066',
  general: '#8a5c06',
}

const DEMO_NODES = [
  { id: '1', concept: 'Ecosystems', subject: 'environmental', x: 0.5, y: 0.4, mastery: 0.9 },
  { id: '2', concept: 'Food Chain', subject: 'biology', x: 0.2, y: 0.25, mastery: 0.7 },
  { id: '3', concept: 'Human Impact', subject: 'environmental', x: 0.8, y: 0.25, mastery: 0.6 },
  { id: '4', concept: 'Pollution', subject: 'environmental', x: 0.15, y: 0.65, mastery: 0.5 },
  { id: '5', concept: 'Water Quality', subject: 'chemistry', x: 0.85, y: 0.65, mastery: 0.8 },
  { id: '6', concept: 'pH & Acidity', subject: 'chemistry', x: 0.5, y: 0.82, mastery: 0.65 },
]

const DEMO_EDGES = [
  { s: '1', t: '2' }, { s: '1', t: '3' }, { s: '1', t: '4' },
  { s: '1', t: '5' }, { s: '4', t: '6' }, { s: '5', t: '6' },
]

export default function KnowledgeGraphMini({ data }: KnowledgeGraphMiniProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)

    const nodes = DEMO_NODES
    const edges = DEMO_EDGES

    edges.forEach(({ s, t }) => {
      const src = nodes.find((n) => n.id === s)
      const tgt = nodes.find((n) => n.id === t)
      if (!src || !tgt) return
      ctx.beginPath()
      ctx.moveTo(src.x * W, src.y * H)
      ctx.lineTo(tgt.x * W, tgt.y * H)
      ctx.strokeStyle = 'rgba(138,92,6,0.4)'
      ctx.lineWidth = 1
      ctx.stroke()
    })

    nodes.forEach((n) => {
      const x = n.x * W
      const y = n.y * H
      const r = n.id === '1' ? 22 : 14
      const color = SUBJECT_COLORS[n.subject] || '#8a5c06'

      const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 1.5)
      grad.addColorStop(0, `${color}44`)
      grad.addColorStop(1, 'transparent')
      ctx.beginPath()
      ctx.arc(x, y, r * 1.5, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()

      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = `${color}33`
      ctx.fill()
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.fillStyle = '#f5e6c8'
      ctx.font = `${n.id === '1' ? 9 : 8}px Inter, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const words = n.concept.split(' ')
      if (words.length === 1) {
        ctx.fillText(n.concept, x, y)
      } else {
        ctx.fillText(words[0], x, y - 5)
        ctx.fillText(words.slice(1).join(' '), x, y + 5)
      }
    })
  }, [data])

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={200}
      className="w-full h-full"
      style={{ display: 'block' }}
    />
  )
}
