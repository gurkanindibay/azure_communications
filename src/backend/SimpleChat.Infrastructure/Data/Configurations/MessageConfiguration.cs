using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SimpleChat.Core.Entities;

namespace SimpleChat.Infrastructure.Data.Configurations;

public class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> builder)
    {
        builder.ToTable("Messages");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.Content)
            .IsRequired()
            .HasMaxLength(4000);

        builder.Property(m => m.AzureCommunicationMessageId)
            .HasMaxLength(200);

        builder.Property(m => m.SentAt)
            .IsRequired();

        builder.Property(m => m.IsDeleted)
            .HasDefaultValue(false);

        builder.Property(m => m.Type)
            .IsRequired()
            .HasConversion<int>();

        builder.HasMany(m => m.ReadReceipts)
            .WithOne(r => r.Message)
            .HasForeignKey(r => r.MessageId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes for performance
        builder.HasIndex(m => m.ChatThreadId);
        builder.HasIndex(m => m.SentAt);
        builder.HasIndex(m => new { m.ChatThreadId, m.SentAt });
    }
}
