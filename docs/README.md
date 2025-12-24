# ImageLingo API Documentation

This directory contains the API documentation and testing resources for ImageLingo.

## Files

- **`openapi.json`** - OpenAPI 3.0 specification for all API endpoints
- **`postman_collection.json`** - Postman collection for E2E testing (generated from OpenAPI spec)
- **`postman_environment.json`** - Environment variables template for Postman

## Getting Started

### Prerequisites

1. A Supabase account with a project set up
2. Environment variables configured (see `.env.example` in the project root)
3. Postman installed (optional, for E2E testing)

### Authentication Setup

All API endpoints require authentication using Supabase JWT tokens. To authenticate:

1. **Sign up or sign in** using Supabase Auth (via client SDK or Supabase dashboard)
2. **Get the access token** from the Supabase session
3. **Include the token** in the `Authorization` header:
   ```
   Authorization: Bearer YOUR_JWT_TOKEN
   ```

### Using Postman

1. **Import the collection:**
   - Open Postman
   - Click "Import"
   - Select `postman_collection.json`

2. **Import the environment:**
   - Click "Environments" in the sidebar
   - Click "Import"
   - Select `postman_environment.json`

3. **Configure environment variables:**
   - Edit the imported environment
   - Set `base_url` to your API URL (e.g., `http://localhost:3000` for local development)
   - Set `supabase_url` to your Supabase project URL
   - Set `supabase_anon_key` to your Supabase anonymous key
   - Set `user_email` and `user_password` for test authentication

4. **Authenticate:**
   - You'll need to manually obtain a JWT token from Supabase Auth
   - Set the `access_token` environment variable to your JWT token
   - The token will be automatically included in all requests

5. **Run the collection:**
   - Select the imported environment
   - Run requests in order or use the Collection Runner

## API Endpoints

### Authentication

- **GET** `/api/auth/user` - Get current user profile

### Projects

- **GET** `/api/projects` - List all projects
- **POST** `/api/projects` - Create a new project
- **GET** `/api/projects/{id}` - Get a specific project
- **PATCH** `/api/projects/{id}` - Update a project
- **DELETE** `/api/projects/{id}` - Delete a project

### Images

- **GET** `/api/images?project_id={id}` - List images in a project
- **POST** `/api/images` - Upload an image (multipart/form-data)
- **GET** `/api/images/{id}` - Get an image with signed URL
- **DELETE** `/api/images/{id}` - Delete an image

### Generations

- **GET** `/api/generations?project_id={id}` - List generations in a project
- **POST** `/api/generations` - Create a new generation task
- **GET** `/api/generations/{id}` - Get a specific generation
- **PATCH** `/api/generations/{id}` - Update a generation

### Subscriptions

- **GET** `/api/subscriptions` - Get current user's subscription

## Common Response Codes

- **200** - Success
- **201** - Created (for POST requests)
- **400** - Bad Request (invalid input)
- **401** - Unauthorized (missing or invalid token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found
- **500** - Internal Server Error

## Error Response Format

All errors follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

## Example Requests

### Create a Project

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Project",
    "description": "A test project for ImageLingo"
  }'
```

### Upload an Image

```bash
curl -X POST http://localhost:3000/api/images \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/image.png" \
  -F "project_id=PROJECT_UUID"
```

### Create a Generation

```bash
curl -X POST http://localhost:3000/api/generations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "PROJECT_UUID",
    "type": "text_extraction",
    "input_image_id": "IMAGE_UUID"
  }'
```

## Viewing the OpenAPI Spec

You can view the OpenAPI specification in several ways:

1. **Swagger Editor:**
   - Go to https://editor.swagger.io/
   - Import `openapi.json`

2. **Swagger UI (local):**
   ```bash
   npx @apidevtools/swagger-cli serve docs/openapi.json
   ```

3. **Redoc (local):**
   ```bash
   npx @redocly/cli preview-docs docs/openapi.json
   ```

## Development

To regenerate the Postman collection from the OpenAPI spec:

```bash
npx openapi-to-postmanv2 -s docs/openapi.json -o docs/postman_collection.json -p
```

## Testing

For automated API testing, see the `__tests__` directory in the project root.
