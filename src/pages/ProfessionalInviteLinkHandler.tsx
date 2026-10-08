import InviteAcceptance from '@/components/shared/InviteAcceptance';
import { joinProfessionalInviteByToken } from '@/data/api';

const notifyPermissionsUpdated = () => {
  window.dispatchEvent(new CustomEvent('permisos:updated', { detail: { source: 'professional-invite-link' } }));
};

export default function ProfessionalInviteLinkHandler({ token }: { token: string }) {
  return (
    <InviteAcceptance
      token={token}
      requiredRole="professional"
      accept={joinProfessionalInviteByToken}
      title="Vinculacion profesional"
      loadingMessage="Aceptando invitacion profesional..."
      wrongRoleMessage="Esta invitacion solo puede aceptarse desde una cuenta profesional."
      successMessage="El perteneciente fue vinculado correctamente."
      errorMessage="No se pudo aceptar la invitacion."
      afterAccept={notifyPermissionsUpdated}
    />
  );
}
