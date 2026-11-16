# ShopEase

ShopEase is a full-stack application built with ASP.NET Core, React,
TypeScript, Vite, Entity Framework Core, and SQL Server.

## Solution projects

- `ShopEase/ShopEase.API` — ASP.NET Core Web API (`http://localhost:5083`)
- `ShopEase/ShopEase.Client` — React + TypeScript client (`http://localhost:5173`)

Open `ShopEase/ShopEase.slnx` in Visual Studio. Select the
`ShopEase Full Stack` launch profile to start both projects together.

## Command-line development

Run the API:

```powershell
dotnet run --project ShopEase/ShopEase.API
```

Run the client in another terminal:

```powershell
cd ShopEase/ShopEase.Client
npm.cmd install
npm.cmd run dev
```
Full Stack E-Commerce Web Application using ASP.NET Core, React and SQL Server
