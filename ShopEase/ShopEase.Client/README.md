# ShopEase.Client

React + TypeScript + Vite frontend for the ShopEase API.

## Run locally

1. Start `ShopEase.API` on `http://localhost:5083`.
2. Install and start the client:

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`.

The client uses `http://localhost:5083/api` by default. To use another API URL,
copy `.env.example` to `.env` and update `VITE_API_BASE_URL`.

The first account registered in an empty `Users` table receives the `Admin`
role. Later accounts receive the `Customer` role.
