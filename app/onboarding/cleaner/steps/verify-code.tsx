'use client'

import { useState, useRef, KeyboardEvent, FormEvent } from 'react'

type Props = {
  phone: string
  onBack: () => void
  onNext: () => void
}

export default function VerifyCode({ phone, onBack, onNext }: Props) {
  const [code, setCode] = useState(['', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const fullCode = code.join('')

    if (fullCode.length !== 4) {
      setError('Please enter the 4-digit code')
      return
    }

    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          action: 'verify',
          code: fullCode,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Invalid verification code')
        return
      }

      onNext()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      const response = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          action: 'send',
        }),
      })

      if (response.ok) {
        setError('')
        setCode(['', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch {
      // Silently fail resend
    }
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-6 text-[#6B6B6B] text-sm flex items-center gap-1 active:opacity-70"
      >
        <span>&larr;</span> Back
      </button>

      <div className="text-center mb-8">
        <div className="text-4xl mb-4">&#128272;</div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-2">
          Enter verification code
        </h1>
        <p className="text-[#6B6B6B]">
          We sent a code to {phone}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center gap-3">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={el => { inputRefs.current[index] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-14 h-14 text-center text-2xl font-semibold rounded-xl border border-[#DEDEDE] focus:outline-none focus:border-[#1A1A1A] transition-colors"
              autoFocus={index === 0}
            />
          ))}
        </div>

        {error && (
          <p className="text-[#C75050] text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || code.some(d => !d)}
          className="w-full bg-[#1A1A1A] text-white py-3.5 rounded-xl font-medium text-base active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify'
          )}
        </button>
      </form>

      <p className="text-center text-[#6B6B6B] text-sm mt-6">
        Didn&apos;t receive the code?{' '}
        <button
          onClick={handleResend}
          className="text-[#1A1A1A] font-medium active:opacity-70"
        >
          Resend
        </button>
      </p>

      <p className="text-center text-[#9B9B9B] text-xs mt-2">
        For testing, use code: 1234
      </p>
    </div>
  )
}
