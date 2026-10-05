BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[meetings] (
    [id] NVARCHAR(1000) NOT NULL,
    [project_id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [date] DATE NOT NULL,
    [start_time] NVARCHAR(1000) NOT NULL,
    [end_time] NVARCHAR(1000) NOT NULL,
    [place] NVARCHAR(1000),
    [meeting_url] NVARCHAR(1000),
    [note] NVARCHAR(max) NOT NULL CONSTRAINT [meetings_note_df] DEFAULT '',
    [created_by_id] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [meetings_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [deleted_at] DATETIME2,
    CONSTRAINT [meetings_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[meeting_invitees] (
    [id] NVARCHAR(1000) NOT NULL,
    [meeting_id] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [meeting_invitees_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [meeting_invitees_meeting_id_user_id_key] UNIQUE NONCLUSTERED ([meeting_id],[user_id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [meetings_project_id_date_idx] ON [dbo].[meetings]([project_id], [date]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [meetings_created_by_id_idx] ON [dbo].[meetings]([created_by_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [meeting_invitees_user_id_idx] ON [dbo].[meeting_invitees]([user_id]);

-- AddForeignKey
ALTER TABLE [dbo].[meetings] ADD CONSTRAINT [meetings_project_id_fkey] FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[meetings] ADD CONSTRAINT [meetings_created_by_id_fkey] FOREIGN KEY ([created_by_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[meeting_invitees] ADD CONSTRAINT [meeting_invitees_meeting_id_fkey] FOREIGN KEY ([meeting_id]) REFERENCES [dbo].[meetings]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[meeting_invitees] ADD CONSTRAINT [meeting_invitees_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
