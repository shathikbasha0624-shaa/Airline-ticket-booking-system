-- Run this script in SQL Server Management Studio (SSMS) or Azure Data Studio

-- 1. Create the Database
CREATE DATABASE Airline;
GO

USE Airline;
GO

-- 2. Create the Users Table for Authentication
CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- Note: In the Server/.env file, ensure your credentials match your SQL Server setup.
-- DB_SERVER=DESKTOP-UVIULNA
-- DB_NAME=Airline

