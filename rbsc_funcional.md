# Sistema de Roles y Permisos (RBAC)

## Versión Funcional

El sistema de Roles y Permisos (RBAC) garantiza que cada usuario vea únicamente la información que le corresponde y pueda realizar solo las acciones autorizadas. Está diseñado para organizaciones que necesitan seguridad, trazabilidad y control granular.

---

## 1. ¿Qué es una Organización?

Una **organización** es un espacio de trabajo independiente.  
Un usuario puede pertenecer a **una o varias organizaciones** y cambiar entre ellas.

Cada organización tiene:

- Sus propios datos
- Sus equipos
- Sus roles
- Sus permisos

---

## 2. ¿Qué es un Team?

Un **team** agrupa usuarios dentro de una organización.

Ejemplos:

- Administradores
- Ventas
- Soporte
- Marketing

Los permisos se asignan **a los teams**, no a los usuarios.  
Esto permite que cambiar a un usuario de team cambie automáticamente sus permisos.

---

## 3. ¿Qué es un Rol?

Un **rol** define qué puede hacer un team dentro de una organización.

Ejemplos:

- Admin: acceso completo
- Editor: puede crear y modificar
- Viewer: solo lectura

Cada rol define:

- Qué módulos puede usar (ej: Empresas, Documentos, Usuarios)
- Qué acciones puede realizar (leer, crear, actualizar, eliminar…)
- Sobre qué datos puede actuar (toda la organización, su equipo o solo los suyos)

---

## 4. ¿Qué es un Permiso?

Un permiso combina tres elementos:

1. **Módulo**  
   Ej: Empresas, Documentos, Usuarios, Configuración…

2. **Acción**
   - Crear
   - Leer
   - Actualizar
   - Eliminar
   - Restaurar
   - Exportar
   - Importar
   - Configurar

3. **Ámbito (Scope)**  
   Define sobre qué datos aplica el permiso:
   - **GLOBAL**: todos los datos del sistema
   - **ORGANIZATION**: datos de la organización activa
   - **TEAM**: datos de los equipos del usuario
   - **OWN**: solo los datos creados por el usuario

---

## 5. ¿Cómo se determina lo que un usuario puede hacer?

Un usuario puede tener varios roles a la vez (por pertenecer a varios teams).  
El sistema combina todos sus roles y aplica **el permiso más permisivo**.

Ejemplo:

- Rol A permite leer empresas
- Rol B permite editar empresas  
  → El usuario puede editar empresas

---

## 6. ¿Qué es un Superadmin?

Es un usuario con acceso total al sistema.  
No tiene restricciones y puede ver todas las organizaciones.

---

## 7. Beneficios del sistema RBAC

- Seguridad y cumplimiento normativo
- Control total sobre quién ve qué
- Escalabilidad: funciona igual con 10 o 10.000 usuarios
- Flexibilidad: cada organización puede tener su propia estructura
- Trazabilidad: todo queda registrado

---

## 8. Resumen

- Los permisos se asignan a teams.
- Los usuarios heredan los permisos de sus teams.
- Un usuario puede pertenecer a varias organizaciones.
- El sistema combina todos los roles y aplica el más permisivo.
- El superadmin tiene acceso total.
