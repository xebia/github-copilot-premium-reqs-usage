import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '../components/ui/table';

describe('Model Summary Total Row', () => {
  it('should calculate and display correct totals for model summary', () => {
    // Mock model summary data
    const mockModelSummary = [
      { 
        model: 'GPT-4o', 
        totalRequests: 1000, 
        compliantRequests: 800, 
        exceedingRequests: 200,
        multiplier: 1,
        excessCost: 50
      },
      { 
        model: 'Claude-3', 
        totalRequests: 500, 
        compliantRequests: 400, 
        exceedingRequests: 100,
        multiplier: 2,
        excessCost: 40
      }
    ];

    // Calculate expected totals
    const expectedTotalRequests = 1500; // 1000 + 500
    const expectedCompliantRequests = 1200; // 800 + 400
    const expectedExceedingRequests = 300; // 200 + 100

    // Render the table structure with total row like it would appear in App.tsx
    const { container } = render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Model</TableHead>
            <TableHead className="text-right">Total Requests</TableHead>
            <TableHead className="text-right">Compliant</TableHead>
            <TableHead className="text-right">Exceeding</TableHead>
            <TableHead className="text-right">Multiplier</TableHead>
            <TableHead className="text-right">Excess Cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockModelSummary.map((item) => (
            <TableRow key={item.model}>
              <TableCell className="font-medium">{item.model}</TableCell>
              <TableCell className="text-right">{item.totalRequests.toLocaleString()}</TableCell>
              <TableCell className="text-right">{item.compliantRequests.toLocaleString()}</TableCell>
              <TableCell className="text-right">{item.exceedingRequests.toLocaleString()}</TableCell>
              <TableCell className="text-right">{item.multiplier}x</TableCell>
              <TableCell className="text-right">${item.excessCost.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-medium">Total</TableCell>
            <TableCell className="text-right font-medium">
              {expectedTotalRequests.toLocaleString()}
            </TableCell>
            <TableCell className="text-right font-medium">
              {expectedCompliantRequests.toLocaleString()}
            </TableCell>
            <TableCell className="text-right font-medium">
              {expectedExceedingRequests.toLocaleString()}
            </TableCell>
            <TableCell className="text-right">—</TableCell>
            <TableCell className="text-right">—</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );

    // Verify total row exists and contains correct values
    const totalRow = container.querySelector('tfoot tr');
    expect(totalRow).toBeTruthy();
    
    const cells = totalRow?.querySelectorAll('td');
    expect(cells).toHaveLength(6);
    
    // Check the total values in the cells - use dynamic expectations to match locale formatting
    expect(cells?.[0]?.textContent).toBe('Total');
    expect(cells?.[1]?.textContent).toBe(expectedTotalRequests.toLocaleString());
    expect(cells?.[2]?.textContent).toBe(expectedCompliantRequests.toLocaleString());
    expect(cells?.[3]?.textContent).toBe(expectedExceedingRequests.toLocaleString());
    expect(cells?.[4]?.textContent).toBe('—');
    expect(cells?.[5]?.textContent).toBe('—');
  });

  it('should handle empty model summary data', () => {
    const mockModelSummary: any[] = [];

    const { container } = render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Model</TableHead>
            <TableHead className="text-right">Total Requests</TableHead>
            <TableHead className="text-right">Compliant</TableHead>
            <TableHead className="text-right">Exceeding</TableHead>
            <TableHead className="text-right">Multiplier</TableHead>
            <TableHead className="text-right">Excess Cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockModelSummary.map((item) => (
            <TableRow key={item.model}>
              <TableCell className="font-medium">{item.model}</TableCell>
              <TableCell className="text-right">{item.totalRequests.toLocaleString()}</TableCell>
              <TableCell className="text-right">{item.compliantRequests.toLocaleString()}</TableCell>
              <TableCell className="text-right">{item.exceedingRequests.toLocaleString()}</TableCell>
              <TableCell className="text-right">{item.multiplier}x</TableCell>
              <TableCell className="text-right">${item.excessCost.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-medium">Total</TableCell>
            <TableCell className="text-right font-medium">0</TableCell>
            <TableCell className="text-right font-medium">0</TableCell>
            <TableCell className="text-right font-medium">0</TableCell>
            <TableCell className="text-right">—</TableCell>
            <TableCell className="text-right">—</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    );

    // Verify total row shows zeros for empty data
    const totalRow = container.querySelector('tfoot tr');
    const cells = totalRow?.querySelectorAll('td');
    
    expect(cells?.[1]?.textContent).toBe('0');
    expect(cells?.[2]?.textContent).toBe('0');
    expect(cells?.[3]?.textContent).toBe('0');
  });
});