'use client'

import { useState, FormEvent } from 'react'
import { OnboardingData } from '../page'

type Props = {
  selectedAreas: string[]
  onUpdate: (data: Partial<OnboardingData>) => void
  onBack: () => void
  onNext: () => void
}

const TOWNS = [
  { id: 'alicante', name: 'Alicante City', popular: true },
  { id: 'san-juan', name: 'San Juan', popular: true },
  { id: 'el-campello', name: 'El Campello', popular: true },
  { id: 'mutxamel', name: 'Mutxamel', popular: false },
  { id: 'san-vicente', name: 'San Vicente', popular: false },
  { id: 'jijona', name: 'Jijona', popular: false },
  { id: 'playa-san-juan', name: 'Playa de San Juan', popular: true },
]

export default function ServiceAreas({ selectedAreas, onUpdate, onBack, onNext }: Props) {
  const [selected, setSelected] = useState<string[]>(selectedAreas)

  const toggleArea = (id: string) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(a => a !== id)
        : [...prev, id]
    )
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (selected.length === 0) return

    onUpdate({ serviceAreas: selected })
    onNext()
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-6 text-[#6B6B6B] text-sm flex items-center gap-1 active:opacity-70"
      >
        <span>←</span> Back
      </button>

      <div className="text-center mb-8">
        <div className="text-4xl mb-4">📍</div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-2">
          Where do you work?
        </h1>
        <p className="text-[#6B6B6B]">
          Select the areas you can travel to
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          {TOWNS.map(town => (
            <button
              key={town.id}
              type="button"
              onClick={() => toggleArea(town.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all active:scale-[0.98] ${
                selected.includes(town.id)
                  ? 'border-[#1A1A1A] bg-[#F5F5F3]'
                  : 'border-[#EBEBEB] bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-medium ${
                  selected.includes(town.id) ? 'text-[#1A1A1A]' : 'text-[#6B6B6B]'
                }`}>
                  {town.name}
                </span>
                {selected.includes(town.id) && (
                  <span className="text-[#1A1A1A]">✓</span>
                )}
              </div>
              {town.popular && (
                <span className="text-xs text-[#C4785A] mt-1 block">Popular</span>
              )}
            </button>
          ))}
        </div>

        <p className="text-[#9B9B9B] text-xs text-center">
          {selected.length === 0
            ? 'Select at least one area'
            : `${selected.length} area${selected.length > 1 ? 's' : ''} selected`}
        </p>

        <button
          type="submit"
          disabled={selected.length === 0}
          className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-medium text-base active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
        >
          Continue
        </button>
      </form>
    </div>
  )
}
