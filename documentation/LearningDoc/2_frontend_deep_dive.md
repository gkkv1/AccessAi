# Frontend Deep Dive: Entry & Providers

## 1. Entry Point: `main.tsx`

This is the absolute beginning of the React application.

```tsx
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
```

**breakdown:**
-   **`createRoot(...)`**: This uses the modern React 18 Concurrent Mode API. It takes the `div` with `id="root"` from your `index.html` and takes full control of it.
-   **`render(<App />)`**: It mounts your root component, `App`, inside that div.
-   **`import "./index.css"`**: This imports the global styles (Tailwind directives) so they apply to the entire app.

## 2. Root Component: `App.tsx`

`App.tsx` is primarily a **Provider Tree**. In React, context providers must wrap the components that need access to that data.

**The Stack of Providers:**
1.  **`QueryClientProvider`**: Sets up `TanStack Query` for fetching data (API calls). It manages caching, loading states, and retries for your API requests.
2.  **`AuthProvider`**: Manages the logged-in user. It sits high up so *everything* knows who the user is.
3.  **`AccessibilityProvider`**: Manages UI preferences (high contrast, fonts). Sits high so it can apply classes to the `<html>` tag dynamically.
4.  **`FocusProvider`**: Manages "Focus Mode".
5.  **`TooltipProvider`**: Required by the UI library (shadcn/ui) for tooltips to work.
6.  **`BrowserRouter`**: Enables Routing (switching pages).

## 3. Providers in Detail

### A. `AccessibilityContext.tsx`
This custom provider handles the specific needs of disabled users.

-   **State**: Stores `highContrast`, `textSize`, `dyslexiaFont`, and `reduceMotion`.
-   **Persistence**: Saves settings to `localStorage` so they apply when the user comes back.
-   **The "Magic" (`useEffect`)**:
    ```tsx
    useEffect(() => {
      // It grabs the global <html> element
      const root = document.documentElement;

      // Manually adds/removes CSS classes
      if (settings.highContrast) root.classList.add('high-contrast');
      root.classList.add(`text-size-${settings.textSize}`);
      // ...
    }, [settings]);
    ```
    This approach allows you to change the entire look of the site just by toggling a state! The CSS (likely in `index.css`) will have rules like `.high-contrast { filter: contrast(1.5); }`.

### B. `AuthContext.tsx`
This is your security center.

-   **State**: `user` object and `token` string (JWT).
-   **Helper**: `api` (Custom Axios instance).
-   **Interceptor Pattern**:
    ```tsx
    useEffect(() => {
        if (token) {
            // Automatically adds "Authorization: Bearer <token>" to EVERY request
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    }, [token]);
    ```
    This is critical. It means you don't have to manually pass the token in every single API call in your pages. The provider handles it globally.
-   **Initialization**: On first load (`useEffect`), it checks if there is a token in `localStorage`. If yes, it calls `/auth/me` to fetch the user profile.

### C. `FocusContext.tsx`
A simpler provider for the "Focus Mode" feature.

-   **State**: `isFocusMode` (boolean).
-   **Function**: Toggles a simplified UI (likely hiding the sidebar/header) to help users with ADHD or cognitive load issues concentrate on the content.
