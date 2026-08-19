-- Runs once against the SQL Server container (see the mssql-init service in
-- docker-compose.yml). Safe to re-run: every statement is guarded.
--
-- The SQL Server image does not create a database or an application login
-- on its own, so we do it here.

IF DB_ID('$(DbName)') IS NULL
  CREATE DATABASE [$(DbName)];
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = '$(DbUser)')
  CREATE LOGIN [$(DbUser)] WITH PASSWORD = '$(DbPassword)', CHECK_POLICY = OFF;
GO

-- Prisma Migrate creates a temporary "shadow database" to detect schema drift,
-- so the application login needs permission to create databases.
-- Acceptable for a local, throwaway container only.
-- Production must use narrowly scoped permissions.
ALTER SERVER ROLE [dbcreator] ADD MEMBER [$(DbUser)];
GO

USE [$(DbName)];
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = '$(DbUser)')
  CREATE USER [$(DbUser)] FOR LOGIN [$(DbUser)];
GO

ALTER ROLE [db_owner] ADD MEMBER [$(DbUser)];
GO

PRINT 'Database [$(DbName)] and login [$(DbUser)] are ready.';
GO
