import { describe, expect, it } from 'vitest'
import {
  MAX_INPUT_LENGTH,
  MIN_INPUT_LENGTH,
  clampScore,
  classifyScore,
  evaluateRequestSchema,
  evaluationResultSchema,
} from '@/lib/evaluation'

describe('classifyScore', () => {
  it.each([
    [100, 'excellent', 'Excellent Match'],
    [85, 'excellent', 'Excellent Match'],
    [84, 'good', 'Good Match'],
    [70, 'good', 'Good Match'],
    [69, 'partial', 'Partial Match'],
    [50, 'partial', 'Partial Match'],
    [49, 'low', 'Low Match'],
    [0, 'low', 'Low Match'],
  ])('classifies %i as %s', (score, tier, label) => {
    expect(classifyScore(score)).toEqual({ tier, label })
  })
})

describe('clampScore', () => {
  it('keeps scores inside 0-100 and rounds them', () => {
    expect(clampScore(-20)).toBe(0)
    expect(clampScore(140)).toBe(100)
    expect(clampScore(72.6)).toBe(73)
    expect(clampScore(0)).toBe(0)
  })
})

describe('evaluateRequestSchema', () => {
  const valid = 'x'.repeat(MIN_INPUT_LENGTH)

  it('accepts inputs within the length limits', () => {
    expect(evaluateRequestSchema.safeParse({ jobDescription: valid, resume: valid }).success).toBe(true)
  })

  it('rejects inputs that are too short, including whitespace padding', () => {
    const padded = `   ${'x'.repeat(MIN_INPUT_LENGTH - 1)}   `
    expect(evaluateRequestSchema.safeParse({ jobDescription: padded, resume: valid }).success).toBe(false)
    expect(evaluateRequestSchema.safeParse({ jobDescription: valid, resume: 'short' }).success).toBe(false)
  })

  it('rejects inputs that are too long', () => {
    const tooLong = 'x'.repeat(MAX_INPUT_LENGTH + 1)
    expect(evaluateRequestSchema.safeParse({ jobDescription: tooLong, resume: valid }).success).toBe(false)
  })

  it('rejects missing or non-string fields', () => {
    expect(evaluateRequestSchema.safeParse({ jobDescription: valid }).success).toBe(false)
    expect(evaluateRequestSchema.safeParse({ jobDescription: 42, resume: valid }).success).toBe(false)
    expect(evaluateRequestSchema.safeParse(null).success).toBe(false)
  })
})

describe('evaluationResultSchema', () => {
  it('requires every field of the result', () => {
    const result = { score: 80, assessment: 'Good.', strengths: ['A'], areasToInvestigate: ['B'] }
    expect(evaluationResultSchema.safeParse(result).success).toBe(true)
    expect(evaluationResultSchema.safeParse({ score: 80 }).success).toBe(false)
  })
})
