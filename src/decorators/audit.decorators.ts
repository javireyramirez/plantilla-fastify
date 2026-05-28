// ==========================================
// ENTIDADES DE NEGOCIO
// ==========================================
export const withCreatedBy = (userId?: string) => ({
  ...(userId && { createdBy: userId, updatedBy: userId }),
  updatedAt: new Date(),
});

export const withOwnedCreate = (userId?: string, ownerId?: string) => ({
  ...withCreatedBy(userId),
  ...(userId && {
    ownerId: ownerId ?? userId,
    ownerTeamId: null,
    ownerOrganizationId: null,
  }),
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

export const withAssignedBy = (assignedBy?: string) => ({
  assignedAt: new Date(),
  ...(assignedBy && { assignedBy }),
});
