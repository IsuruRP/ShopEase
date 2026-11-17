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

## Security configuration

Public registration always creates a `Customer`. To provision the first
administrator without committing credentials, configure .NET user secrets:

```powershell
cd ShopEase/ShopEase.API
dotnet user-secrets set "AdminSeed:Username" "store-admin"
dotnet user-secrets set "AdminSeed:Password" "use-a-long-unique-password"
dotnet user-secrets set "AdminSeed:Email" "admin@example.com"
```

The seed runs once and never promotes or overwrites an existing account.
Remove the seed secrets after the administrator has been created.

Password recovery logs its reset URL only in Development when SMTP is not
configured. For real email delivery, provide `PasswordRecovery:SmtpHost`,
`PasswordRecovery:SmtpPort`, `PasswordRecovery:SmtpUsername`,
`PasswordRecovery:SmtpPassword`, and `PasswordRecovery:FromEmail` through user
secrets or environment variables. Production must run over HTTPS because the
authentication cookie is `Secure`, `HttpOnly`, and `SameSite=Strict`.

Full Stack E-Commerce Web Application using ASP.NET Core, React and SQL Server
