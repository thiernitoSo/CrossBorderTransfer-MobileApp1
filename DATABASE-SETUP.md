# SendAfrika - Database Setup Guide

## Current Implementation

SendAfrika is currently using an in-memory storage solution that simulates database functionality. This approach was chosen to ensure compatibility with the React Native environment while maintaining the ability to develop and test features.

### Features of the Current Storage Solution

- In-memory storage for users, beneficiaries, transactions, and reset tokens
- Session management with MemoryStore
- Test data seeding with admin and regular user accounts
- Full implementation of storage interface for all required operations

## Path to PostgreSQL Implementation

The project has been structured to allow for a smooth transition to PostgreSQL when the dependency conflicts are resolved. Here's what's already in place:

1. **Schema Definition**: The `shared/schema.ts` file contains complete Drizzle ORM schema definitions for all tables.

2. **Database Connection**: A placeholder for the database connection is in `server/db.js`, which currently provides sessionStore but is ready to be expanded.

3. **Environment Variable**: The application checks for `DATABASE_URL` environment variable to determine if database connectivity is available.

4. **Storage Interface**: The storage interface in `server/storage.js` implements all methods needed for the application, making it easy to swap implementations.

## Implementing PostgreSQL

To fully implement PostgreSQL in production:

1. Install required packages in a separate server environment:
   ```
   npm install drizzle-orm @neondatabase/serverless pg ws connect-pg-simple drizzle-kit
   ```

2. Update `server/db.js` to establish a real connection to PostgreSQL using the DATABASE_URL.

3. Create a DatabaseStorage class that implements the same interface as MemStorage but using PostgreSQL queries.

4. Add database migration scripts using Drizzle's migration tools.

5. Swap the storage implementation when DATABASE_URL is available.

## Test Users

For development and testing, the following users are available in the memory store:

1. **Admin User**
   - Email: admin@example.com
   - Password: admin123
   - Role: admin

2. **Regular User**
   - Email: user@example.com
   - Password: admin123
   - Role: user

## Development Notes

- When developing new features, continue to use the storage interface defined in the server code.
- Do not rely on database-specific features that might not be available in the in-memory implementation.
- Keep database schema changes synchronized in the `shared/schema.ts` file to ensure smooth migration later.