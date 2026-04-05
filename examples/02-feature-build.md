# Example: Feature Build with continuous-improvement

## Scenario

Add pagination to a REST API endpoint: `GET /api/products`

## Agent without the framework

```
You: Add pagination to GET /api/products

Agent: I'll implement cursor-based pagination with infinite scroll support.
       *creates new PaginationHelper class*
       *modifies the products controller*
       *adds a new pagination middleware*
       *updates the Product model with a cursor field*
       Done! I've added cursor-based pagination with:
       - Cursor encoding/decoding
       - Page size limits
       - Total count header
       - Link headers for next/prev

You: We use offset-based pagination everywhere else in the app.
     Why did you create cursor-based?

Agent: Good point, let me redo this with offset pagination...
       *rewrites everything*

You: Also, we already have a paginate() helper in utils/query.ts.

Agent: Oh. Let me use that instead...
```

3 rewrites. Agent built an over-engineered solution without checking the codebase first.

## Agent with continuous-improvement

```
You: Add pagination to GET /api/products

Agent: **[Law 1: Research]**
       Searching for existing pagination...
       - utils/query.ts:15 — paginate(query, { page, limit }) helper exists
       - GET /api/orders (ordersController.ts:34) uses it: offset-based, ?page=1&limit=20
       - GET /api/users (usersController.ts:28) uses it too — same pattern
       - Response format: { data: [...], meta: { page, limit, total, totalPages } }

       **[Law 2: Plan]**
       WILL: Apply existing paginate() helper to products query
       WILL NOT: Create new pagination system, change pagination strategy, add cursor-based
       VERIFY: curl /api/products?page=2&limit=5 returns correct slice + meta

       **[Law 3: Execute]**
       Changed productsController.ts:
       - Imported paginate from utils/query
       - Replaced Product.find() with paginate(Product.find(), { page, limit })
       - page and limit from req.query, defaults 1 and 20 (matches /api/orders)

       **[Law 4: Verify]**
       ✓ npm test — 31/31 passing
       ✓ curl /api/products → returns 20 items + meta (total: 156, totalPages: 8)
       ✓ curl /api/products?page=2&limit=5 → items 6-10, meta correct
       ✓ curl /api/products?page=999 → empty data array, not an error
       ✓ Response format matches /api/orders exactly

       Done. 4 lines changed in productsController.ts.
       Used existing paginate() helper — consistent with /api/orders and /api/users.
```

## Which laws made the difference?

| Law | Impact |
|-----|--------|
| **Law 1: Research** | Found existing paginate() helper and offset-based convention |
| **Law 2: Plan** | "WILL NOT create new pagination system" prevented over-engineering |
| **Law 3: One Thing** | Just pagination, no "also add sorting and filtering" |
| **Law 4: Verify** | Tested edge case (page=999) and format consistency |
