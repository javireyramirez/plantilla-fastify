# Guía del Sistema de Roles y Permisos (RBAC)

Este documento describe el diseño y operativa del sistema de **Control de Acceso Basado en Roles (RBAC)** Los equipos son la unidad primaria de agrupación de usuarios y asignación de alcances.

---

## 1. Conceptos Fundamentales

### Principios de Diseño

- **Team (Equipo)**: Contenedor principal de permisos y colaboración. Los roles no se vinculan directamente a personas individuales, sino a equipos.
- **Usuario**: Puede pertenecer a uno o múltiples equipos simultáneamente. Hereda automáticamente la suma de todos los permisos de los equipos a los que pertenece.
- **Superadmin**: Atributo booleano en la cuenta del usuario que otorga acceso total e irrestricto a toda la infraestructura. Ignora cualquier validación de roles de equipo y tiene capacidades plenas sobre todas las tablas del sistema.

### Entidades del Modelo

```mermaid
erDiagram
    auth_users ||--o{ rbac_role_assignments : "tiene asignados"
    org_teams ||--o{ rbac_role_assignments : "recibe asignación"
    rbac_roles ||--o{ rbac_role_assignments : "asignado en"
    rbac_roles ||--o{ rbac_role_permissions : "contiene"
    sys_modules ||--o{ rbac_role_permissions : "aplica sobre"

    auth_users {
        string id PK
        string email
        boolean isActive
        boolean isSuperAdmin
    }
    org_teams {
        string id PK
        string name
        string slug
        string description
    }
    rbac_roles {
        string id PK
        string name
        string slug
        boolean isSystem
    }
    sys_modules {
        string id PK
        string slug
        string name
        string category
    }
    rbac_role_permissions {
        string id PK
        string roleId FK
        string moduleId FK
        enum action "CREATE | READ | UPDATE | ..."
        enum scope "GLOBAL | TEAM | OWN"
    }
    rbac_role_assignments {
        string id PK
        string roleId FK
        string userId FK
        string teamId FK
    }
```

---

## 2. Elementos Clave del Control de Acceso

Para autorizar una petición, el backend evalúa tres variables críticas:

### Recurso (`Module`)

La entidad o módulo de la aplicación sobre la cual se interactúa (ej: `companies`, `teams`, `documents`).

### Acción (`PermissionAction`)

| Acción     | Descripción                                                              |
| ---------- | ------------------------------------------------------------------------ |
| `CREATE`   | Crear nuevos registros en la base de datos.                              |
| `READ`     | Visualizar, listar, buscar o consultar información.                      |
| `UPDATE`   | Modificar datos de elementos preexistentes.                              |
| `DELETE`   | Eliminar elementos (borrado lógico o papelera).                          |
| `RESTORE`  | Recuperar registros desde el estado de papelera.                         |
| `EXPORT`   | Descargar o exportar datos en formatos externos (CSV/XLSX).              |
| `IMPORT`   | Ingesta masiva de datos hacia el módulo.                                 |
| `SETTINGS` | Modificar parámetros internos o configuraciones específicas del recurso. |

### Ámbito (`PermissionScope`)

Determina la barrera de visibilidad que se aplica automáticamente sobre las consultas, ordenados de mayor a menor jerarquía:

| Ámbito      | Descripción        | Criterio de filtro aplicado                                                          |
| ----------- | ------------------ | ------------------------------------------------------------------------------------ |
| 👑 `GLOBAL` | Acceso irrestricto | No inyecta condiciones adicionales en las consultas.                                 |
| 👥 `TEAM`   | Acceso de equipo   | El `owner`/`creator` debe pertenecer a uno de esos equipos.                          |
| 👤 `OWN`    | Acceso personal    | El registro debe coincidir estrictamente con el `ownerId` o `createdBy` del usuario. |

---

## 3. Jerarquía de Servicios

Las operaciones del backend se dividen en tres bloques:

1. **Operaciones del Núcleo**: Carga estática de módulos y acciones del sistema. Globales y transversales.
2. **Operaciones con Auditoría**: Entidades estructurales (Roles). No pertenecen a un usuario en particular; registran `createdBy` y `updatedBy` para trazabilidad.
3. **Operaciones de Negocio Protegidas**: Modelos de negocio (Empresas, Facturas, Documentos). Almacenan obligatoriamente `ownerId` en cada inserción para que los filtros de ámbito funcionen correctamente.

---

## 4. Asignación y Flujo de Roles

### Gestión por Equipos

Es el flujo estándar de la plataforma:

- **Equipo "Administradores"** → Rol `Admin` con ámbito `GLOBAL`
- **Equipo "Ventas"** → Rol `Editor` con ámbito `TEAM` en módulos de negocio
- **Equipo "Soporte Técnico"** → Rol `Viewer` con ámbito `OWN` de lectura y edición

Cuando un usuario es añadido a un equipo, sus tokens y contextos de sesión heredan de inmediato los privilegios de ese grupo.

---

## 5. Herencia de Permisos en Runtime

Cuando un usuario realiza una petición, el middleware consolida todas sus asignaciones activas en una **Matriz Resolutiva**:

```mermaid
graph TD
    A[Roles directos asignados al usuario] --> E[Matriz de Permisos Resolutiva]
    B[Roles de los Equipos del usuario] --> E
    E --> F{¿Tiene módulo + acción asignados?}
    F -- No --> G[HTTP 403 Forbidden]
    F -- Sí --> H[Scope más permisivo:<br/>GLOBAL > TEAM > OWN]
```

Si dos equipos distintos otorgan permisos solapados para el mismo recurso, el evaluador **siempre prioriza la política más permisiva**.

---

## 6. Flujo Funcional de una Petición

```mermaid
sequenceDiagram
    autonumber
    actor Cliente
    participant Router as FastifyRouter
    participant Hook1 as requireAuth
    participant Hook2 as userContext
    participant Hook3 as requirePermission
    participant Ctrl as RoleController
    participant Srv as RoleService
    participant DB as Base de Datos (Prisma)

    Cliente->>Router: Petición HTTP (ej: PATCH /companies/123)

    Router->>Hook1: requireAuth
    Note over Hook1: Resuelve la sesión del JWT/Cookie.<br/>Inyecta userId e isSuperAdmin.
    Hook1-->>Router: ✓ request.user

    Router->>Hook2: userContext
    Note over Hook2: Barrido de equipos activos del usuario.<br/>Inyecta teamIds en la request.
    Hook2-->>Router: ✓ request.userContext

    Router->>Hook3: requirePermission('companies', 'UPDATE')
    Note over Hook3: Superadmin → bypass con scope GLOBAL.<br/>Resto → consolida permisos por teamIds.<br/>Calcula el scope dominante.
    Hook3-->>Router: ✓ request.permissions

    Router->>Ctrl: update(request, reply)
    Note over Ctrl: Extrae el cuerpo mapeado y llama al service<br/>con userId, teamIds y scope del contexto.
    Ctrl->>Srv: update(id, data, { userId, teamIds, scope })

    Srv->>DB: query con buildScopeFilter(ctx) inyectado en where
    DB-->>Srv: Registro (o null si el ámbito lo bloquea)

    alt Registro fuera del ámbito
        Srv-->>Cliente: HTTP 404 / 403
    else Validación exitosa
        Srv->>DB: Mutación (Update / Delete)
        DB-->>Cliente: HTTP 200 OK
    end
```

---

## 7. Matrices de Roles Predeterminadas

### Rol: Administrador (`Admin`)

Gobernanza completa sobre todas las configuraciones del sistema y el negocio. Scope `GLOBAL` en todos los módulos.

| Módulo        | READ | CREATE | UPDATE | DELETE | RESTORE | EXPORT | IMPORT | SETTINGS |
| ------------- | :--: | :----: | :----: | :----: | :-----: | :----: | :----: | :------: |
| **users**     |  ✔   |   ✔    |   ✔    |   ✔    |    ✔    |   ✔    |   ✔    |    ✔     |
| **teams**     |  ✔   |   ✔    |   ✔    |   ✔    |    ✔    |   ✔    |   ✔    |    ✔     |
| **roles**     |  ✔   |   ✔    |   ✔    |   ✔    |    ✔    |   ✔    |   ✔    |    ✔     |
| **companies** |  ✔   |   ✔    |   ✔    |   ✔    |    ✔    |   ✔    |   ✔    |    ✔     |
| **documents** |  ✔   |   ✔    |   ✔    |   ✔    |    ✔    |   ✔    |   ✔    |    ✔     |

### Rol: Editor (`Editor`)

Operativa diaria de negocio a nivel de equipo. Sin acceso a configuración de roles o sistema. Scope `TEAM` en módulos de negocio.

| Módulo        | READ | CREATE | UPDATE | DELETE | RESTORE | EXPORT | IMPORT | SETTINGS |
| ------------- | :--: | :----: | :----: | :----: | :-----: | :----: | :----: | :------: |
| **users**     |  ✔   |   –    |   –    |   –    |    –    |   –    |   –    |    –     |
| **teams**     |  ✔   |   –    |   –    |   –    |    –    |   –    |   –    |    –     |
| **roles**     |  ✔   |   –    |   –    |   –    |    –    |   –    |   –    |    –     |
| **companies** |  ✔   |   ✔    |   ✔    |   ✔    |    –    |   –    |   –    |    –     |
| **documents** |  ✔   |   ✔    |   ✔    |   ✔    |    –    |   –    |   –    |    –     |

### Rol: Lector (`Viewer`)

Consumo de información de negocio dentro de sus equipos. Sin acceso a módulos críticos del sistema. Scope `OWN` o `TEAM` en módulos de negocio según configuración.

| Módulo        | READ | CREATE | UPDATE | DELETE | RESTORE | EXPORT | IMPORT | SETTINGS |
| ------------- | :--: | :----: | :----: | :----: | :-----: | :----: | :----: | :------: |
| **users**     |  –   |   –    |   –    |   –    |    –    |   –    |   –    |    –     |
| **teams**     |  –   |   –    |   –    |   –    |    –    |   –    |   –    |    –     |
| **roles**     |  –   |   –    |   –    |   –    |    –    |   –    |   –    |    –     |
| **companies** |  ✔   |   –    |   –    |   –    |    –    |   –    |   –    |    –     |
| **documents** |  ✔   |   –    |   –    |   –    |    –    |   –    |   –    |    –     |
