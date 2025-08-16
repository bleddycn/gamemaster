BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Competition] ADD [templateId] NVARCHAR(1000);

-- CreateTable
CREATE TABLE [dbo].[GameTemplate] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [gameType] NVARCHAR(32) NOT NULL,
    [sport] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(32) NOT NULL CONSTRAINT [GameTemplate_status_df] DEFAULT 'DRAFT',
    [activationOpenAt] DATETIME2,
    [activationCloseAt] DATETIME2,
    [joinOpenAt] DATETIME2,
    [joinCloseAt] DATETIME2,
    [startAt] DATETIME2 NOT NULL,
    [rulesJson] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [GameTemplate_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [GameTemplate_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [GameTemplate_status_startAt_idx] ON [dbo].[GameTemplate]([status], [startAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Competition_templateId_idx] ON [dbo].[Competition]([templateId]);

-- AddForeignKey
ALTER TABLE [dbo].[Competition] ADD CONSTRAINT [Competition_templateId_fkey] FOREIGN KEY ([templateId]) REFERENCES [dbo].[GameTemplate]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH