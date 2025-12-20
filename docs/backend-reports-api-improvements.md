# Backend Reports API Improvements

## Current Issue

The `/reports/user/{userId}` endpoint has ambiguous behavior. The API documentation states:

> "Retrieves all reports for a specific user. Admins can view any user's reports, users can only view their own reports."

This description is unclear about what "reports for a specific user" means:
- **Option A**: Reports **submitted BY** the user (where `reporterId === userId`)
- **Option B**: Reports **about** the user (where `reportedUserId === userId`)

Currently, the endpoint appears to return reports **about** the user (`reportedUserId`), but for the "My Reports" page, we need reports **submitted BY** the user (`reporterId`).

## Current Workaround

The mobile app currently works around this by:
1. Fetching all reports from `/reports/user/{userId}`
2. Filtering client-side to only include reports where `reporterId === userId`
3. Applying pagination client-side

This is inefficient and not scalable, especially as the number of reports grows.

## Recommended Backend Changes

### Option 1: Add Query Parameter (Recommended)

Modify the existing `/reports/user/{userId}` endpoint to accept a query parameter that specifies which type of reports to return.

**Endpoint**: `GET /reports/user/{userId}`

**New Query Parameters**:
- `type` (optional, enum): 
  - `"submitted"` - Returns reports submitted BY the user (where `reporterId === userId`)
  - `"received"` - Returns reports ABOUT the user (where `reportedUserId === userId`)
  - Default: `"submitted"` (for backward compatibility and most common use case)

**Example Requests**:
```
GET /reports/user/123?type=submitted&skip=0&take=20
GET /reports/user/123?type=received&skip=0&take=20
```

**Updated API Documentation**:
```yaml
"/reports/user/{userId}": {
  "get": {
    "description": "Retrieves reports for a specific user. Use the 'type' parameter to specify whether to return reports submitted BY the user or reports ABOUT the user. Admins can view any user's reports, users can only view their own reports.",
    "operationId": "ReportController_getReportsByUser",
    "parameters": [
      {
        "name": "userId",
        "required": true,
        "in": "path",
        "description": "User ID",
        "schema": {
          "example": 1,
          "type": "number"
        }
      },
      {
        "name": "type",
        "required": false,
        "in": "query",
        "description": "Type of reports to retrieve: 'submitted' for reports submitted by the user (reporterId), 'received' for reports about the user (reportedUserId). Defaults to 'submitted'.",
        "schema": {
          "enum": ["submitted", "received"],
          "type": "string",
          "default": "submitted"
        }
      },
      {
        "name": "skip",
        "required": false,
        "in": "query",
        "description": "Number of records to skip for pagination",
        "schema": {
          "example": 0,
          "type": "number"
        }
      },
      {
        "name": "take",
        "required": false,
        "in": "query",
        "description": "Number of records to return",
        "schema": {
          "example": 20,
          "type": "number"
        }
      }
    ],
    "responses": {
      "200": {
        "description": "Reports retrieved successfully",
        "content": {
          "application/json": {
            "schema": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/ReportResponseDto"
              }
            }
          }
        }
      },
      "401": {
        "description": "Unauthorized - Invalid or missing JWT token"
      },
      "403": {
        "description": "Forbidden - Can only view own reports unless admin"
      }
    },
    "security": [
      {
        "bearer": []
      }
    ],
    "summary": "Get reports for a user",
    "tags": [
      "Reports"
    ]
  }
}
```

### Option 2: Create Separate Endpoints

Create two distinct endpoints for clarity:

**Endpoint 1**: `GET /reports/user/{userId}/submitted`
- Returns reports **submitted BY** the user (where `reporterId === userId`)
- Used for "My Reports" page

**Endpoint 2**: `GET /reports/user/{userId}/received`
- Returns reports **about** the user (where `reportedUserId === userId`)
- Used for viewing reports received against a user account

**Example API Documentation**:
```yaml
"/reports/user/{userId}/submitted": {
  "get": {
    "description": "Retrieves all reports submitted BY a specific user (where reporterId === userId). Admins can view any user's submitted reports, users can only view their own submitted reports.",
    "operationId": "ReportController_getReportsSubmittedByUser",
    "parameters": [
      {
        "name": "userId",
        "required": true,
        "in": "path",
        "description": "User ID",
        "schema": {
          "example": 1,
          "type": "number"
        }
      },
      {
        "name": "skip",
        "required": false,
        "in": "query",
        "description": "Number of records to skip for pagination",
        "schema": {
          "example": 0,
          "type": "number"
        }
      },
      {
        "name": "take",
        "required": false,
        "in": "query",
        "description": "Number of records to return",
        "schema": {
          "example": 20,
          "type": "number"
        }
      }
    ],
    "responses": {
      "200": {
        "description": "Reports submitted by the user retrieved successfully",
        "content": {
          "application/json": {
            "schema": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/ReportResponseDto"
              }
            }
          }
        }
      },
      "401": {
        "description": "Unauthorized - Invalid or missing JWT token"
      },
      "403": {
        "description": "Forbidden - Can only view own reports unless admin"
      }
    },
    "security": [
      {
        "bearer": []
      }
    ],
    "summary": "Get reports submitted by a user",
    "tags": [
      "Reports"
    ]
  }
},
"/reports/user/{userId}/received": {
  "get": {
    "description": "Retrieves all reports ABOUT a specific user (where reportedUserId === userId). Admins can view any user's received reports, users can only view their own received reports.",
    "operationId": "ReportController_getReportsReceivedByUser",
    "parameters": [
      {
        "name": "userId",
        "required": true,
        "in": "path",
        "description": "User ID",
        "schema": {
          "example": 1,
          "type": "number"
        }
      },
      {
        "name": "skip",
        "required": false,
        "in": "query",
        "description": "Number of records to skip for pagination",
        "schema": {
          "example": 0,
          "type": "number"
        }
      },
      {
        "name": "take",
        "required": false,
        "in": "query",
        "description": "Number of records to return",
        "schema": {
          "example": 20,
          "type": "number"
        }
      }
    ],
    "responses": {
      "200": {
        "description": "Reports received by the user retrieved successfully",
        "content": {
          "application/json": {
            "schema": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/ReportResponseDto"
              }
            }
          }
        }
      },
      "401": {
        "description": "Unauthorized - Invalid or missing JWT token"
      },
      "403": {
        "description": "Forbidden - Can only view own reports unless admin"
      }
    },
    "security": [
      {
        "bearer": []
      }
    ],
    "summary": "Get reports received by a user",
    "tags": [
      "Reports"
    ]
  }
}
```

## Recommended Implementation: Option 1

**We recommend Option 1** (adding a query parameter) because:
1. **Backward Compatible**: Existing code continues to work (defaults to "submitted")
2. **Single Endpoint**: Maintains RESTful design with one endpoint
3. **Flexible**: Easy to extend in the future if needed
4. **Clear Intent**: The `type` parameter makes the intent explicit

## Implementation Details

### Backend Controller Changes

```typescript
// Example implementation (NestJS/Express style)

@Get('user/:userId')
async getReportsByUser(
  @Param('userId') userId: number,
  @Query('type') type: 'submitted' | 'received' = 'submitted',
  @Query('skip') skip?: number,
  @Query('take') take?: number,
) {
  // Validate user access (users can only view their own reports unless admin)
  const currentUserId = this.getCurrentUserId(); // From JWT token
  const isAdmin = this.isAdmin();
  
  if (!isAdmin && currentUserId !== userId) {
    throw new ForbiddenException('Can only view own reports unless admin');
  }

  // Build query based on type
  const where: any = {};
  
  if (type === 'submitted') {
    // Reports submitted BY the user
    where.reporterId = userId;
  } else if (type === 'received') {
    // Reports ABOUT the user
    where.reportedUserId = userId;
  }

  // Apply pagination
  const reports = await this.reportsService.findMany({
    where,
    skip: skip || 0,
    take: take || 20,
    orderBy: { createdAt: 'desc' },
  });

  return reports;
}
```

### Database Query Optimization

Ensure the database has proper indexes:
- Index on `reporterId` for efficient queries of submitted reports
- Index on `reportedUserId` for efficient queries of received reports
- Composite index on `(reporterId, createdAt)` for sorted submitted reports
- Composite index on `(reportedUserId, createdAt)` for sorted received reports

## Mobile App Changes Required

Once the backend is updated, the mobile app should:

1. **Update API Client** (`services/api/endpoints/reports.ts`):
   ```typescript
   export interface GetReportsByUserParams {
     skip?: number;
     take?: number;
     type?: "submitted" | "received"; // New parameter
   }

   getReportsByUser: (
     userId: number,
     params?: GetReportsByUserParams
   ): Promise<ReportResponseDto[]> => {
     return getApiClient().get<ReportResponseDto[]>(
       `/reports/user/${userId}`,
       params
     );
   },
   ```

2. **Update Consumer Reports Page** (`app/(consumers)/my-reports.tsx`):
   ```typescript
   const data = await reportsApi.getReportsByUser(userId, {
     type: "submitted", // Explicitly request submitted reports
     skip: currentPage * ITEMS_PER_PAGE,
     take: ITEMS_PER_PAGE,
   });
   // Remove client-side filtering - backend handles it now
   setReports(data);
   ```

3. **Update Retailer Reports Page** (`app/(retailers)/my-reports.tsx`):
   - Same changes as consumer page

## Additional Considerations

### Store Reports

The `/reports/store/{storeId}` endpoint should also be reviewed for similar clarity:
- Does it return reports **about** the store (where `reportedStoreId === storeId`)?
- This seems correct for the retailer's "Reports on Your Store" feature

### Admin Features

For admin report details modal, we may want:
- `GET /reports/user/{userId}/submitted` - To see all reports a user has submitted
- `GET /reports/user/{userId}/received` - To see all reports received by a user
- `GET /reports/store/{storeId}` - Already exists and works correctly

## Testing Checklist

After implementing the backend changes:

- [ ] Test `/reports/user/{userId}?type=submitted` returns reports where `reporterId === userId`
- [ ] Test `/reports/user/{userId}?type=received` returns reports where `reportedUserId === userId`
- [ ] Test default behavior (no `type` parameter) defaults to `"submitted"`
- [ ] Test pagination works correctly with both types
- [ ] Test access control (users can only view their own reports unless admin)
- [ ] Test admin can view any user's reports
- [ ] Verify database indexes are in place for performance
- [ ] Update Swagger/OpenAPI documentation
- [ ] Update mobile app to use new parameter
- [ ] Remove client-side filtering workaround

## Summary

The main issue is that the current `/reports/user/{userId}` endpoint is ambiguous. Adding a `type` query parameter (`"submitted"` or `"received"`) will:
1. Make the API behavior explicit and clear
2. Improve performance by filtering on the backend
3. Enable proper pagination
4. Maintain backward compatibility with a sensible default

This change will eliminate the need for client-side filtering and improve the overall user experience.
