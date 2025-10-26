-- Create SimpleChatDB database
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'SimpleChatDB')
BEGIN
    CREATE DATABASE SimpleChatDB;
END
GO

USE SimpleChatDB;
GO

-- This file will be executed when the container starts
-- EF Core migrations will create the actual schema
PRINT 'SimpleChatDB database created successfully';
GO
