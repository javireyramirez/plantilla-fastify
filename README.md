# plantilla-fastify

Plantilla de desarrollo con Fastify, Prisma y Better Auth.

## Auditoría y Logs (AuditLog)

El sistema cuenta con un mecanismo de auditoría unificado y centralizado en la tabla `AuditLog` (`sys_audit_logs`). 

### Eventos Auditados
El sistema registra automáticamente los siguientes eventos:
- **Autenticación**: Inicios de sesión exitosos y fallidos (`LOGIN`) y cierres de sesión (`LOGOUT`).
- **CRUD de Entidades**: Creaciones (`CREATE`), actualizaciones (`UPDATE`), borrado suave (`SOFT_DELETE`), restauración (`RESTORE`), y eliminación permanente (`HARD_DELETE`).
- **Datos de Red**: En cada log se captura automáticamente la dirección IP y el User Agent del cliente que realiza la acción.

### Configuración del Nivel de Detalle

Para evitar que la base de datos crezca descontroladamente en aplicaciones pequeñas o medianas, se puede configurar el nivel de detalle de las auditorías de datos mediante la variable de entorno:

```bash
AUDIT_LOG_DETAILS_ENABLED=false
```

- **`false` (Recomendado para Producción Ligera)**: Registra la acción, el usuario, el recurso, la IP y el UA. No almacena el estado completo de los datos ni calcula diferencias, ahorrando espacio en disco de forma muy drástica.
- **`true`**: Además de la acción básica, registra el objeto antes del cambio (`before`), después (`after`) y calcula las diferencias campo por campo (`changes`) en formato JSON.

### Seguridad de los Logs
Por motivos de cumplimiento y seguridad, cualquier campo sensible como `password`, `token`, `secret`, `accessToken`, `refreshToken`, o `idToken` es redactado automáticamente y guardado como `[REDACTED]` en la base de datos de auditoría.
