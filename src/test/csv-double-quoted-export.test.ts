import { describe, it, expect } from 'vitest';
import { parseCSV } from '@/lib/utils';

const HEADER = 'date,username,product,sku,model,quantity,unit_type,applied_cost_per_quantity,gross_amount,discount_amount,net_amount,total_monthly_quota,organization,repository,cost_center_name,aic_quantity,aic_gross_amount,input,output,cache_read,cache_write';
const ROW = '2026-08-01,samiran-patra_Barco,copilot,copilot_ai_credit,Auto: Claude Haiku 4.5,9.109908,ai-credits,0.01,0.09109908,0.09109908,0,1900,barcoemu,,Control Rooms,0,0,198,8209,223257,30122';

/** Wrap a line the way some GitHub billing exports do: the whole row inside one pair of quotes with the inner quotes doubled. */
function wrapLine(line: string): string {
  const quoted = line
    .split(',')
    .map((field, idx) => (idx === 0 ? field : `"${field}"`))
    .join(',');
  return `"${quoted.replace(/"/g, '""')}"`;
}

describe('parseCSV with double-quoted export format', () => {
  it('parses rows where every line is wrapped in an extra pair of quotes', () => {
    const csv = `${wrapLine(HEADER)}\n${wrapLine(ROW)}`;
    const result = parseCSV(csv);

    expect(result).toHaveLength(1);
    expect(result[0].user).toBe('samiran-patra_Barco');
    expect(result[0].model).toBe('Auto: Claude Haiku 4.5');
    expect(result[0].requestsUsed).toBeCloseTo(9.109908);
    expect(result[0].totalMonthlyQuota).toBe('1900');
    expect(result[0].costCenterName).toBe('Control Rooms');
  });

  it('parses a UTF-8 BOM prefixed CSV with CRLF line endings', () => {
    const csv = `\uFEFF"${HEADER.split(',').join('","')}"\r\n"${ROW.split(',').join('","')}"\r\n`;
    const result = parseCSV(csv);

    expect(result).toHaveLength(1);
    expect(result[0].user).toBe('samiran-patra_Barco');
    expect(result[0].organization).toBe('barcoemu');
  });

  it('keeps commas inside quoted fields intact', () => {
    const csv = [
      HEADER,
      '2026-08-01,"user,with,commas",copilot,copilot_ai_credit,"Auto: Claude, Haiku",1.5,ai-credits,0.01,0.015,0.015,0,1900,barcoemu,,"Center, One",0,0,1,2,3,4',
    ].join('\n');
    const result = parseCSV(csv);

    expect(result[0].user).toBe('user,with,commas');
    expect(result[0].model).toBe('Auto: Claude, Haiku');
    expect(result[0].costCenterName).toBe('Center, One');
  });
});
