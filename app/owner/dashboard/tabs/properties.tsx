'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Property } from '../page'

type Props = {
  properties: Property[]
  onAddProperty?: (property: { name: string; address: string; bedrooms: number }) => Promise<boolean>
}

export default function PropertiesTab({ properties, onAddProperty }: Props) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [newProperty, setNewProperty] = useState({
    name: '',
    address: '',
    bedrooms: 2,
  })

  const handleAdd = async () => {
    if (onAddProperty) {
      const success = await onAddProperty(newProperty)
      if (success) {
        setShowAddModal(false)
        setNewProperty({ name: '', address: '', bedrooms: 2 })
      }
    } else {
      setShowAddModal(false)
      setNewProperty({ name: '', address: '', bedrooms: 2 })
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Your villas</h2>
          <p className="text-sm text-[#6B6B6B]">{properties.length} propert{properties.length !== 1 ? 'ies' : 'y'}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#1A1A1A] text-white px-4 py-2 rounded-lg text-sm font-medium active:scale-[0.98] transition-all"
        >
          + Add villa
        </button>
      </div>

      {properties.length === 0 ? (
        <div className="bg-[#F5F5F3] rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">🏡</div>
          <p className="text-[#6B6B6B] mb-2">No properties yet</p>
          <p className="text-sm text-[#9B9B9B]">Add your first villa to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map((property) => (
            <div key={property.id} className="bg-white rounded-2xl border border-[#EBEBEB] overflow-hidden">
              {/* Property header */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-[#1A1A1A]">{property.name}</h3>
                    <p className="text-sm text-[#6B6B6B]">{property.bedrooms} bedrooms</p>
                  </div>
                  <button className="text-[#6B6B6B] text-sm">Edit</button>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                  <span>📍</span>
                  <span>{property.address}</span>
                </div>
              </div>

              {/* Saved cleaner */}
              <div className="px-4 py-3 bg-[#F5F5F3] border-t border-[#EBEBEB]">
                {property.savedCleaner ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                        <span>👤</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1A1A1A]">{property.savedCleaner.name}</p>
                        <p className="text-xs text-[#6B6B6B]">Your cleaner</p>
                      </div>
                    </div>
                    <Link
                      href={`/${property.savedCleaner.slug}`}
                      className="bg-white text-[#1A1A1A] px-4 py-2 rounded-lg text-sm font-medium border border-[#DEDEDE] active:scale-[0.98] transition-all"
                    >
                      Book
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[#6B6B6B]">No cleaner assigned</p>
                    <Link
                      href="/"
                      className="bg-[#1A1A1A] text-white px-4 py-2 rounded-lg text-sm font-medium active:scale-[0.98] transition-all"
                    >
                      Find cleaner
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Property Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 pb-safe">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Add villa</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-[#F5F5F3] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Property name
                </label>
                <input
                  type="text"
                  value={newProperty.name}
                  onChange={(e) => setNewProperty({ ...newProperty, name: e.target.value })}
                  placeholder="e.g. Beach House"
                  className="w-full px-4 py-3.5 rounded-xl border border-[#DEDEDE] text-base focus:outline-none focus:border-[#1A1A1A] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Address
                </label>
                <input
                  type="text"
                  value={newProperty.address}
                  onChange={(e) => setNewProperty({ ...newProperty, address: e.target.value })}
                  placeholder="Full address"
                  className="w-full px-4 py-3.5 rounded-xl border border-[#DEDEDE] text-base focus:outline-none focus:border-[#1A1A1A] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                  Bedrooms
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setNewProperty({ ...newProperty, bedrooms: Math.max(1, newProperty.bedrooms - 1) })}
                    className="w-12 h-12 rounded-xl border border-[#DEDEDE] bg-white flex items-center justify-center text-xl font-medium text-[#1A1A1A] active:bg-[#F5F5F3] transition-colors"
                  >
                    −
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-2xl font-semibold text-[#1A1A1A]">{newProperty.bedrooms}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewProperty({ ...newProperty, bedrooms: Math.min(10, newProperty.bedrooms + 1) })}
                    className="w-12 h-12 rounded-xl border border-[#DEDEDE] bg-white flex items-center justify-center text-xl font-medium text-[#1A1A1A] active:bg-[#F5F5F3] transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAdd}
                disabled={!newProperty.name || !newProperty.address}
                className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-medium text-base active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                Add villa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
