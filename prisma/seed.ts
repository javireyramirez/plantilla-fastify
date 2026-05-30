import { PermissionAction, PermissionScope, RecordStatus } from '@prisma/client';
import dotenv from 'dotenv';
import { Scrypt } from 'oslo/password';

import { prisma } from '../src/config/prisma';

dotenv.config();

const scrypt = new Scrypt();

async function hashPassword(plain: string): Promise<string> {
  return scrypt.hash(plain);
}

const SYSTEM_MODULES = [
  {
    key: 'users',
    label: 'Usuarios',
    description: 'Gestión de usuarios',
    icon: 'users',
    sortOrder: 0,
  },
  {
    key: 'organizations',
    label: 'Organizaciones',
    description: 'Gestión de organizaciones',
    icon: 'building',
    sortOrder: 1,
  },
  {
    key: 'teams',
    label: 'Equipos',
    description: 'Gestión de equipos',
    icon: 'users-round',
    sortOrder: 2,
  },
  {
    key: 'roles',
    label: 'Roles',
    description: 'Gestión de roles y permisos',
    icon: 'shield',
    sortOrder: 3,
  },
  {
    key: 'companies',
    label: 'Empresas',
    description: 'Gestión de empresas / clientes',
    icon: 'briefcase',
    sortOrder: 4,
  },
  {
    key: 'documents',
    label: 'Documentos',
    description: 'Gestión de documentos',
    icon: 'file',
    sortOrder: 5,
  },
  {
    key: 'storage',
    label: 'Almacenamiento',
    description: 'Gestión de archivos',
    icon: 'hard-drive',
    sortOrder: 6,
  },
  {
    key: 'settings',
    label: 'Configuración',
    description: 'Configuración del sistema',
    icon: 'settings',
    sortOrder: 7,
  },
  {
    key: 'reports',
    label: 'Reportes',
    description: 'Generación de reportes',
    icon: 'bar-chart',
    sortOrder: 8,
  },
  {
    key: 'audit',
    label: 'Auditoría',
    description: 'Logs y auditoría',
    icon: 'activity',
    sortOrder: 9,
  },
] as const;

const ALL_ACTIONS: PermissionAction[] = [
  PermissionAction.READ,
  PermissionAction.CREATE,
  PermissionAction.UPDATE,
  PermissionAction.DELETE,
  PermissionAction.RESTORE,
  PermissionAction.EXPORT,
  PermissionAction.IMPORT,
  PermissionAction.SETTINGS,
];

const ROLES = [
  {
    name: 'Admin',
    slug: 'admin',
    description: 'Acceso completo dentro de su organización.',
    color: '#f97316',
    icon: 'shield-check',
    isSystem: true,
    permissions: {
      actions: ALL_ACTIONS,
      scope: PermissionScope.ORGANIZATION,
    },
  },
  {
    name: 'Editor',
    slug: 'editor',
    description: 'Puede crear y editar recursos de su organización.',
    color: '#3b82f6',
    icon: 'pencil',
    isSystem: true,
    permissions: {
      actions: [
        PermissionAction.READ,
        PermissionAction.CREATE,
        PermissionAction.UPDATE,
        PermissionAction.DELETE,
      ],
      scope: PermissionScope.ORGANIZATION,
    },
  },
  {
    name: 'Viewer',
    slug: 'viewer',
    description: 'Solo lectura sobre recursos de su organización.',
    color: '#6b7280',
    icon: 'eye',
    isSystem: true,
    permissions: {
      actions: [PermissionAction.READ],
      scope: PermissionScope.ORGANIZATION,
    },
  },
] as const;

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const orgName = process.env.SEED_ORG_NAME;
  const orgSlug = process.env.SEED_ORG_SLUG;

  const TEST_USERS = [
    {
      email: process.env.SEED_USER_ADMIN_EMAIL,
      name: 'Admin User',
      password: process.env.SEED_USER_ADMIN_PASSWORD,
      roleSlug: 'admin',
      teamName: 'Admins',
    },
    {
      email: process.env.SEED_USER_EDITOR_EMAIL,
      name: 'Editor User',
      password: process.env.SEED_USER_EDITOR_PASSWORD,
      roleSlug: 'editor',
      teamName: 'Editors',
    },
    {
      email: process.env.SEED_USER_VIEWER_EMAIL,
      name: 'Viewer User',
      password: process.env.SEED_USER_VIEWER_PASSWORD,
      roleSlug: 'viewer',
      teamName: 'Viewers',
    },
  ] as const;

  if (!adminEmail || !adminPassword || !orgName || !orgSlug) {
    throw new Error('Faltan variables de entorno para el seed base (admin/org).');
  }

  for (const u of TEST_USERS) {
    if (!u.email || !u.password) {
      throw new Error(
        `Faltan variables de entorno para el usuario de prueba con rol "${u.roleSlug}".`,
      );
    }
  }

  console.log('\n🌱  Iniciando seed...\n');

  // ── 1. Módulos ──────────────────────────────────────────────────────────
  console.log('📦  Creando módulos del sistema...');

  const moduleMap: Record<string, string> = {};

  for (const mod of SYSTEM_MODULES) {
    const record = await prisma.module.upsert({
      where: { key: mod.key },
      update: {
        label: mod.label,
        description: mod.description,
        icon: mod.icon,
        sortOrder: mod.sortOrder,
        isActive: true,
      },
      create: {
        key: mod.key,
        label: mod.label,
        description: mod.description,
        icon: mod.icon,
        sortOrder: mod.sortOrder,
        isActive: true,
        isConfigurableByOrg: true,
        status: RecordStatus.ACTIVE,
      },
    });
    moduleMap[mod.key] = record.id;
  }

  console.log(`   ✔ módulos creados/actualizados: ${SYSTEM_MODULES.length}`);

  // ── 2. Roles y permisos ──────────────────────────────────────────────────
  console.log('\n🛡️   Creando roles del sistema...');

  const roleMap: Record<string, string> = {};
  let totalPerms = 0;

  for (const roleDef of ROLES) {
    const role = await prisma.role.upsert({
      where: { slug: roleDef.slug },
      update: { name: roleDef.name, description: roleDef.description },
      create: {
        name: roleDef.name,
        slug: roleDef.slug,
        description: roleDef.description,
        color: roleDef.color,
        icon: roleDef.icon,
        isSystem: roleDef.isSystem,
        status: RecordStatus.ACTIVE,
      },
    });
    roleMap[role.slug] = role.id;

    let permCount = 0;
    for (const moduleId of Object.values(moduleMap)) {
      for (const action of roleDef.permissions.actions) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_moduleId_action: { roleId: role.id, moduleId, action },
          },
          update: { scope: roleDef.permissions.scope },
          create: {
            roleId: role.id,
            moduleId,
            action,
            scope: roleDef.permissions.scope,
          },
        });
        permCount++;
        totalPerms++;
      }
    }
  }

  console.log(`   ✔ roles creados/actualizados: ${ROLES.length} (permisos totales: ${totalPerms})`);

  // ── 3. Superadmin ────────────────────────────────────────────────────────
  console.log('\n👑  Creando superadmin...');

  const hashedAdminPassword = await hashPassword(adminPassword);

  const superAdmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: 'Super Admin', isActive: true, isSuperAdmin: true },
    create: {
      email: adminEmail,
      name: 'Super Admin',
      emailVerified: true,
      isActive: true,
      isSystem: true,
      isSuperAdmin: true,
    },
  });

  await prisma.account.upsert({
    where: { providerId_accountId: { providerId: 'credential', accountId: adminEmail } },
    update: { password: hashedAdminPassword },
    create: {
      userId: superAdmin.id,
      providerId: 'credential',
      accountId: adminEmail,
      password: hashedAdminPassword,
    },
  });

  console.log('   ✔ superadmin creado/actualizado');

  // ── 4. Organización por defecto ──────────────────────────────────────────
  console.log('\n🏢  Creando organización por defecto...');

  const organization = await prisma.organization.upsert({
    where: { slug: orgSlug },
    update: { name: orgName },
    create: {
      name: orgName,
      slug: orgSlug,
      status: RecordStatus.ACTIVE,
      createdBy: superAdmin.id,
      updatedBy: superAdmin.id,
    },
  });

  console.log('   ✔ organización por defecto creada/actualizada');

  // ── 5. Teams por rol ─────────────────────────────────────────────────────
  console.log('\n👥  Creando teams...');

  const teamMap: Record<string, string> = {};

  const teamsToCreate = [
    { name: 'Admins', roleSlug: 'admin' },
    { name: 'Editors', roleSlug: 'editor' },
    { name: 'Viewers', roleSlug: 'viewer' },
  ];

  for (const teamDef of teamsToCreate) {
    const team = await prisma.team.upsert({
      where: { organizationId_name: { organizationId: organization.id, name: teamDef.name } },
      update: {},
      create: {
        organizationId: organization.id,
        name: teamDef.name,
        status: RecordStatus.ACTIVE,
        createdBy: superAdmin.id,
        updatedBy: superAdmin.id,
      },
    });
    teamMap[teamDef.name] = team.id;

    const roleId = roleMap[teamDef.roleSlug];
    await prisma.roleAssignment.upsert({
      where: {
        roleId_teamId_organizationId: {
          roleId,
          teamId: team.id,
          organizationId: organization.id,
        },
      },
      update: {},
      create: {
        roleId,
        teamId: team.id,
        organizationId: organization.id,
        assignedBy: superAdmin.id,
      },
    });
  }

  console.log(`   ✔ teams creados/actualizados: ${teamsToCreate.length}`);

  // ── 6. Usuarios de prueba ────────────────────────────────────────────────
  console.log('\n👤  Creando usuarios de prueba...');

  let createdUsers = 0;

  for (const userDef of TEST_USERS) {
    const hashedPassword = await hashPassword(userDef.password!);

    const user = await prisma.user.upsert({
      where: { email: userDef.email! },
      update: { name: userDef.name, isActive: true },
      create: {
        email: userDef.email!,
        name: userDef.name,
        emailVerified: true,
        isActive: true,
        isSuperAdmin: false,
      },
    });

    await prisma.account.upsert({
      where: { providerId_accountId: { providerId: 'credential', accountId: userDef.email! } },
      update: { password: hashedPassword },
      create: {
        userId: user.id,
        providerId: 'credential',
        accountId: userDef.email!,
        password: hashedPassword,
      },
    });

    const membership = await prisma.organizationMember.upsert({
      where: { userId_organizationId: { userId: user.id, organizationId: organization.id } },
      update: { isActive: true },
      create: {
        userId: user.id,
        organizationId: organization.id,
        isActive: true,
        isPrimary: true,
        invitedBy: superAdmin.id,
      },
    });

    const teamId = teamMap[userDef.teamName];
    await prisma.teamMember.upsert({
      where: { teamId_memberId: { teamId, memberId: membership.id } },
      update: {},
      create: {
        teamId,
        memberId: membership.id,
        invitedBy: superAdmin.id,
      },
    });

    createdUsers++;
  }

  console.log(`   ✔ usuarios de prueba creados/actualizados: ${createdUsers}`);

  // ── 7. Resumen ───────────────────────────────────────────────────────────
  console.log('\n✅  Seed completado.\n');
  console.log(
    '⚠️  Recuerda cambiar las contraseñas tras el primer login y no usar este seed en producción con datos reales.\n',
  );
}

main()
  .catch((e) => {
    console.error('❌  Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
