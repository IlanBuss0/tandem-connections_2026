import { KeyRound } from 'lucide-react';
import AccountSecuritySettings, { AccountSessionSettings } from '@/components/account/AccountSecuritySettings';
import SettingsLayout, { SettingsFooter, SettingsSectionHeader } from '@/components/account/SettingsLayout';
import type { ProfessionalTab } from '@/components/professional/ProfessionalNavigation';

/**
 * Configuración del profesional: pantalla independiente de Mi perfil, con la
 * misma estructura de SettingsLayout que usan Perteneciente y Tutor.
 * Solo contiene preferencias y acciones de la cuenta (seguridad y sesión).
 */
export default function ProfessionalSettings({ onNavigate }: { onNavigate: (tab: ProfessionalTab) => void }) {
  return (
    <SettingsLayout
      categories={[{ id: 'account', label: 'Cuenta', description: 'Seguridad y acceso a tu cuenta profesional.', icon: KeyRound }]}
      active="account"
      onChange={() => {}}
      footer={<SettingsFooter onBack={() => onNavigate('profile')} />}
    >
      <div className="space-y-6">
        <SettingsSectionHeader icon={KeyRound} title="Cuenta" description="Seguridad y acceso a tu cuenta profesional." />
        <AccountSecuritySettings compact />
        <AccountSessionSettings />
      </div>
    </SettingsLayout>
  );
}
