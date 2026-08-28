import { describe, expect, it } from 'vitest';
import { professionalLocationFromPath, professionalPathFor } from './useProfessionalNavigation';

describe('professional navigation', () => {
  it('opens the patients list from its primary destination', () => {
    const path = professionalPathFor('patients');
    expect(path).toBe('/professional/pacientes');
    expect(professionalLocationFromPath(path)).toEqual({ tab: 'patients', patientId: null });
  });

  it('supports direct patients URLs with or without a trailing slash', () => {
    expect(professionalLocationFromPath('/professional/pacientes/')).toEqual({ tab: 'patients', patientId: null });
    expect(professionalLocationFromPath('/professional/pacientes/paciente%201')).toEqual({ tab: 'patients', patientId: 'paciente 1' });
  });

  it('keeps patient subsections under their nested routes', () => {
    expect(professionalLocationFromPath('/professional/pacientes/actividad-reciente')).toEqual({ tab: 'recentActivity', patientId: null });
    expect(professionalLocationFromPath('/professional/pacientes/estado-emocional')).toEqual({ tab: 'emotionalStatus', patientId: null });
  });

  it('maps legacy patient-section URLs without redirect loops', () => {
    expect(professionalLocationFromPath('/professional/actividad-reciente').tab).toBe('recentActivity');
    expect(professionalPathFor('recentActivity')).toBe('/professional/pacientes/actividad-reciente');
  });
});
