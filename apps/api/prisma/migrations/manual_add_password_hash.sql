-- Add passwordHash field to User table
ALTER TABLE [dbo].[User] ADD [passwordHash] NVARCHAR(255) NULL;