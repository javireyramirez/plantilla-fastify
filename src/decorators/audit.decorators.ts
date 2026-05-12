export const withCreatedBy = (userId?: string) => ({
  ...(userId && {
    createdBy: userId,
    ownerId: userId,
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
