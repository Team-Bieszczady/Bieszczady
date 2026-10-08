BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[participants] (
    [id] NVARCHAR(1000) NOT NULL,
    [first_name] NVARCHAR(1000) NOT NULL,
    [last_name] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000),
    [phone] NVARCHAR(1000),
    [address] NVARCHAR(500),
    [consent_at] DATETIME2,
    [note] NVARCHAR(max) NOT NULL CONSTRAINT [participants_note_df] DEFAULT '',
    [created_by_id] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [participants_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [deleted_at] DATETIME2,
    CONSTRAINT [participants_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[meeting_participants] (
    [id] NVARCHAR(1000) NOT NULL,
    [meeting_id] NVARCHAR(1000) NOT NULL,
    [participant_id] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [meeting_participants_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [meeting_participants_meeting_id_participant_id_key] UNIQUE NONCLUSTERED ([meeting_id],[participant_id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [participants_last_name_first_name_idx] ON [dbo].[participants]([last_name], [first_name]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [participants_created_by_id_idx] ON [dbo].[participants]([created_by_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [meeting_participants_participant_id_idx] ON [dbo].[meeting_participants]([participant_id]);

-- AddForeignKey
ALTER TABLE [dbo].[participants] ADD CONSTRAINT [participants_created_by_id_fkey] FOREIGN KEY ([created_by_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[meeting_participants] ADD CONSTRAINT [meeting_participants_meeting_id_fkey] FOREIGN KEY ([meeting_id]) REFERENCES [dbo].[meetings]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[meeting_participants] ADD CONSTRAINT [meeting_participants_participant_id_fkey] FOREIGN KEY ([participant_id]) REFERENCES [dbo].[participants]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

