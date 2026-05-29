# API Endpoints Documentation

## Base URL

```
http://localhost:3001/api
```

## 🔐 Authentication

### Login
**POST** `/auth/login`

Request:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "firstName": "Jean",
    "lastName": "Dupont",
    "role": "donneur",
    "bloodType": "O+"
  }
}
```

### Register
**POST** `/auth/register`

Request:
```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean@example.com",
  "password": "password123",
  "role": "donneur",
  "bloodType": "O+",
  "phone": "+224..."
}
```

## 👥 Donneur Endpoints

### Get Profile
**GET** `/donneur/profile`
- Headers: `Authorization: Bearer {token}`

### Update Profile
**PUT** `/donneur/profile`
- Headers: `Authorization: Bearer {token}`

Request:
```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "phone": "+224...",
  "address": "123 Rue du Sang",
  "city": "Conakry",
  "available": true
}
```

### Get Requests
**GET** `/donneur/requests`
- Headers: `Authorization: Bearer {token}`

Response:
```json
{
  "requests": [
    {
      "id": "req123",
      "typeBlood": "O+",
      "quantite": 2,
      "urgence": "urgente",
      "structure": "Hôpital Central",
      "lieu": "Conakry",
      "description": "Cas d'urgence"
    }
  ]
}
```

### Respond to Request
**POST** `/donneur/requests/{requestId}/respond`
- Headers: `Authorization: Bearer {token}`

Request:
```json
{
  "status": "accepted" // or "rejected"
}
```

## 🏥 Structure Endpoints

### Get Profile
**GET** `/structure/profile`

### Get Demands
**GET** `/structure/demands`

### Create Demand
**POST** `/structure/demands`

Request:
```json
{
  "typeBlood": "O+",
  "quantite": 2,
  "urgence": "moyenne",
  "description": "Besoin urgent de sang O+"
}
```

### Update Demand
**PUT** `/structure/demands/{demandId}`

## 👮 Admin Endpoints

### Get Stats
**GET** `/admin/stats`

Response:
```json
{
  "users": 150,
  "demands": 45,
  "donations": 120
}
```

### Get Users
**GET** `/admin/users`

### Block User
**POST** `/admin/users/{userId}/block`

### Unblock User
**POST** `/admin/users/{userId}/unblock`

## 📊 Demandes Endpoints

### Get All Demands
**GET** `/demandes`

Query Params:
- `status`: pending, completed, cancelled
- `urgence`: urgente, moyenne, basse
- `page`: page number
- `limit`: items per page

### Get Demand by ID
**GET** `/demandes/{id}`

### Create Demand
**POST** `/demandes`

### Update Demand
**PUT** `/demandes/{id}`

### Delete Demand
**DELETE** `/demandes/{id}`

### Respond to Demand
**POST** `/demandes/{demandId}/respond`

## 🔑 Token Management

Le token JWT est stocké dans `localStorage` avec la clé `bl_token`.

Chaque requête doit inclure:
```
Authorization: Bearer {token}
```

### Token Expiration

Si le token a expiré (erreur 401), l'utilisateur sera redirigé vers `/login`.

## ⚠️ Error Codes

| Code | Message |
|------|---------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

## 🧪 Testing avec Postman

1. Importe les endpoints dans Postman
2. Configure la variable `{{token}}` après login
3. Teste chaque endpoint

---

**Dernière mise à jour**: 9 mai 2026
