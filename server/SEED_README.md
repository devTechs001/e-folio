# Database Seeding

## Owner User Credentials

The seed script creates the owner user in MongoDB with the following details from `.env`:

- **Email**: devtechs842@gmail.com
- **Password**: pass1234 (hashed with bcrypt)
- **Role**: owner
- **Status**: active

## How to Seed the Database

### Option 1: Using npm script
```bash
cd server
pnpm run seed
```

### Option 2: Direct execution
```bash
cd server
node seed.js
```

## What the Seed Script Does

1. Connects to MongoDB using `MONGODB_URI` from `.env`
2. Checks if owner user already exists
3. If not exists:
   - Hashes the password from `OWNER_PASSWORD` env variable
   - Creates new owner user with full permissions
   - Sets status to 'active'
4. Exits with success message

## Authentication Flow

The authentication now uses MongoDB instead of environment variables:

1. User submits email and password
2. Backend queries MongoDB for user
3. Password is verified using bcrypt
4. JWT token is generated with user details
5. Last login timestamp is updated

## Adding More Users

To add collaborators or other users, you can:

1. Modify `seed.js` to add more users
2. Use the admin dashboard (when implemented)
3. Create users via API endpoints

## Security Notes

- Passwords are hashed using bcrypt (salt rounds: 10)
- JWT tokens expire after 7 days
- Environment variables should never be committed to version control
- Change default credentials in production
