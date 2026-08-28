BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[password_reset_tokens] (
    [id] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000) NOT NULL,
    [token_hash] NVARCHAR(1000) NOT NULL,
    [expires_at] DATETIME2 NOT NULL,
    [used_at] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [password_reset_tokens_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [password_reset_tokens_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [password_reset_tokens_token_hash_key] UNIQUE NONCLUSTERED ([token_hash])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
