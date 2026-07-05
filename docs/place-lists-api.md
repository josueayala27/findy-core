# Place Lists — API para frontend

Documentación de la feature de **listas de Places favoritos** en findy-core. Un usuario autenticado puede crear varias listas, guardar Places en ellas y compartir una lista mediante un enlace público.

## Vocabulario

| Término | Significado |
|---|---|
| **Place** | Lugar real (playa, restaurante, etc.). Identificado por UUID en `places.id`. Es el mismo id que devuelve Search (Upstash) y Place Detail. |
| **Place List** | Colección nombrada de Places que pertenece a un usuario. |
| **shareToken** | UUID que habilita lectura pública de una lista sin autenticación. |

> **Nota:** "List" aquí es una colección guardada por el usuario, no confundir con Search (búsqueda por texto en Upstash Vector).

## Base URL

```
{API_BASE_URL}
```

Ejemplo local: `http://localhost:3000`

## Autenticación

Los endpoints bajo `/place-lists` requieren JWT obtenido en signup/login:

```http
Authorization: Bearer <token>
```

Obtener token:

| Método | Ruta | Body |
|---|---|---|
| `POST` | `/auth/signup` | `{ firstName, lastName, email, password }` |
| `POST` | `/auth/login` | `{ email, password }` |

Respuesta: `{ "token": "..." }` (válido 7 días).

El endpoint público `GET /shared/:shareToken` **no** requiere token.

---

## Tipos TypeScript (referencia)

```ts
interface PlaceListPlace {
  id: string;
  canonicalName: string;
  category: string | null;
  location: {
    text: string | null;
    lat: number | null;
    lng: number | null;
  };
  addedAt: string; // ISO 8601
}

interface PlaceList {
  id: string;
  name: string;
  description: string | null;
  placeCount: number;
  isShared: boolean;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PlaceListDetail extends PlaceList {
  places: PlaceListPlace[];
}

interface SharedPlaceList {
  name: string;
  description: string | null;
  owner: {
    firstName: string;
  };
  places: PlaceListPlace[];
}
```

---

## Endpoints

### Resumen

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/place-lists` | Sí | Crear lista |
| `GET` | `/place-lists` | Sí | Listar mis listas |
| `GET` | `/place-lists/:id` | Sí | Detalle de lista con places |
| `PATCH` | `/place-lists/:id` | Sí | Actualizar nombre/descripción |
| `DELETE` | `/place-lists/:id` | Sí | Eliminar lista |
| `POST` | `/place-lists/:id/places` | Sí | Agregar Place a la lista |
| `DELETE` | `/place-lists/:id/places/:placeId` | Sí | Quitar Place de la lista |
| `POST` | `/place-lists/:id/share` | Sí | Activar/obtener share token |
| `DELETE` | `/place-lists/:id/share` | Sí | Desactivar compartición |
| `GET` | `/shared/:shareToken` | No | Ver lista compartida |

Todos los `:id`, `:placeId` y `:shareToken` deben ser UUID válidos.

---

### Crear lista

```http
POST /place-lists
Authorization: Bearer <token>
Content-Type: application/json
```

**Body**

```json
{
  "name": "Playas favoritas",
  "description": "Para el verano"
}
```

| Campo | Tipo | Requerido | Reglas |
|---|---|---|---|
| `name` | string | Sí | 1–100 caracteres (trim) |
| `description` | string | No | máx. 500 caracteres (trim) |

**Respuesta `201`**

```json
{
  "list": {
    "id": "a1b2c3d4-...",
    "name": "Playas favoritas",
    "description": "Para el verano",
    "placeCount": 0,
    "isShared": false,
    "shareToken": null,
    "createdAt": "2026-07-04T18:00:00.000Z",
    "updatedAt": "2026-07-04T18:00:00.000Z",
    "places": []
  }
}
```

---

### Listar mis listas

```http
GET /place-lists
Authorization: Bearer <token>
```

**Respuesta `200`**

```json
{
  "lists": [
    {
      "id": "a1b2c3d4-...",
      "name": "Playas favoritas",
      "description": "Para el verano",
      "placeCount": 3,
      "isShared": true,
      "shareToken": "f9e8d7c6-...",
      "createdAt": "2026-07-04T18:00:00.000Z",
      "updatedAt": "2026-07-04T19:30:00.000Z"
    }
  ]
}
```

Orden: más recientemente actualizada primero (`updatedAt` desc).

---

### Detalle de lista

```http
GET /place-lists/:id
Authorization: Bearer <token>
```

**Respuesta `200`**

```json
{
  "list": {
    "id": "a1b2c3d4-...",
    "name": "Playas favoritas",
    "description": "Para el verano",
    "placeCount": 2,
    "isShared": false,
    "shareToken": null,
    "createdAt": "2026-07-04T18:00:00.000Z",
    "updatedAt": "2026-07-04T19:00:00.000Z",
    "places": [
      {
        "id": "place-uuid-1",
        "canonicalName": "Playa El Tunco",
        "category": "beach",
        "location": {
          "text": "El Tunco, La Libertad, El Salvador",
          "lat": 13.4927,
          "lng": -89.3823
        },
        "addedAt": "2026-07-04T18:05:00.000Z"
      }
    ]
  }
}
```

Places ordenados por fecha de agregado (más antiguo primero).

Solo el dueño puede ver la lista por id. Otras listas devuelven `404`.

---

### Actualizar lista

```http
PATCH /place-lists/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Body** (al menos un campo)

```json
{
  "name": "Nuevo nombre",
  "description": null
}
```

| Campo | Tipo | Reglas |
|---|---|---|
| `name` | string | 1–100 caracteres |
| `description` | string \| null | máx. 500 caracteres; `null` borra la descripción |

**Respuesta `200`**

```json
{
  "list": {
    "id": "...",
    "name": "Nuevo nombre",
    "description": null,
    "placeCount": 2,
    "isShared": false,
    "shareToken": null,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### Eliminar lista

```http
DELETE /place-lists/:id
Authorization: Bearer <token>
```

**Respuesta `204`** — sin body. Elimina la lista y todos sus items en cascada.

---

### Agregar Place a una lista

```http
POST /place-lists/:id/places
Authorization: Bearer <token>
Content-Type: application/json
```

**Body**

```json
{
  "placeId": "place-uuid-from-search-or-detail"
}
```

`placeId` debe existir en la tabla `places` (mismo UUID que `GET /places/:id`).

**Respuesta `201`**

```json
{
  "place": {
    "id": "place-uuid-1",
    "canonicalName": "Playa El Tunco",
    "category": "beach",
    "location": {
      "text": "El Tunco, La Libertad, El Salvador",
      "lat": 13.4927,
      "lng": -89.3823
    },
    "addedAt": "2026-07-04T18:05:00.000Z"
  }
}
```

| Status | Error |
|---|---|
| `404` | Lista no encontrada o Place no existe |
| `409` | Place ya está en la lista |

---

### Quitar Place de una lista

```http
DELETE /place-lists/:id/places/:placeId
Authorization: Bearer <token>
```

**Respuesta `204`** — sin body.

| Status | Error |
|---|---|
| `404` | Lista no encontrada o Place no está en la lista |

---

### Compartir lista

#### Activar / obtener token

```http
POST /place-lists/:id/share
Authorization: Bearer <token>
```

Si la lista ya está compartida, devuelve el token existente (idempotente).

**Respuesta `200`**

```json
{
  "shareToken": "f9e8d7c6-b5a4-4321-9876-543210fedcba"
}
```

URL sugerida en frontend:

```
{APP_URL}/shared/{shareToken}
```

La app debe resolver esa ruta llamando a `GET /shared/:shareToken` en findy-core.

#### Desactivar compartición

```http
DELETE /place-lists/:id/share
Authorization: Bearer <token>
```

**Respuesta `204`** — sin body. Invalida el token; enlaces previos dejan de funcionar.

---

### Ver lista compartida (público)

```http
GET /shared/:shareToken
```

Sin header `Authorization`.

**Respuesta `200`**

```json
{
  "list": {
    "name": "Playas favoritas",
    "description": "Para el verano",
    "owner": {
      "firstName": "Josue"
    },
    "places": [
      {
        "id": "place-uuid-1",
        "canonicalName": "Playa El Tunco",
        "category": "beach",
        "location": {
          "text": "El Tunco, La Libertad, El Salvador",
          "lat": 13.4927,
          "lng": -89.3823
        },
        "addedAt": "2026-07-04T18:05:00.000Z"
      }
    ]
  }
}
```

No expone `id` de la lista ni datos sensibles del dueño (solo `firstName`).

Para abrir el detalle completo de un Place, usar el id del item con:

```http
GET /places/:id
```

(sin auth requerida hoy)

---

## Errores comunes

Todas las respuestas de error siguen:

```json
{ "error": "mensaje descriptivo" }
```

| HTTP | Cuándo |
|---|---|
| `400` | UUID inválido, body de validación incorrecto, PATCH sin campos |
| `401` | Token ausente o inválido |
| `404` | Recurso no encontrado |
| `409` | Place duplicado en la lista |
| `500` | Error interno |

---

## Flujo de integración recomendado

```
1. Usuario busca        →  Upstash Vector (frontend directo)
2. Obtiene place id     →  id UUID
3. Place Detail         →  GET /places/:id
4. Guardar en lista     →  POST /place-lists/:listId/places { placeId }
5. Compartir            →  POST /place-lists/:listId/share
6. Abrir enlace público →  GET /shared/:shareToken
7. Ver Place completo   →  GET /places/:id (desde item de la lista compartida)
```

### Pantallas sugeridas

| Pantalla | Endpoints |
|---|---|
| Mis listas | `GET /place-lists` |
| Crear/editar lista | `POST /place-lists`, `PATCH /place-lists/:id` |
| Detalle de lista | `GET /place-lists/:id` |
| Botón "Guardar" en Place Detail | `POST /place-lists/:id/places` (selector de lista) |
| Compartir | `POST /place-lists/:id/share` + deep link `{APP_URL}/shared/{shareToken}` |
| Vista pública compartida | `GET /shared/:shareToken` |

---

## Relación con Place Detail

Los items en una lista son un **subconjunto resumido** del Place (nombre, categoría, location). Para mentions, trending y evidencia social, el frontend debe cargar Place Detail por separado:

```http
GET /places/:id
```

Respuesta incluye `mentions`, `trending`, etc. (ver implementación en `src/routes/places.route.ts`).

---

## Notas de implementación

- Un Place puede estar en **varias listas** del mismo usuario.
- Un Place **no puede repetirse** en la misma lista (`409` si se intenta).
- `isShared === true` cuando `shareToken !== null`.
- Al agregar o quitar places se actualiza `updatedAt` de la lista (afecta orden en `GET /place-lists`).
- La tabla legacy `saved_places` sigue en la DB pero **no** usa estos endpoints; usar `/place-lists` para la feature nueva.
