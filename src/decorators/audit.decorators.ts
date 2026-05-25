// ==========================================
// ENTIDADES DE NEGOCIO
// ==========================================
export const withCreatedBy = (userId?: string, ownerId?: string) => ({
  ...(userId && {
    createdBy: userId,
    updatedBy: userId,
    ownerId: ownerId ?? userId,
    ownerTeamId: null,
    ownerOrganizationId: null,
  }),
  updatedAt: new Date(),
});

export const withUpdatedBy = (userId?: string) => ({
  updatedAt: new Date(),
  ...(userId && { updatedBy: userId }),
});

export const withDeletedBy = (userId?: string) => ({
  deletedAt: new Date(),
  status: 'TRASHED',
  ...(userId && { deletedBy: userId }),
});

export const withRestoredBy = (userId?: string) => ({
  restoreAt: new Date(),
  deletedAt: null,
  status: 'ACTIVE',
  ...(userId && { restoreBy: userId }),
});

export const active = () => ({
  status: 'ACTIVE',
  deletedAt: null,
});

export const auditWhere = (extra?: object) => ({
  ...active(),
  ...extra,
});

// ==========================================
// MEMBRESÍA (invitedBy, removedBy)
// ==========================================

export const withInvitedBy = (invitedBy?: string) => ({
  ...(invitedBy && { invitedBy }),
});

// ==========================================
// PERMISOS (grantedBy)
// ==========================================

export const withGrantedBy = (grantedBy?: string) => ({
  updatedAt: new Date(),
  ...(grantedBy && { grantedBy }),
});
