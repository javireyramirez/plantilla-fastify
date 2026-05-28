# Guía del Sistema de Roles y Permisos (RBAC)

Este documento detalla conceptual y técnicamente el funcionamiento del sistema de **Control de Acceso Basado en Roles (RBAC)** implementado en la aplicación.

---

## 1. Conceptos Fundamentales

El sistema de permisos está diseñado en torno al concepto de **recursos multi-inquilino (multi-tenant)**, donde la propiedad de cada registro define quién puede interactuar con él en función de su nivel de acceso.

### Entidades del Modelo

```mermaid
erDiagram
    auth_users ||--o{ rbac_role_assignments : "tiene asignados"
    org_organizations ||--o{ rbac_role_assignments : "contexto de"
    org_teams ||--o{ rbac_role_assignments : "tiene asignados"
    rbac_roles ||--o{ rbac_role_assignments : "asignado en"
    rbac_roles ||--o{ rbac_role_permissions : "contiene"
    rbac_modules ||--o{ rbac_role_permissions : "aplica sobre"

    auth_users {
        string id PK
        string email
        boolean isActive
    }
    org_organizations {
        string id PK
        string name
        string slug
    }
    org_teams {
        string id PK
        string name
        string organizationId FK
    }
    rbac_roles {
        string id PK
        string name
        string slug
        boolean isSystem
    }
    rbac_modules {
        string id PK
        string key "ej: 'companies'"
        string label
    }
    rbac_role_permissions {
        string id PK
        string roleId FK
        string moduleId FK
        enum action "CREATE | READ | UPDATE | ..."
        enum scope "GLOBAL | ORGANIZATION | TEAM | OWN"
    }
    rbac_role_assignments {
        string id PK
        string roleId FK
        string userId FK
        string teamId FK
        string targetOrgId FK
        string organizationId FK "Contexto"
    }
```

### Elementos Clave del Control de Acceso

1. **Recurso (`Module`)**: La sección o entidad del sistema sobre la que se quiere actuar (ej: `companies`, `teams`, `invoices`).
2. **Acción (`PermissionAction`)**: Qué se quiere hacer sobre el recurso. Las acciones estándar son:
   * `CREATE`: Crear nuevos registros.
   * `READ`: Visualizar o listar registros.
   * `UPDATE`: Modificar registros existentes.
   * `DELETE`: Eliminar (física o lógicamente) registros.
   * `RESTORE`: Recuperar registros de la papelera.
3. **Ámbito (`PermissionScope`)**: **Sobre qué registros** tiene permiso el usuario para realizar la acción. El sistema soporta cuatro ámbitos ordenados por nivel de permisividad:
   * 👑 **`GLOBAL`**: Permite actuar sobre **todos** los registros del sistema.
   * 🏢 **`ORGANIZATION`**: Permite actuar sobre registros pertenecientes a la **organización activa** (`ownerOrganizationId`).
   * 👥 **`TEAM`**: Permite actuar sobre registros asignados a los **equipos a los que pertenece el usuario** (`ownerTeamId`).
   * 👤 **`OWN`**: Permite actuar únicamente sobre registros **creados o poseídos directamente por el usuario** (`ownerId`).

---

## 2. Herencia de Permisos en Runtime

Cuando un usuario realiza una petición, el sistema no solo evalúa los roles asignados directamente a su cuenta. En su lugar, resuelve una jerarquía completa basada en su contexto organizativo:

```mermaid
graph TD
    A[Roles Globales del Usuario] --> E[Matriz de Permisos Resolutiva]
    B[Roles Directos del Usuario en la Org] --> E
    C[Roles de los Equipos del Usuario en la Org] --> E
    D[Roles Asignados a la Organización Completa] --> E
    E --> F{¿Hay permisos para Module + Action?}
    F -- No --> G[HTTP 403 Forbidden]
    F -- Sí --> H[Tomar el Scope más permisivo:<br/>GLOBAL > ORGANIZATION > TEAM > OWN]
```

---

## 3. Flujo Técnico de una Petición (Pipeline)

El control de acceso se ejecuta de manera transparente y progresiva mediante middlewares (hooks de Fastify) y lógica encapsulada en las clases base.

### Diagrama de Secuencia Completo

```mermaid
sequenceDiagram
    autonumber
    actor Cliente
    participant Router as BaseRoutes
    participant Hook1 as Hook: requireAuth
    participant Hook2 as Hook: memberContext
    participant Hook3 as Hook: requirePermission
    participant Ctrl as BaseController
    participant Srv as BaseService
    participant Repo as BaseRepository
    participant DB as Base de Datos

    Cliente->>Router: Petición HTTP (ej: PATCH /companies/123)
    
    Note over Router: Fase de Middlewares
    Router->>Hook1: Ejecuta requireAuth
    Note over Hook1: Valida que exista sesión activa en Better-Auth
    Hook1-->>Router: Inyecta request.session

    Router->>Hook2: Ejecuta memberContext
    Note over Hook2: Obtiene ID de Organización (cabecera/parámetro).<br/>Valida que el usuario sea miembro activo.<br/>Resuelve los equipos (teams) del usuario en esa org.
    Hook2-->>Router: Inyecta request.memberContext

    Router->>Hook3: Ejecuta requirePermission('companies', 'UPDATE')
    Note over Hook3: Ejecuta una query unificada buscando todos los roles aplicables.<br/>Consolida los permisos para el recurso/acción.<br/>Determina el Scope más permisivo.
    Hook3-->>Router: Inyecta request.permissions

    Note over Router: Fase de Controlador y Negocio
    Router->>Ctrl: update(req, reply)
    Note over Ctrl: Extrae el ScopeContext con requireScope(req):<br/>{ scope, userId, organizationId, teamIds }
    Ctrl->>Srv: update(id, body, userId, { scope })

    Note over Srv: Validación de Seguridad Crítica
    Srv->>Repo: findFirst({ id }, scope)
    Note over Repo: Aplica filtro dinámico según el scope:<br/>GLOBAL -> {}<br/>ORGANIZATION -> { ownerOrganizationId }<br/>TEAM -> { ownerTeamId: { in: teamIds } }<br/>OWN -> { ownerId: userId }
    Repo->>DB: Consulta con filtros aplicados
    DB-->>Srv: Retorna registro (o null si no cumple el scope)
    
    alt Registro no encontrado en el scope del usuario
        Srv-->>Cliente: HTTP 404/403 (Registro no encontrado o sin permisos)
    else Registro pertenece a su scope
        Srv->>Repo: update({ id }, data)
        Repo->>DB: Guarda modificaciones
        DB-->>Cliente: HTTP 200 OK (Respuesta exitosa)
    end
```

---

## 4. Detalle de Código e Implementación

### Definición de Rutas Automática (`registerBaseRoutes`)
Al declarar las rutas base de cualquier módulo, se inyecta automáticamente el pipeline de seguridad mapeando el recurso y la acción. Ejemplo:

```typescript
// src/modules/companies/companies.routes.ts
registerBaseRoutes(fastify, fastify.companiesController, {
  resource: 'companies', // Identificador del módulo en la BD
  tags: ['Companies'],
  schemas: { ... }
});
```

En la infraestructura base, esto se asocia a las pre-condiciones:
```typescript
// src/routes/base.routes.ts
app.patch(
  '/:id',
  {
    preHandler: [
      requireAuth,
      memberContext,
      requirePermission(options.resource, PermissionAction.UPDATE),
    ],
  },
  (req, reply) => controller.update(req as any, reply)
);
```

### Extracción del Ámbito en Controladores
Cada método del controlador extrae el contexto de seguridad para delegarlo a la capa de negocio:

```typescript
// src/controllers/base.controller.ts
async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const { id } = request.params;
  const userId = request.session?.user?.id;
  const scope = requireScope(request); // Extrae scope, userId, orgId, teamIds

  const record = await this.service.update(id, request.body, userId, { scope });
  return reply.send(record);
}
```

### Chequeo Previo de Seguridad en Servicios
Para prevenir escaladas de privilegios en operaciones individuales mediante IDs aleatorios u obtenidos maliciosamente, el servicio valida la propiedad de manera proactiva:

```typescript
// src/services/base.service.ts
async update(id: string, data: any, userId?: string, options: { scope?: ScopeContext }): Promise<T> {
  const where = { id, ...this.getStatusFilter(false) };
  
  // Realiza la búsqueda aplicando estrictamente los filtros del scope resuelto
  const record = await this.repository.findFirst({ where, scope: options.scope });
  if (!record) {
    throw new HttpError(404, 'Registro no encontrado o sin permisos');
  }

  // Si existe en su scope, procede con la actualización real de forma segura
  return await this.repository.update({
    where: { id },
    data: { ...data, ...withUpdatedBy(userId) },
  });
}
```

### Inyección de Filtros en Repositorios
La capa de base de datos se encarga de traducir el ámbito resuelto en filtros nativos de Prisma:

```typescript
// src/repositories/base.repository.ts
export function buildScopeFilter(ctx: ScopeContext): Record<string, any> {
  switch (ctx.scope) {
    case 'GLOBAL':
      return {};
    case 'ORGANIZATION':
      return { ownerOrganizationId: ctx.organizationId };
    case 'TEAM':
      return { ownerTeamId: { in: ctx.teamIds } };
    case 'OWN':
      return { ownerId: ctx.userId };
  }
}
```
