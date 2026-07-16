import {
  GOOGLE_DOCS_MIME_TYPE,
  GOOGLE_FOLDER_MIME_TYPE,
  googleFetch,
} from "@/lib/googleAuth";
import type { ProfessionalSession } from "@/data/api";

const DRIVE_BASE = "https://www.googleapis.com/drive/v3/files";
const FILE_FIELDS =
  "id,name,mimeType,parents,webViewLink,modifiedTime,appProperties";

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  webViewLink?: string;
  modifiedTime?: string;
  appProperties?: Record<string, string>;
};

export function isFolder(file: DriveFile) {
  return file.mimeType === GOOGLE_FOLDER_MIME_TYPE;
}

export function isGoogleDoc(file: DriveFile) {
  return file.mimeType === GOOGLE_DOCS_MIME_TYPE;
}

async function driveList(token: string, params: Record<string, string>) {
  const files: DriveFile[] = [];
  let pageToken: string | undefined;
  do {
    const query = new URLSearchParams({
      fields: `nextPageToken,files(${FILE_FIELDS})`,
      pageSize: "1000",
      ...params,
      ...(pageToken ? { pageToken } : {}),
    });
    const response = await googleFetch(token, `${DRIVE_BASE}?${query}`);
    const payload = await response.json();
    files.push(...(payload.files || []));
    pageToken = payload.nextPageToken;
  } while (pageToken);
  return files;
}

/**
 * Con scope drive.file esto devuelve SOLO los archivos creados/abiertos por
 * Tándem — exactamente lo que el explorador debe mostrar. El árbol se arma
 * client-side: un archivo cuyo parent no es una carpeta visible cuelga de la
 * raíz (cubre docs vinculados vía Picker con parents no accesibles).
 */
export async function listAllFiles(token: string) {
  return driveList(token, { q: "trashed=false" });
}

export async function listChildren(token: string, folderId: string) {
  return driveList(token, {
    q: `'${folderId.replace(/'/g, "\\'")}' in parents and trashed=false`,
    orderBy: "modifiedTime desc",
  });
}

export async function getFile(token: string, fileId: string, fields = FILE_FIELDS) {
  const response = await googleFetch(
    token,
    `${DRIVE_BASE}/${encodeURIComponent(fileId)}?fields=${encodeURIComponent(fields)}`,
  );
  return (await response.json()) as DriveFile;
}

export async function createFolder(
  token: string,
  name: string,
  parentId?: string,
  appProperties?: Record<string, string>,
) {
  const response = await googleFetch(token, `${DRIVE_BASE}?fields=${encodeURIComponent(FILE_FIELDS)}`, {
    method: "POST",
    body: JSON.stringify({
      name,
      mimeType: GOOGLE_FOLDER_MIME_TYPE,
      ...(parentId ? { parents: [parentId] } : {}),
      ...(appProperties ? { appProperties } : {}),
    }),
  });
  return (await response.json()) as DriveFile;
}

export async function moveFile(
  token: string,
  fileId: string,
  newParentId: string,
  oldParentId?: string,
) {
  let removeParents = oldParentId;
  if (!removeParents) {
    const current = await getFile(token, fileId, "parents");
    removeParents = current.parents?.join(",");
  }
  const query = new URLSearchParams({
    addParents: newParentId,
    ...(removeParents ? { removeParents } : {}),
    fields: FILE_FIELDS,
  });
  const response = await googleFetch(
    token,
    `${DRIVE_BASE}/${encodeURIComponent(fileId)}?${query}`,
    { method: "PATCH", body: JSON.stringify({}) },
  );
  return (await response.json()) as DriveFile;
}

export async function renameFile(token: string, fileId: string, name: string) {
  const response = await googleFetch(
    token,
    `${DRIVE_BASE}/${encodeURIComponent(fileId)}?fields=${encodeURIComponent(FILE_FIELDS)}`,
    { method: "PATCH", body: JSON.stringify({ name }) },
  );
  return (await response.json()) as DriveFile;
}

export async function trashFile(token: string, fileId: string) {
  await googleFetch(token, `${DRIVE_BASE}/${encodeURIComponent(fileId)}`, {
    method: "PATCH",
    body: JSON.stringify({ trashed: true }),
  });
}

export async function setAppProperties(
  token: string,
  fileId: string,
  appProperties: Record<string, string>,
) {
  await googleFetch(token, `${DRIVE_BASE}/${encodeURIComponent(fileId)}`, {
    method: "PATCH",
    body: JSON.stringify({ appProperties }),
  });
}

async function findFolderByAppProperty(token: string, key: string, value: string) {
  const files = await driveList(token, {
    q: `mimeType='${GOOGLE_FOLDER_MIME_TYPE}' and appProperties has { key='${key}' and value='${value.replace(/'/g, "\\'")}' } and trashed=false`,
    pageSize: "1",
  });
  return files[0] || null;
}

function sessionFolderKey(session: ProfessionalSession): [string, string] {
  return session.recurrence_group_id
    ? ["tandemRecurrenceGroupId", session.recurrence_group_id]
    : ["tandemPacienteId", String(session.id_perteneciente)];
}

function sessionFolderName(session: ProfessionalSession, patientName?: string) {
  if (session.recurrence_group_id) {
    return `Sesiones · ${session.titulo || patientName || "Serie"}`;
  }
  return `Notas · ${patientName || session.titulo || `Paciente ${session.id_perteneciente}`}`;
}

/** Busca la carpeta de la serie/paciente; no la crea si no existe. */
export async function findSessionFolder(token: string, session: ProfessionalSession) {
  const [key, value] = sessionFolderKey(session);
  return findFolderByAppProperty(token, key, value);
}

/** Busca la carpeta de la serie/paciente y la crea si no existe. */
export async function resolveSessionFolder(
  token: string,
  session: ProfessionalSession,
  patientName?: string,
) {
  const existing = await findSessionFolder(token, session);
  if (existing) return existing;
  const [key, value] = sessionFolderKey(session);
  return createFolder(token, sessionFolderName(session, patientName), undefined, {
    [key]: value,
  });
}

/** Metadata que Tándem guarda en cada Doc de nota (evita tocar el backend). */
export function noteAppProperties(session: ProfessionalSession, templateId: string) {
  return {
    tandemTemplateId: templateId,
    tandemPacienteId: String(session.id_perteneciente),
    ...(session.recurrence_group_id
      ? { tandemRecurrenceGroupId: session.recurrence_group_id }
      : {}),
  };
}
