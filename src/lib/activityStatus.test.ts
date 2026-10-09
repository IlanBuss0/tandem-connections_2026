import { describe, expect, it } from 'vitest';
import { isCompletedActivityStatus, isPendingActivity } from './activityStatus';

describe('activity status normalization', () => {
  it.each(['Completada', 'completed', 'done', 'finished', 'Finalizada', 'realizada', 'terminada'])(
    'recognizes %s as completed',
    status => expect(isCompletedActivityStatus(status)).toBe(true),
  );

  it.each(['Pendiente', 'pending', 'por_hacer', 'todo'])(
    'keeps %s as pending',
    status => expect(isPendingActivity({ status, completed: false })).toBe(true),
  );

  it('never keeps a completed activity even if its label still says pending', () => {
    expect(isPendingActivity({ status: 'Pendiente', completed: true })).toBe(false);
  });

  it.each(['Completada', 'done', 'finished', 'En progreso'])(
    'does not include %s in Próximas acciones',
    status => expect(isPendingActivity({ status, completed: false })).toBe(false),
  );
});
