import { PermissionAction, PermissionScope } from '@prisma/client';

// ── Rol con sus permisos expandidos ──────────────────────────────
export type RoleWithPermissions = {
  id: string;
  name: string;
  slug: string;
  isSystem: boolean;
  permissions: {
    moduleId: string; // era "resource", mejor alineado con el schema
    action: PermissionAction;
    scope: PermissionScope;
  }[];
};

// ── Contexto de membresía (sin permisos resueltos) ───────────────
// Solo datos estructurales: quién es y dónde está
export type MemberContext = {
  id: string; // OrganizationMember.id
  userId: string;
  organizationId: string;
  isActive: boolean;
  teamIds: string[]; // puede estar en varios teams
};

// ── Permisos ya resueltos para un usuario en un contexto ─────────
// Se calcula aparte, no se mezcla con la membresía
export type ResolvedPermissions = {
  userId: string;
  organizationId: string;
  // "crm:READ:ORGANIZATION", "invoices:CREATE:OWN"
  grants: Set<string>;
};

// ── Helper para construir/verificar el string de permiso ─────────
export function buildPermissionKey(
  moduleId: string,
  action: PermissionAction,
  scope: PermissionScope,
): string {
  return `${moduleId}:${action}:${scope}`;
}

export function hasPermission(
  resolved: ResolvedPermissions,
  moduleId: string,
  action: PermissionAction,
  minScope: PermissionScope,
): boolean {
  const scopePrecedence: Record<PermissionScope, number> = {
    GLOBAL: 4,
    ORGANIZATION: 3,
    TEAM: 2,
    OWN: 1,
  };

  // Busca si tiene ese action en cualquier scope >= minScope
  return Array.from(resolved.grants).some((key) => {
    const [kModule, kAction, kScope] = key.split(':') as [
      string,
      PermissionAction,
      PermissionScope,
    ];
    return (
      kModule === moduleId &&
      kAction === action &&
      scopePrecedence[kScope] >= scopePrecedence[minScope]
    );
  });
}
