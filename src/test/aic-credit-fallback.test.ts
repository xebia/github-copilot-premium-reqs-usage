import { describe, it, expect } from 'vitest'
import {
  parseCSV,
  getAICData,
  getAICDataStatus,
  getEffectiveAICQuantity,
  getEffectiveAICGrossAmount,
  isAICreditRecord,
} from '@/lib/utils'

// Current GitHub AI usage export: aic_quantity / aic_gross_amount are literally 0 on
// every row, while the real consumption lives in quantity / gross_amount / net_amount.
const NEW_HEADERS =
  'date,username,product,sku,model,quantity,unit_type,applied_cost_per_quantity,gross_amount,discount_amount,net_amount,total_monthly_quota,organization,repository,cost_center_name,aic_quantity,aic_gross_amount,input,output,cache_read,cache_write'

const newRow = (date: string, user: string, quantity: string, gross: string, net = '0') =>
  `${date},${user},copilot,copilot_ai_credit,"Auto: Claude Haiku 4.5",${quantity},ai-credits,0.01,${gross},${gross},${net},1900,barcoemu,,Meeting Experience & weConnect,0,0,16,475,32507,32932`

describe('AI credit record detection', () => {
  it('detects records by sku and unit_type', () => {
    const data = parseCSV(`${NEW_HEADERS}\n${newRow('2026-09-01', 'nemo', '4.212603', '0.04212603')}`)
    expect(isAICreditRecord(data[0])).toBe(true)
  })

  it('does not flag records from the legacy export shape', () => {
    const csv =
      '"Timestamp","User","Model","Requests Used","Exceeds Monthly Quota","Total Monthly Quota"\n' +
      '"2025-06-11T05:13:27.8766440Z","alice","gpt-4.1","1","False","Unlimited"'
    const data = parseCSV(csv)
    expect(isAICreditRecord(data[0])).toBe(false)
  })
})

describe('AIC values derived from the current export format', () => {
  const data = parseCSV(
    `${NEW_HEADERS}\n${newRow('2026-09-01', 'nemo', '4.212603', '0.04212603')}\n${newRow('2026-09-02', 'nemo', '2', '0.02')}`
  )

  it('derives quantity from the quantity column when aic_quantity is zero', () => {
    expect(data[0].aicQuantity).toBe(0)
    expect(getEffectiveAICQuantity(data[0])).toBeCloseTo(4.212603)
  })

  it('derives cost from gross_amount when aic_gross_amount is zero', () => {
    expect(data[0].aicGrossAmount).toBe(0)
    expect(getEffectiveAICGrossAmount(data[0])).toBeCloseTo(0.04212603)
  })

  it('falls back to net_amount when gross_amount is absent', () => {
    const headers = 'date,username,sku,model,quantity,unit_type,net_amount,total_monthly_quota'
    const row = '2026-09-01,nemo,copilot_ai_credit,"Auto: Claude Haiku 4.5",3,ai-credits,0.5,1900'
    const [item] = parseCSV(`${headers}\n${row}`)
    expect(getEffectiveAICGrossAmount(item)).toBeCloseTo(0.5)
  })

  it('reports meaningful AIC data instead of an empty state', () => {
    const status = getAICDataStatus(data)
    expect(status.hasQuantityField).toBe(true)
    expect(status.hasAmountField).toBe(true)
    expect(status.hasQuantityData).toBe(true)
    expect(status.hasAmountData).toBe(true)
  })

  it('aggregates derived values by day', () => {
    const points = getAICData(data, 'day')
    expect(points).toHaveLength(2)
    expect(points[0].period).toBe('2026-09-01')
    expect(points[0].aicQuantity).toBeCloseTo(4.212603)
    expect(points[0].aicGrossAmount).toBeCloseTo(0.04212603)
    expect(points[1].aicQuantity).toBeCloseTo(2)
  })

  it('aggregates derived values by month', () => {
    const points = getAICData(data, 'month')
    expect(points).toHaveLength(1)
    expect(points[0].aicQuantity).toBeCloseTo(6.212603)
    expect(points[0].aicGrossAmount).toBeCloseTo(0.06212603)
  })
})

describe('backwards compatibility and genuine empty states', () => {
  const LEGACY_HEADERS =
    '"Timestamp","User","Model","Requests Used","Exceeds Monthly Quota","Total Monthly Quota","aic_quantity","aic_gross_amount"'

  it('still prefers explicit aic_* values when they are populated', () => {
    const row =
      '"2025-06-11T05:13:27.8766440Z","alice","gpt-4.1","1","False","Unlimited","5","0.0025"'
    const data = parseCSV(`${LEGACY_HEADERS}\n${row}`)
    expect(getEffectiveAICQuantity(data[0])).toBe(5)
    expect(getEffectiveAICGrossAmount(data[0])).toBeCloseTo(0.0025)
    expect(getAICData(data, 'day')[0].aicQuantity).toBe(5)
  })

  it('keeps the empty state when AI-credit rows have no consumption', () => {
    const data = parseCSV(`${NEW_HEADERS}\n${newRow('2026-09-01', 'nemo', '0', '0')}`)
    const status = getAICDataStatus(data)
    expect(status.hasQuantityField).toBe(true)
    expect(status.hasQuantityData).toBe(false)
    expect(status.hasAmountData).toBe(false)
  })

  it('does not derive AIC values for non AI-credit rows', () => {
    const headers = 'date,username,sku,model,quantity,unit_type,gross_amount,total_monthly_quota'
    const row = '2026-09-01,alice,copilot_premium_request,gpt-4.1,10,premium_requests,1.5,1900'
    const [item] = parseCSV(`${headers}\n${row}`)
    expect(getEffectiveAICQuantity(item)).toBeUndefined()
    expect(getEffectiveAICGrossAmount(item)).toBeUndefined()
    expect(getAICDataStatus([item]).hasQuantityField).toBe(false)
  })
})
