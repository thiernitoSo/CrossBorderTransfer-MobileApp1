# SendAfrika Database Setup Guide

SendAfrika supports both PostgreSQL database storage and in-memory storage for development and testing. This guide explains how to set up and use both options.

## Using In-Memory Storage (Default)

By default, if no database configuration is present, SendAfrika will use in-memory storage. This is suitable for development and testing but will not persist data between server restarts.

To explicitly use in-memory storage, run:

```bash
USE_POSTGRES=false ./run-sendafrika.sh
```

## Using PostgreSQL Database Storage

For production use and data persistence, SendAfrika supports PostgreSQL database storage.

### Prerequisites

- PostgreSQL 12 or newer
- Database URL in the format: `postgresql://username:password@hostname:port/database`

### Setting Up Database Connection

1. Create a PostgreSQL database
2. Set the DATABASE_URL environment variable

```bash
# Example
export DATABASE_URL=postgresql://postgres:password@localhost:5432/sendafrika
```

### Running with PostgreSQL

Once the DATABASE_URL environment variable is set, you can run the application with PostgreSQL storage:

```bash
./run-sendafrika.sh
```

Or explicitly specify to use PostgreSQL:

```bash
USE_POSTGRES=true ./run-sendafrika.sh
```

### Using Neon PostgreSQL

SendAfrika also supports connecting to Neon PostgreSQL databases in the cloud. The setup is the same, just use your Neon database URL:

```bash
export DATABASE_URL=postgresql://user:pass@ep-xyz-123.us-east-2.aws.neon.tech/neondb
```

## Database Schema

The database schema includes tables for:

- users
- beneficiaries
- transactions
- password_resets
- sessions

Tables are automatically created when the application first connects to the database.

## Checking Database Connection

To check if your database connection is working, run:

```bash
node check-db.js
```

This will attempt to connect to the database specified in the DATABASE_URL environment variable and report the status.

## Troubleshooting

### Common Issues

1. **Missing pg module**: Install with `npm install pg`
2. **Connection refused**: Ensure PostgreSQL is running and accessible
3. **Authentication failed**: Check username and password in DATABASE_URL
4. **Database does not exist**: Create the database first

### Fallback Behavior

If the application cannot connect to PostgreSQL, it will automatically fall back to in-memory storage. This ensures the application remains functional even if database connectivity is lost.

## Development Notes

The application uses a conditional storage implementation that can switch between PostgreSQL and in-memory storage. This approach provides flexibility and resilience.

Key files:
- `server/db.ts`: Database connection module
- `server/storage.js`: Storage implementation with fallback mechanisms
- `server/pg-session-store.js`: PostgreSQL session store adapter
- `check-db.js`: Utility to check database connectivity