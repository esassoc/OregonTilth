
CREATE TABLE [dbo].[User](
	[UserID] [int] IDENTITY(1,1) NOT NULL,
	-- Auth0 'sub' claim (e.g. 'auth0|68f...'), which is not a GUID, so it cannot reuse UserGuid.
	-- Populated on a user's first Auth0 sign-in: User.UpdateClaims matches the existing row by
	-- Email (unique via AK_User_Email) and stamps the GlobalID, preserving role and workbook data.
	[GlobalID] [varchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	-- Retired Keystone identifier. No longer read by the application; retained for one release so
	-- a rollback is possible. Note DropObjectsNotInSource=True, so removing this line drops the
	-- column and its data on the next publish.
	[UserGuid] [uniqueidentifier] NULL,
	[FirstName] [varchar](100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[LastName] [varchar](100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[Email] [varchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[Phone] [varchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[RoleID] [int] NOT NULL,
	[CreateDate] [datetime] NOT NULL,
	[UpdateDate] [datetime] NULL,
	[LastActivityDate] [datetime] NULL,
	[DisclaimerAcknowledgedDate] [datetime] NULL,
	[IsActive] [bit] NOT NULL,
	[ReceiveSupportEmails] [bit] NOT NULL,
	[LoginName] [varchar](128) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[Company] [varchar](100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
 CONSTRAINT [PK_User_UserID] PRIMARY KEY CLUSTERED 
(
	[UserID] ASC
),
 CONSTRAINT [AK_User_Email] UNIQUE NONCLUSTERED
(
	[Email] ASC
),
 CONSTRAINT [AK_User_GlobalID] UNIQUE NONCLUSTERED
(
	[GlobalID] ASC
),
CONSTRAINT [FK_User_Role_RoleID] FOREIGN KEY([RoleID]) REFERENCES [dbo].[Role] ([RoleID])

);

GO
