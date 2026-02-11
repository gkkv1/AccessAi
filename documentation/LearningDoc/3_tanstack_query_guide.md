# Deep Dive: TanStack Query (`QueryClientProvider`)

You asked about `<QueryClientProvider client={queryClient}>`. This component is the bridge between React and **TanStack Query** (formerly React Query), which is the library this project uses for **Server State Management**.

## 1. What is it?
TanStack Query is a library that handles:
-   **Fetching** data from the backend.
-   **Caching** that data (so we don't hit the server constantly).
-   **Synchronizing** server state (keeping the UI up to date).
-   **Updating** data (Mutations).

It replaces the need for standard `useEffect` + `useState` logic for API calls.

## 2. The Setup (`App.tsx`)

```tsx
// 1. Create the Client
const queryClient = new QueryClient();

const App = () => (
  // 2. Wrap the App
  <QueryClientProvider client={queryClient}>
     {/* ... rest of the app */}
  </QueryClientProvider>
);
```

-   **`queryClient`**: This object holds the **Cache**. It remembers every API response.
-   **`QueryClientProvider`**: Passing `client={queryClient}` makes this cache available to every component in the app via hooks like `useQuery`.

## 3. Real-World Example: `DocumentsPage.tsx`

We use it extensively in `DocumentsPage.tsx`.

### A. Fetching Data (`useQuery`)
Instead of a `useEffect` that runs `fetch(...)`, we do this:

```tsx
const { data: documents = [], isLoading } = useQuery({
  queryKey: ['documents'],            // Unique ID for this data
  queryFn: endpoints.getDocuments,    // The function that fetches data
  refetchInterval: (data) => {        // Auto-refresh logic
    // If any doc is 'processing', poll every 2 seconds
    return Array.isArray(data) && data.some(d => d.status === 'processing') 
      ? 2000 
      : false;
  }
});
```

**Why is this better?**
1.  **Caching**: If you leave this page and come back, the data is shown *instantly* from cache while it refreshes in the background.
2.  **Auto-Polling**: The `refetchInterval` automatically checks for updates if a document is processing. No complex `setInterval` logic needed.

### B. Changing Data (`useMutation`)
When we want to upload a file, we use a mutation:

```tsx
const uploadMutation = useMutation({
  mutationFn: endpoints.uploadDocument, // The function that posts data
  onSuccess: () => {
    // THIS IS MAGIC: Tell the cache that 'documents' are old now.
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    toast.success("Document uploaded successfully");
  }
});
```

**The "Magic" of `invalidateQueries`**:
1.  User uploads a file.
2.  Upload finishes (`onSuccess`).
3.  We tell the `queryClient`: "The `['documents']` list is dirty/outdated."
4.  TanStack Query **automatically** re-runs the `useQuery` from Part A to get the fresh list.
5.  The UI updates automatically. You never have to manually push the new file into the state array.

## Summary
-   **`QueryClientProvider`**: The engine room.
-   **`useQuery`**: For reading data (GET). Handles loading, error, and caching.
-   **`useMutation`**: For writing data (POST/PUT/DELETE).
-   **`invalidateQueries`**: For refreshing data after a change.
