# Dynamic Configuration System

This project now uses a dynamic configuration system that allows you to override configuration values using environment variables.

## How It Works

1. The `src/config.ts` file loads these values and applies any overrides from environment variables
2. Environment variables take precedence over values in the JSON file

## Using Environment Variables

To override configuration values:

1. Create a `.env` file in the project root (you can copy from `.env.example`)
2. Set the desired environment variables with the `VITE_` prefix

Example `.env` file:
```
VITE_TITLE="My Custom Title"
VITE_BACKEND="https://api.example.com"
```

## Available Configuration Options

| JSON Key | Environment Variable | Description |
|----------|---------------------|-------------|
| title | VITE_TITLE | Website title |
| footer | VITE_FOOTER | Footer text |
| short_name | VITE_SHORT_NAME | Short name for the application |
| display_name | VITE_DISPLAY_NAME | Display name for the application |
| description | VITE_DESCRIPTION | Website description |
| default_language | VITE_DEFAULT_LANGUAGE | Default language code (e.g., "en", "ar") |
| backend | VITE_BACKEND | Backend API URL |
| websocket | VITE_WEBSOCKET | WebSocket URL (optional) |

## Development vs Production

The configuration values will be applied during build time, so any changes to the `.env` file will be reflected in the built version of the application.

For development:
- Use `.env.development` or `.env.local` for development-specific settings

For production:
- Use `.env.production` for production settings
- Or set environment variables directly in your deployment environment