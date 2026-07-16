# MongoDB Connection Fix - Complete

## Date: July 7, 2026
## Service: flora-cms-commerce
## Status: RESOLVED

---

## Problem Summary

The `flora-cms-commerce` service was experiencing continuous crash loops due to a MongoDB connection failure:

```
Error: getaddrinfo ENOTFOUND mongodb.railway.internal
```

**Root Cause**: The service was configured with a hardcoded MongoDB connection string that used `mongodb.railway.internal` as the hostname, but the service did not have the proper Railway service reference set up to enable DNS resolution of the internal MongoDB service.

---

## Solution Implemented

### 1. Variable Update via Railway API

Since the Railway CLI's `railway variables --set` command was not properly updating the service reference variable, we used the Railway GraphQL API directly:

**API Endpoint**: `https://backboard.railway.app/graphql/v2`

**Mutation Used**:
```graphql
mutation variableUpsert($input: VariableUpsertInput!) {
  variableUpsert(input: $input)
}
```

**Variables**:
```json
{
  "input": {
    "projectId": "cd195e4e-0f62-4740-ac08-a65e8a4094de",
    "environmentId": "77fc6a97-c98b-4596-af0e-b6c87785e27b",
    "serviceId": "6be2e29c-e670-47e7-a8c3-059681e0110e",
    "name": "MONGODB_URI",
    "value": "${{MongoDB-original.MONGO_URL}}"
  }
}
```

**Result**: `{"data":{"variableUpsert":true}}`

### 2. Service Configuration

**Before**:
```
MONGODB_URI=mongodb://mongo:LegGfRDdPGDxZgqDGbqjFJWlWASmCGNB@mongodb.railway.internal:27017
```

**After**:
```
MONGODB_URI=${{MongoDB-original.MONGO_URL}}
```

This change enables Railway to automatically resolve the MongoDB service connection string at runtime, ensuring proper DNS resolution and service connectivity through Railway's internal networking.

### 3. Deployment

Triggered a fresh deployment using:
```bash
railway up --service flora-cms-commerce --environment production --detach
```

---

## Verification

### Successful Connection Logs

```
2026-07-08 03:36:22 [info]: MongoDB Connected: mongodb.railway.internal
2026-07-08 03:36:22 [info]: File logging disabled: running on cloud platform (logs aggregated from stdout)
2026-07-08 03:36:22 [info]: Database connected successfully
2026-07-08 03:36:22 [info]: Registered 2 providers
2026-07-08 03:36:22 [info]: Flora CMS-Commerce microservice running on port 4002
2026-07-08 03:36:22 [info]: Environment: production
2026-07-08 03:36:22 [info]: Health check: http://localhost:4002/health
```

### Key Success Indicators

- No `ENOTFOUND` errors
- MongoDB connection established: `MongoDB Connected: mongodb.railway.internal`
- Database initialized: `Database connected successfully`
- Service running on port 4002
- No crash loops
- Health check endpoint available

---

## Technical Details

### Railway Service Reference Syntax

Railway uses the syntax `${{ServiceName.VARIABLE_NAME}}` to create dynamic references between services. Key features:

1. **Dynamic Resolution**: Railway resolves these references at deployment time
2. **Service Discovery**: Enables proper DNS resolution of Railway internal services
3. **Automatic Updates**: If the MongoDB connection details change, all referencing services automatically get updated values
4. **Environment Isolation**: References are scoped to the specific environment

### MongoDB Service Details

**Service Name**: `MongoDB-original`
**Service ID**: `d0f36945-92b5-4ac5-85cf-7e2d629d007d`
**Internal Domain**: `mongodb.railway.internal`
**Connection Variable**: `MONGO_URL`

The `MongoDB-original` service exposes multiple connection-related variables:
- `MONGO_URL`: Full connection string for internal network
- `MONGO_PUBLIC_URL`: External connection string via Railway's TCP proxy
- `MONGOHOST`: Internal hostname
- `MONGOPORT`: Port number (27017)
- `MONGOUSER`: Username
- `MONGOPASSWORD`: Password

---

## Railway CLI Limitations Encountered

During implementation, we discovered that the Railway CLI v4.23.0's `railway variables --set` command does not properly handle service reference syntax with special characters like `${{}}`. The command would execute without errors but would not update the variable value.

**Workaround**: Use the Railway Public API with GraphQL mutations for programmatic variable management, especially when dealing with service references.

---

## Next Steps

The service is now running successfully. No further action required for this issue.

### Recommended Monitoring

1. Monitor the service logs for any connection issues
2. Verify the health check endpoint responds correctly
3. Ensure database operations are functioning as expected

---

## References

- [Railway Variables Reference](https://docs.railway.com/variables/reference)
- [Manage Variables with Public API](https://docs.railway.com/guides/manage-variables)
- [Railway Database Reference Variables](https://blog.railway.com/p/database-reference-variables)

---

## Service Information

**Project**: Passbook Flora (`cd195e4e-0f62-4740-ac08-a65e8a4094de`)
**Environment**: production (`77fc6a97-c98b-4596-af0e-b6c87785e27b`)
**Service**: flora-cms-commerce (`6be2e29c-e670-47e7-a8c3-059681e0110e`)
**Port**: 4002
**Health Check**: http://localhost:4002/health
