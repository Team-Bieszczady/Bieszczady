BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[meetings] ADD [attendee_count] INT,
[confirmed_at] DATETIME2,
[confirmed_by_id] NVARCHAR(1000),
[status] NVARCHAR(1000) NOT NULL CONSTRAINT [meetings_status_df] DEFAULT 'PLANNED';

-- CreateTable
CREATE TABLE [dbo].[meeting_attendance_files] (
    [id] NVARCHAR(1000) NOT NULL,
    [meeting_id] NVARCHAR(1000) NOT NULL,
    [document_id] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [meeting_attendance_files_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [meeting_attendance_files_meeting_id_document_id_key] UNIQUE NONCLUSTERED ([meeting_id],[document_id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [meeting_attendance_files_document_id_idx] ON [dbo].[meeting_attendance_files]([document_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [meetings_confirmed_by_id_idx] ON [dbo].[meetings]([confirmed_by_id]);

-- AddForeignKey
ALTER TABLE [dbo].[meetings] ADD CONSTRAINT [meetings_confirmed_by_id_fkey] FOREIGN KEY ([confirmed_by_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[meeting_attendance_files] ADD CONSTRAINT [meeting_attendance_files_meeting_id_fkey] FOREIGN KEY ([meeting_id]) REFERENCES [dbo].[meetings]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[meeting_attendance_files] ADD CONSTRAINT [meeting_attendance_files_document_id_fkey] FOREIGN KEY ([document_id]) REFERENCES [dbo].[documents]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

