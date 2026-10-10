import InviteAcceptance from '@/components/shared/InviteAcceptance';
import { joinTutorInviteByToken } from '@/data/api';

export default function InviteLinkHandler({ token }: { token: string }) {
  return (
    <InviteAcceptance
      token={token}
      requiredRole="user"
      accept={joinTutorInviteByToken}
      title="Vinculacion de tutor"
      loadingMessage="Aceptando invitacion..."
      wrongRoleMessage="Esta invitacion solo puede aceptarse desde una cuenta de perteneciente."
      successMessage="El tutor fue vinculado correctamente."
      errorMessage="No se pudo aceptar la invitacion."
    />
  );
}
