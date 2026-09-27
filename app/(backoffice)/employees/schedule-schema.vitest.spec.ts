import { describe, expect, it } from 'vitest';
import { scheduleSchema } from './schedule-form';

describe('scheduleSchema', () => {
  const base = {
    employeeId: 'e1',
    scheduleDate: '2026-09-28',
    startTime: '09:00',
    endTime: '17:00',
    notes: '',
  };

  it('accepts a valid schedule', () => {
    expect(scheduleSchema.safeParse(base).success).toBe(true);
  });

  it('requires an employee', () => {
    expect(
      scheduleSchema.safeParse({ ...base, employeeId: '' }).success,
    ).toBe(false);
  });

  it('rejects a malformed time', () => {
    expect(
      scheduleSchema.safeParse({ ...base, startTime: '9:00' }).success,
    ).toBe(false);
    expect(
      scheduleSchema.safeParse({ ...base, endTime: '25:00' }).success,
    ).toBe(false);
  });

  it('requires start before end', () => {
    expect(
      scheduleSchema.safeParse({ ...base, startTime: '17:00', endTime: '09:00' })
        .success,
    ).toBe(false);
  });
});
