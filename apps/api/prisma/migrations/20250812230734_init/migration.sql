BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Club] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [slug] NVARCHAR(1000) NOT NULL,
    [brandingJson] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Club_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Club_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Club_slug_key] UNIQUE NONCLUSTERED ([slug])
);

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000),
    [role] NVARCHAR(32) NOT NULL CONSTRAINT [User_role_df] DEFAULT 'PLAYER',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[ClubMember] (
    [clubId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(32) NOT NULL CONSTRAINT [ClubMember_role_df] DEFAULT 'PLAYER',
    CONSTRAINT [ClubMember_pkey] PRIMARY KEY CLUSTERED ([clubId],[userId])
);

-- CreateTable
CREATE TABLE [dbo].[Competition] (
    [id] NVARCHAR(1000) NOT NULL,
    [clubId] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [sport] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(32) NOT NULL CONSTRAINT [Competition_status_df] DEFAULT 'DRAFT',
    [entryFeeCents] INT NOT NULL,
    [currency] NVARCHAR(8) NOT NULL CONSTRAINT [Competition_currency_df] DEFAULT 'EUR',
    [rulesJson] NVARCHAR(max),
    [startRoundAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Competition_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Competition_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Round] (
    [id] NVARCHAR(1000) NOT NULL,
    [competitionId] NVARCHAR(1000) NOT NULL,
    [roundNumber] INT NOT NULL,
    [pickDeadlineAt] DATETIME2 NOT NULL,
    [status] NVARCHAR(32) NOT NULL CONSTRAINT [Round_status_df] DEFAULT 'UPCOMING',
    CONSTRAINT [Round_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Team] (
    [id] NVARCHAR(1000) NOT NULL,
    [leagueId] NVARCHAR(1000),
    [name] NVARCHAR(1000) NOT NULL,
    [extRef] NVARCHAR(1000),
    CONSTRAINT [Team_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Fixture] (
    [id] NVARCHAR(1000) NOT NULL,
    [competitionId] NVARCHAR(1000) NOT NULL,
    [roundId] NVARCHAR(1000) NOT NULL,
    [homeTeamId] NVARCHAR(1000) NOT NULL,
    [awayTeamId] NVARCHAR(1000) NOT NULL,
    [kickoffAt] DATETIME2 NOT NULL,
    [status] NVARCHAR(32) NOT NULL CONSTRAINT [Fixture_status_df] DEFAULT 'SCHEDULED',
    [result] NVARCHAR(32),
    CONSTRAINT [Fixture_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[CompetitionEntry] (
    [id] NVARCHAR(1000) NOT NULL,
    [competitionId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(32) NOT NULL CONSTRAINT [CompetitionEntry_status_df] DEFAULT 'PENDING',
    [stripePaymentId] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [CompetitionEntry_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [CompetitionEntry_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [CompetitionEntry_competitionId_userId_key] UNIQUE NONCLUSTERED ([competitionId],[userId])
);

-- CreateTable
CREATE TABLE [dbo].[Pick] (
    [id] NVARCHAR(1000) NOT NULL,
    [competitionEntryId] NVARCHAR(1000) NOT NULL,
    [roundId] NVARCHAR(1000) NOT NULL,
    [teamId] NVARCHAR(1000) NOT NULL,
    [madeAt] DATETIME2 NOT NULL CONSTRAINT [Pick_madeAt_df] DEFAULT CURRENT_TIMESTAMP,
    [status] NVARCHAR(32) NOT NULL CONSTRAINT [Pick_status_df] DEFAULT 'PENDING',
    CONSTRAINT [Pick_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Pick_competitionEntryId_roundId_key] UNIQUE NONCLUSTERED ([competitionEntryId],[roundId])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ClubMember_userId_idx] ON [dbo].[ClubMember]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Competition_clubId_status_idx] ON [dbo].[Competition]([clubId], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Round_competitionId_roundNumber_idx] ON [dbo].[Round]([competitionId], [roundNumber]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Fixture_roundId_idx] ON [dbo].[Fixture]([roundId]);

-- AddForeignKey
ALTER TABLE [dbo].[ClubMember] ADD CONSTRAINT [ClubMember_clubId_fkey] FOREIGN KEY ([clubId]) REFERENCES [dbo].[Club]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ClubMember] ADD CONSTRAINT [ClubMember_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Competition] ADD CONSTRAINT [Competition_clubId_fkey] FOREIGN KEY ([clubId]) REFERENCES [dbo].[Club]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Round] ADD CONSTRAINT [Round_competitionId_fkey] FOREIGN KEY ([competitionId]) REFERENCES [dbo].[Competition]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Fixture] ADD CONSTRAINT [Fixture_roundId_fkey] FOREIGN KEY ([roundId]) REFERENCES [dbo].[Round]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CompetitionEntry] ADD CONSTRAINT [CompetitionEntry_competitionId_fkey] FOREIGN KEY ([competitionId]) REFERENCES [dbo].[Competition]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CompetitionEntry] ADD CONSTRAINT [CompetitionEntry_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Pick] ADD CONSTRAINT [Pick_competitionEntryId_fkey] FOREIGN KEY ([competitionEntryId]) REFERENCES [dbo].[CompetitionEntry]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
