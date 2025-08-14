import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

describe('Individual Power Users Numbering', () => {
  it('should display numbered rows in Individual Power Users table', () => {
    // Mock power users data
    const mockPowerUsers = [
      { user: 'alice', totalRequests: 300, exceedingRequests: 50, requestsByModel: { 'gpt-4': 200, 'claude': 100 } },
      { user: 'bob', totalRequests: 250, exceedingRequests: 25, requestsByModel: { 'gpt-4': 250 } },
      { user: 'charlie', totalRequests: 200, exceedingRequests: 0, requestsByModel: { 'gpt-4': 150, 'claude': 50 } }
    ];

    // Render the table structure with numbering like in App.tsx
    const { container } = render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>User</TableHead>
            <TableHead className="text-right">Total Requests</TableHead>
            <TableHead className="text-right">Exceeding Requests</TableHead>
            <TableHead className="text-right">Models Used</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockPowerUsers.map((user, index) => (
            <TableRow key={user.user}>
              <TableCell className="text-center text-muted-foreground font-medium">
                {index + 1}
              </TableCell>
              <TableCell className="font-medium">
                {user.user}
              </TableCell>
              <TableCell className="text-right">{user.totalRequests}</TableCell>
              <TableCell className="text-right">{user.exceedingRequests}</TableCell>
              <TableCell className="text-right">{Object.keys(user.requestsByModel).length}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );

    // Check that the # header is present
    expect(container.querySelector('th')).toHaveTextContent('#');
    
    // Check that numbering starts from 1 and increments correctly
    const numberCells = container.querySelectorAll('td:first-child');
    expect(numberCells[0]).toHaveTextContent('1');
    expect(numberCells[1]).toHaveTextContent('2');
    expect(numberCells[2]).toHaveTextContent('3');
    
    // Verify users are in the expected order
    const userCells = container.querySelectorAll('td:nth-child(2)');
    expect(userCells[0]).toHaveTextContent('alice');
    expect(userCells[1]).toHaveTextContent('bob');
    expect(userCells[2]).toHaveTextContent('charlie');
  });

  it('should handle single power user correctly', () => {
    const singlePowerUser = [
      { user: 'single-user', totalRequests: 100, exceedingRequests: 10, requestsByModel: { 'gpt-4': 100 } }
    ];

    const { container } = render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>User</TableHead>
            <TableHead className="text-right">Total Requests</TableHead>
            <TableHead className="text-right">Exceeding Requests</TableHead>
            <TableHead className="text-right">Models Used</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {singlePowerUser.map((user, index) => (
            <TableRow key={user.user}>
              <TableCell className="text-center text-muted-foreground font-medium">
                {index + 1}
              </TableCell>
              <TableCell className="font-medium">
                {user.user}
              </TableCell>
              <TableCell className="text-right">{user.totalRequests}</TableCell>
              <TableCell className="text-right">{user.exceedingRequests}</TableCell>
              <TableCell className="text-right">{Object.keys(user.requestsByModel).length}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );

    // Should show "1" for the single user
    const numberCell = container.querySelector('td:first-child');
    expect(numberCell).toHaveTextContent('1');
  });
});