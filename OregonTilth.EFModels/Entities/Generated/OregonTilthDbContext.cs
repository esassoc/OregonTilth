using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace OregonTilth.EFModels.Entities;

public partial class OregonTilthDbContext : DbContext
{
    public OregonTilthDbContext(DbContextOptions<OregonTilthDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Crop> Crops { get; set; }

    public virtual DbSet<CropSpecificInfo> CropSpecificInfos { get; set; }

    public virtual DbSet<CropUnit> CropUnits { get; set; }

    public virtual DbSet<CropYieldInformation> CropYieldInformations { get; set; }

    public virtual DbSet<CustomRichText> CustomRichTexts { get; set; }

    public virtual DbSet<FieldDefinition> FieldDefinitions { get; set; }

    public virtual DbSet<FieldInputByCrop> FieldInputByCrops { get; set; }

    public virtual DbSet<FieldInputCost> FieldInputCosts { get; set; }

    public virtual DbSet<FieldLaborActivity> FieldLaborActivities { get; set; }

    public virtual DbSet<FieldLaborByCrop> FieldLaborByCrops { get; set; }

    public virtual DbSet<FieldStandardTime> FieldStandardTimes { get; set; }

    public virtual DbSet<FileResource> FileResources { get; set; }

    public virtual DbSet<HarvestPostHarvestStandardTime> HarvestPostHarvestStandardTimes { get; set; }

    public virtual DbSet<Machinery> Machineries { get; set; }

    public virtual DbSet<Page> Pages { get; set; }

    public virtual DbSet<TimeStudy> TimeStudies { get; set; }

    public virtual DbSet<TransplantProductionInformation> TransplantProductionInformations { get; set; }

    public virtual DbSet<TransplantProductionInput> TransplantProductionInputs { get; set; }

    public virtual DbSet<TransplantProductionInputCost> TransplantProductionInputCosts { get; set; }

    public virtual DbSet<TransplantProductionLaborActivity> TransplantProductionLaborActivities { get; set; }

    public virtual DbSet<TransplantProductionLaborActivityByCrop> TransplantProductionLaborActivityByCrops { get; set; }

    public virtual DbSet<TransplantProductionStandardTime> TransplantProductionStandardTimes { get; set; }

    public virtual DbSet<TransplantProductionTrayType> TransplantProductionTrayTypes { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<Workbook> Workbooks { get; set; }

    public virtual DbSet<vFieldLaborActivityForTimeStudy> vFieldLaborActivityForTimeStudies { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Crop>(entity =>
        {
            entity.HasKey(e => e.CropID).HasName("PK_Crop_CropID");
        });

        modelBuilder.Entity<CropSpecificInfo>(entity =>
        {
            entity.HasKey(e => e.CropSpecificInfoID).HasName("PK_CropSpecificInfo_CropSpecificInfoD");

            entity.HasOne(d => d.Crop).WithMany(p => p.CropSpecificInfos).OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<CropUnit>(entity =>
        {
            entity.HasKey(e => e.CropUnitID).HasName("PK_CropUnit_CropUnitID");
        });

        modelBuilder.Entity<CropYieldInformation>(entity =>
        {
            entity.HasKey(e => e.CropYieldInformationID).HasName("PK_CropYieldInformation_CropYieldInformationID");

            entity.HasOne(d => d.Crop).WithMany(p => p.CropYieldInformations).OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.CropUnit).WithMany(p => p.CropYieldInformations).OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<CustomRichText>(entity =>
        {
            entity.HasKey(e => e.CustomRichTextID).HasName("PK_CustomRichText_CustomRichTextID");
        });

        modelBuilder.Entity<FieldDefinition>(entity =>
        {
            entity.HasKey(e => e.FieldDefinitionID).HasName("PK_FieldDefinition_FieldDefinitionID");
        });

        modelBuilder.Entity<FieldInputByCrop>(entity =>
        {
            entity.HasKey(e => e.FieldInputByCropID).HasName("PK_FieldInputByCrop_FieldInputByCropID");

            entity.HasOne(d => d.Crop).WithMany(p => p.FieldInputByCrops).OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.FieldInputCost).WithMany(p => p.FieldInputByCrops).OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<FieldInputCost>(entity =>
        {
            entity.HasKey(e => e.FieldInputCostID).HasName("PK_FieldInputCost_FieldInputCostID");
        });

        modelBuilder.Entity<FieldLaborActivity>(entity =>
        {
            entity.HasKey(e => e.FieldLaborActivityID).HasName("PK_FieldLaborActivity_FieldLaborActivityID");
        });

        modelBuilder.Entity<FieldLaborByCrop>(entity =>
        {
            entity.HasKey(e => e.FieldLaborByCropID).HasName("PK_FieldLaborByCrop_FieldLaborByCropID");

            entity.HasOne(d => d.Crop).WithMany(p => p.FieldLaborByCrops).OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.FieldStandardTime).WithMany(p => p.FieldLaborByCrops).OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<FieldStandardTime>(entity =>
        {
            entity.HasKey(e => e.FieldStandardTimeID).HasName("PK_FieldStandardTime_FieldStandardTimeID");

            entity.HasOne(d => d.FieldLaborActivity).WithMany(p => p.FieldStandardTimes).OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<FileResource>(entity =>
        {
            entity.HasKey(e => e.FileResourceID).HasName("PK_FileResource_FileResourceID");

            entity.HasOne(d => d.CreateUser).WithMany(p => p.FileResources)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_FileResource_User_CreateUserID_UserID");
        });

        modelBuilder.Entity<HarvestPostHarvestStandardTime>(entity =>
        {
            entity.HasKey(e => e.HarvestPostHarvestStandardTimeID).HasName("PK_HarvestPostHarvestStandardTime_HarvestPostHarvestStandardTimeID");

            entity.HasOne(d => d.Crop).WithMany(p => p.HarvestPostHarvestStandardTimes).OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.CropUnit).WithMany(p => p.HarvestPostHarvestStandardTimes).OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<Machinery>(entity =>
        {
            entity.HasKey(e => e.MachineryID).HasName("PK_Machinery_MachineryID");
        });

        modelBuilder.Entity<Page>(entity =>
        {
            entity.HasKey(e => e.PageID).HasName("PK_Page_PageID");
        });

        modelBuilder.Entity<TimeStudy>(entity =>
        {
            entity.HasKey(e => e.TimeStudyID).HasName("PK_TimeStudy_TimeStudyID");
        });

        modelBuilder.Entity<TransplantProductionInformation>(entity =>
        {
            entity.HasKey(e => e.TransplantProductionInformationID).HasName("PK_TransplantProductionInformation_TransplantProductionInformationID");

            entity.HasOne(d => d.Crop).WithMany(p => p.TransplantProductionInformations).OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.TransplantProductionTrayType).WithMany(p => p.TransplantProductionInformations).OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<TransplantProductionInput>(entity =>
        {
            entity.HasKey(e => e.TransplantProductionInputID).HasName("PK_TransplantProductionInput_TransplantProductionInputID");
        });

        modelBuilder.Entity<TransplantProductionInputCost>(entity =>
        {
            entity.HasKey(e => e.TransplantProductionInputCostID).HasName("PK_TransplantProductionInputCost_TransplantProductionInputCostID");

            entity.HasOne(d => d.TransplantProductionInput).WithMany(p => p.TransplantProductionInputCosts).OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.TransplantProductionTrayType).WithMany(p => p.TransplantProductionInputCosts)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_TransplantProductionTrayTypeCost_TransplantProductionTrayType_TransplantProductionTrayTypeID");
        });

        modelBuilder.Entity<TransplantProductionLaborActivity>(entity =>
        {
            entity.HasKey(e => e.TransplantProductionLaborActivityID).HasName("PK_TransplantProductionLaborActivity_TransplantProductionLaborActivityID");
        });

        modelBuilder.Entity<TransplantProductionLaborActivityByCrop>(entity =>
        {
            entity.HasKey(e => e.TransplantProductionLaborActivityByCropID).HasName("PK_TransplantProductionLaborActivityByCrop_TransplantProductionLaborActivityByCropID");

            entity.HasOne(d => d.TransplantProductionInformation).WithMany(p => p.TransplantProductionLaborActivityByCrops).OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.TransplantProductionLaborActivity).WithMany(p => p.TransplantProductionLaborActivityByCrops).OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<TransplantProductionStandardTime>(entity =>
        {
            entity.HasKey(e => e.TransplantProductionStandardTimeID).HasName("PK_TransplantProductionStandardTime_TransplantProductionStandardTimeID");

            entity.HasOne(d => d.TransplantProductionLaborActivity).WithMany(p => p.TransplantProductionStandardTimes).OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(d => d.TransplantProductionTrayType).WithMany(p => p.TransplantProductionStandardTimes).OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<TransplantProductionTrayType>(entity =>
        {
            entity.HasKey(e => e.TransplantProductionTrayTypeID).HasName("PK_TransplantProductionTrayType_TransplantProductionTrayTypeID");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserID).HasName("PK_User_UserID");

            entity.HasIndex(e => e.GlobalID, "AK_User_GlobalID")
                .IsUnique()
                .HasFilter("([GlobalID] IS NOT NULL)");
        });

        modelBuilder.Entity<Workbook>(entity =>
        {
            entity.HasKey(e => e.WorkbookID).HasName("PK_Workbook_WorkbookID");

            entity.HasOne(d => d.User).WithMany(p => p.Workbooks).OnDelete(DeleteBehavior.ClientSetNull);
        });

        modelBuilder.Entity<vFieldLaborActivityForTimeStudy>(entity =>
        {
            entity.ToView("vFieldLaborActivityForTimeStudy");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
