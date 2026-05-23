export const withInvitedBy = (invitedBy?: string) => ({
  ...(invitedBy && { invitedBy }),
});

export const withRemovedBy = (removedBy?: string) => ({
  ...(removedBy && { removedBy, isActive: false }),
});

export const withRoleUpdatedBy = (roleUpdatedBy?: string) => ({
  ...(roleUpdatedBy && { roleUpdatedBy }),
});
