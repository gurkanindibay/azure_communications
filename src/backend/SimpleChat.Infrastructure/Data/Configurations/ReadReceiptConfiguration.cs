using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SimpleChat.Core.Entities;

namespace SimpleChat.Infrastructure.Data.Configurations;

public class ReadReceiptConfiguration : IEntityTypeConfiguration<ReadReceipt>
{
    public void Configure(EntityTypeBuilder<ReadReceipt> builder)
    {
        builder.ToTable("ReadReceipts");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.ReadAt)
            .IsRequired();

        // Composite index for faster lookups
        builder.HasIndex(r => new { r.MessageId, r.UserId })
            .IsUnique();

        builder.HasIndex(r => r.UserId);
    }
}
