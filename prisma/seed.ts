/**
 * prisma/seed.ts
 *
 * Setup inicial: organización por defecto, usuario admin con rol SUPER_ADMIN
 * y permisos GLOBAL sobre todos los módulos.
 *
 * Variables de entorno requeridas:
 *   SEED_ADMIN_EMAIL      (default: admin@system.local)
 *   SEED_ADMIN_PASSWORD   (default: Adm1n#S3cur3!2025)
 *   SEED_ORG_NAME         (default: My Organization)
 *   SEED_ORG_SLUG         (default: my-org)
 */
import { PermissionAction, PermissionScope, PrismaClient, RecordStatus } from '@prisma/client';
import dotenv from 'dotenv';
import { Scrypt } from 'oslo/password';

import { prisma } from '../src/config/prisma';

dotenv.config();

/// <reference types="node" />

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Mismo hasher que usa better-auth internamente (oslo/password → Scrypt).
// Garantiza que el hash generado en el seed sea válido para el login normal.
const scrypt = new Scrypt();

async function hashPassword(plain: string): Promise<string> {
  return scrypt.hash(plain);
}

// ---------------------------------------------------------------------------
// Módulos del sistema
// Añade / quita según los módulos reales de tu aplicación.
// ---------------------------------------------------------------------------

const SYSTEM_MODULES = [
  {
    key: 'users',
    label: 'Usuarios',
    description: 'Gestión de usuarios del sistema',
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
    description: 'Gestión de documentos y archivos',
    icon: 'file',
    sortOrder: 5,
  },
  {
    key: 'storage',
    label: 'Almacenamiento',
    description: 'Gestión de almacenamiento de archivos',
    icon: 'hard-drive',
    sortOrder: 6,
  },
  {
    key: 'settings',
    label: 'Configuración',
    description: 'Configuración general del sistema',
    icon: 'settings',
    sortOrder: 7,
  },
  {
    key: 'reports',
    label: 'Reportes',
    description: 'Generación y visualización de reportes',
    icon: 'bar-chart',
    sortOrder: 8,
  },
  {
    key: 'audit',
    label: 'Auditoría',
    description: 'Logs y auditoría del sistema',
    icon: 'activity',
    sortOrder: 9,
  },
] as const;

// Todas las acciones del enum PermissionAction
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

// ---------------------------------------------------------------------------
// Roles predefinidos (además del SUPER_ADMIN)
// ---------------------------------------------------------------------------

const PRESET_ROLES = [
  {
    name: 'Super Admin',
    slug: 'super-admin',
    description: 'Acceso total al sistema. No modificar.',
    color: '#ef4444',
    icon: 'shield-alert',
    isSystem: true,
  },
  {
    name: 'Admin',
    slug: 'admin',
    description: 'Administrador de organización con acceso completo dentro de su org.',
    color: '#f97316',
    icon: 'shield-check',
    isSystem: true,
  },
  {
    name: 'Member',
    slug: 'member',
    description: 'Miembro estándar con acceso a sus propios recursos.',
    color: '#3b82f6',
    icon: 'user',
    isSystem: true,
  },
  {
    name: 'Viewer',
    slug: 'viewer',
    description: 'Solo lectura sobre recursos de su organización.',
    color: '#6b7280',
    icon: 'eye',
    isSystem: true,
  },
] as const;

// Permisos por rol (módulo: acciones permitidas → scope)
// Super Admin: todos los módulos, todas las acciones, scope GLOBAL → se genera dinámicamente
// Admin: todos los módulos, todas las acciones, scope ORGANIZATION
// Member: acceso limitado, scope OWN
// Viewer: solo READ, scope ORGANIZATION

type RolePermissionDef = {
  actions: PermissionAction[];
  scope: PermissionScope;
};

const ROLE_PERMISSIONS_BY_SLUG: Record<string, RolePermissionDef> = {
  admin: { actions: ALL_ACTIONS, scope: PermissionScope.ORGANIZATION },
  member: {
    actions: [
      PermissionAction.READ,
      PermissionAction.CREATE,
      PermissionAction.UPDATE,
      PermissionAction.DELETE,
    ],
    scope: PermissionScope.OWN,
  },
  viewer: { actions: [PermissionAction.READ], scope: PermissionScope.ORGANIZATION },
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@system.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Adm1n#S3cur3!2025';
  const orgName = process.env.SEED_ORG_NAME ?? 'My Organization';
  const orgSlug = process.env.SEED_ORG_SLUG ?? 'my-org';

  console.log('\n🌱  Iniciando seed...\n');

  // ── 1. Módulos ──────────────────────────────────────────────────────────
  console.log('📦  Creando módulos del sistema...');
  const moduleRecords: { id: string; key: string }[] = [];

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
        defaultPermissions: { read: true, create: false, update: false, delete: false },
      },
    });
    moduleRecords.push({ id: record.id, key: record.key });
    console.log(`   ✔ módulo "${record.key}" (${record.id})`);
  }

  // ── 2. Roles ─────────────────────────────────────────────────────────────
  console.log('\n🛡️   Creando roles del sistema...');
  const roleMap: Record<string, string> = {}; // slug → id

  for (const roleDef of PRESET_ROLES) {
    const role = await prisma.role.upsert({
      where: { slug: roleDef.slug },
      update: {
        name: roleDef.name,
        description: roleDef.description,
        color: roleDef.color,
        icon: roleDef.icon,
      },
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
    console.log(`   ✔ rol "${role.slug}" (${role.id})`);
  }

  // ── 3. Permisos por rol ──────────────────────────────────────────────────
  console.log('\n🔐  Asignando permisos a roles...');

  // Super Admin: GLOBAL en todo
  const superAdminId = roleMap['super-admin'];
  for (const mod of moduleRecords) {
    for (const action of ALL_ACTIONS) {
      await prisma.rolePermission.upsert({
        where: { roleId_moduleId_action: { roleId: superAdminId, moduleId: mod.id, action } },
        update: { scope: PermissionScope.GLOBAL },
        create: { roleId: superAdminId, moduleId: mod.id, action, scope: PermissionScope.GLOBAL },
      });
    }
  }
  console.log(
    `   ✔ super-admin → ${moduleRecords.length} módulos × ${ALL_ACTIONS.length} acciones (GLOBAL)`,
  );

  // Resto de roles
  for (const [slug, permDef] of Object.entries(ROLE_PERMISSIONS_BY_SLUG)) {
    const roleId = roleMap[slug];
    if (!roleId) continue;
    let count = 0;
    for (const mod of moduleRecords) {
      for (const action of permDef.actions) {
        await prisma.rolePermission.upsert({
          where: { roleId_moduleId_action: { roleId, moduleId: mod.id, action } },
          update: { scope: permDef.scope },
          create: { roleId, moduleId: mod.id, action, scope: permDef.scope },
        });
        count++;
      }
    }
    console.log(`   ✔ ${slug} → ${count} permisos (${permDef.scope})`);
  }

  // ── 4. Organización por defecto ──────────────────────────────────────────
  console.log('\n🏢  Creando organización por defecto...');
  const organization = await prisma.organization.upsert({
    where: { slug: orgSlug },
    update: { name: orgName },
    create: {
      name: orgName,
      slug: orgSlug,
      byDefault: true,
      status: RecordStatus.ACTIVE,
    },
  });
  console.log(`   ✔ organización "${organization.name}" (${organization.id})`);

  // ── 5. Usuario administrador ─────────────────────────────────────────────
  console.log('\n👤  Creando usuario administrador...');

  const hashedPassword = await hashPassword(adminPassword);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: 'System Admin', isActive: true },
    create: {
      email: adminEmail,
      name: 'System Admin',
      emailVerified: true,
      isActive: true,
      isSystem: true,
    },
  });
  console.log(`   ✔ usuario "${adminUser.email}" (${adminUser.id})`);

  // Cuenta con credenciales (better-auth usa auth_accounts para email/password)
  await prisma.account.upsert({
    where: { providerId_accountId: { providerId: 'credential', accountId: adminEmail } },
    update: { password: hashedPassword },
    create: {
      userId: adminUser.id,
      providerId: 'credential',
      accountId: adminEmail,
      password: hashedPassword,
    },
  });
  console.log('   ✔ cuenta de credenciales creada');

  // ── 6. Membresía en la organización ─────────────────────────────────────
  const membership = await prisma.organizationMember.upsert({
    where: { userId_organizationId: { userId: adminUser.id, organizationId: organization.id } },
    update: { isActive: true },
    create: {
      userId: adminUser.id,
      organizationId: organization.id,
      isActive: true,
    },
  });
  console.log(`   ✔ membresía en "${organization.name}"`);

  // ── 7. Asignación del rol super-admin al usuario ─────────────────────────
  // Rol global (organizationId null) + rol en la org por defecto
  console.log('\n🎯  Asignando rol super-admin al administrador...');

  // Global (sin contexto de org, aplica en cualquier organización)
  try {
    await prisma.roleAssignment.upsert({
      where: {
        roleId_userId_organizationId: {
          roleId: superAdminId,
          userId: adminUser.id,
          organizationId: organization.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminId,
        userId: adminUser.id,
        organizationId: organization.id,
        assignedBy: adminUser.id,
      },
    });
    console.log(`   ✔ rol super-admin asignado en la organización por defecto`);
  } catch (err) {
    console.warn(
      '   ⚠️  No se pudo crear la asignación de rol (puede que ya exista con distinto unique):',
      err,
    );
  }

  // ── 8. Actualizar FK de auditoría en entidades creadas ───────────────────
  // Ahora que tenemos el userId, lo asignamos como creador
  await prisma.organization.update({
    where: { id: organization.id },
    data: { createdBy: adminUser.id, updatedBy: adminUser.id, ownerId: adminUser.id },
  });

  for (const mod of moduleRecords) {
    await prisma.module.updateMany({
      where: { id: mod.id, createdBy: null },
      data: {
        createdBy: adminUser.id,
        ownerId: adminUser.id,
        ownerOrganizationId: organization.id,
      },
    });
  }

  console.log('\n✅  Seed completado exitosamente.\n');
  console.log('═══════════════════════════════════════════');
  console.log('  CREDENCIALES DE ACCESO');
  console.log('═══════════════════════════════════════════');
  console.log(`  Email:        ${adminEmail}`);
  console.log(`  Password:     ${adminPassword}`);
  console.log(`  Organización: ${orgName} (slug: ${orgSlug})`);
  console.log(`  Rol:          Super Admin (GLOBAL)`);
  console.log('═══════════════════════════════════════════\n');
  console.log('  ⚠️  Cambia la contraseña tras el primer login.');
  console.log('  ⚠️  Elimina SEED_ADMIN_PASSWORD del .env en producción.\n');
}

main()
  .catch((e) => {
    console.error('❌  Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
