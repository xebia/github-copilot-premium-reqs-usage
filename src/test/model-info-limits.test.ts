import { describe, it, expect } from 'vitest';
import { 
  getModelUsageSummary, 
  CopilotUsageData, 
  COPILOT_PLANS, 
  PLAN_MONTHLY_LIMITS,
  MODEL_MULTIPLIERS,
  DEFAULT_MODELS,
  EXCESS_REQUEST_COST
} from '../lib/utils';

describe('Model Info and Limits Feature', () => {
  const mockData: CopilotUsageData[] = [
    {
      timestamp: new Date('2025-01-01T10:00:00Z'),
      user: 'user1',
      model: 'gpt-4o-2024-11-20',
      requestsUsed: 100,
      exceedsQuota: false,
      totalMonthlyQuota: '500'
    },
    {
      timestamp: new Date('2025-01-01T11:00:00Z'),
      user: 'user2',
      model: 'gpt-4.1-2025-04-14',
      requestsUsed: 50,
      exceedsQuota: true,
      totalMonthlyQuota: '500'
    },
    {
      timestamp: new Date('2025-01-01T12:00:00Z'),
      user: 'user3',
      model: 'gpt-4.1-vision',
      requestsUsed: 25,
      exceedsQuota: false,
      totalMonthlyQuota: '500'
    },
    {
      timestamp: new Date('2025-01-01T13:00:00Z'),
      user: 'user4',
      model: 'o3-mini-2025-01-31',
      requestsUsed: 10,
      exceedsQuota: true,
      totalMonthlyQuota: '500'
    }
  ];

  it('should calculate plan limits based on model multipliers', () => {
    const result = getModelUsageSummary(mockData);
    
    const defaultGroup = result.find(item => item.model === 'Default (GPT-4o, GPT-4.1)');
    expect(defaultGroup).toBeDefined();
    
    if (defaultGroup) {
      expect(defaultGroup.multiplier).toBe(0);
      expect(defaultGroup.individualPlanLimit).toBe(50); // Constant plan limit, not Infinity
      expect(defaultGroup.businessPlanLimit).toBe(300); // Constant plan limit, not Infinity
      expect(defaultGroup.enterprisePlanLimit).toBe(1000); // Constant plan limit, not Infinity
    }
  });

  it('should group default models (GPT-4o and GPT-4.1) together', () => {
    const result = getModelUsageSummary(mockData);
    
    const defaultGroup = result.find(item => item.model === 'Default (GPT-4o, GPT-4.1)');
    expect(defaultGroup).toBeDefined();
    
    if (defaultGroup) {
      // Should combine requests from both gpt-4o-2024-11-20 (100) and gpt-4.1-2025-04-14 (50)
      expect(defaultGroup.totalRequests).toBe(150);
      expect(defaultGroup.compliantRequests).toBe(100);
      expect(defaultGroup.exceedingRequests).toBe(50);
    }
    
    // Should not have individual entries for default models
    const gpt4oEntry = result.find(item => item.model === 'gpt-4o-2024-11-20');
    const gpt41Entry = result.find(item => item.model === 'gpt-4.1-2025-04-14');
    expect(gpt4oEntry).toBeUndefined();
    expect(gpt41Entry).toBeUndefined();
  });

  it('should keep non-default models separate', () => {
    const result = getModelUsageSummary(mockData);
    
    const visionModel = result.find(item => item.model === 'gpt-4.1-vision');
    expect(visionModel).toBeDefined();
    expect(visionModel?.totalRequests).toBe(25);
    
    const o3Model = result.find(item => item.model === 'o3-mini-2025-01-31');
    expect(o3Model).toBeDefined();
    expect(o3Model?.totalRequests).toBe(10);
  });

  it('should calculate excess costs correctly', () => {
    const result = getModelUsageSummary(mockData);
    
    const defaultGroup = result.find(item => item.model === 'Default (GPT-4o, GPT-4.1)');
    expect(defaultGroup).toBeDefined();
    
    if (defaultGroup) {
      // 50 exceeding requests * 0x multiplier * $0.04 = $0.00
      expect(defaultGroup.excessCost).toBe(50 * 0 * EXCESS_REQUEST_COST);
    }
    
    const o3Model = result.find(item => item.model === 'o3-mini-2025-01-31');
    if (o3Model) {
      // 10 exceeding requests * 0.33x multiplier * $0.04 = $0.132
      expect(o3Model.excessCost).toBe(10 * 0.33 * EXCESS_REQUEST_COST);
    }
  });

  it('should include all required fields in ModelUsageSummary', () => {
    const result = getModelUsageSummary(mockData);
    
    expect(result.length).toBeGreaterThan(0);
    
    result.forEach(item => {
      expect(item).toHaveProperty('model');
      expect(item).toHaveProperty('displayName');
      expect(item).toHaveProperty('totalRequests');
      expect(item).toHaveProperty('compliantRequests');
      expect(item).toHaveProperty('exceedingRequests');
      expect(item).toHaveProperty('multiplier');
      expect(item).toHaveProperty('individualPlanLimit');
      expect(item).toHaveProperty('businessPlanLimit');
      expect(item).toHaveProperty('enterprisePlanLimit');
      expect(item).toHaveProperty('excessCost');
      
      // Validate types
      expect(typeof item.model).toBe('string');
      expect(typeof item.displayName).toBe('string');
      expect(typeof item.totalRequests).toBe('number');
      expect(typeof item.compliantRequests).toBe('number');
      expect(typeof item.exceedingRequests).toBe('number');
      expect(typeof item.multiplier).toBe('number');
      expect(typeof item.individualPlanLimit).toBe('number');
      expect(typeof item.businessPlanLimit).toBe('number');
      expect(typeof item.enterprisePlanLimit).toBe('number');
      expect(typeof item.excessCost).toBe('number');
    });
  });

  it('should handle unknown models with default multiplier', () => {
    const unknownModelData: CopilotUsageData[] = [
      {
        timestamp: new Date('2025-01-01T10:00:00Z'),
        user: 'user1',
        model: 'unknown-model-2025',
        requestsUsed: 20,
        exceedsQuota: false,
        totalMonthlyQuota: '500'
      }
    ];

    const result = getModelUsageSummary(unknownModelData);
    
    expect(result).toHaveLength(1);
    expect(result[0].model).toBe('unknown-model-2025');
    expect(result[0].multiplier).toBe(1); // Default multiplier
    expect(result[0].individualPlanLimit).toBe(50); // 50 / 1
    expect(result[0].businessPlanLimit).toBe(300); // 300 / 1
  });

  it('should sort results by total requests descending', () => {
    const result = getModelUsageSummary(mockData);
    
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].totalRequests).toBeGreaterThanOrEqual(result[i + 1].totalRequests);
    }
  });
});