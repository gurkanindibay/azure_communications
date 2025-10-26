using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SimpleChat.Core.Entities;

namespace SimpleChat.Infrastructure.Data.Configurations;

public class ChatThreadConfiguration : IEntityTypeConfiguration<ChatThread>
{
    public void Configure(EntityTypeBuilder<ChatThread> builder)
    {
        builder.ToTable("ChatThreads");

        builder.HasKey(ct => ct.Id);

        builder.Property(ct => ct.AzureCommunicationThreadId)
            .HasMaxLength(200);

        builder.HasIndex(ct => ct.AzureCommunicationThreadId);

        builder.Property(ct => ct.CreatedAt)
            .IsRequired();

        builder.Property(ct => ct.IsActive)
            .HasDefaultValue(true);

        // Relationships with Users
        builder.HasOne(ct => ct.User1)
            .WithMany(u => u.ChatThreadsAsParticipant)
            .HasForeignKey(ct => ct.User1Id)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ct => ct.User2)
            .WithMany()
            .HasForeignKey(ct => ct.User2Id)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(ct => ct.Messages)
            .WithOne(m => m.ChatThread)
            .HasForeignKey(m => m.ChatThreadId)
            .OnDelete(DeleteBehavior.Cascade);

        // Create index on User1Id and User2Id for faster lookups
        builder.HasIndex(ct => new { ct.User1Id, ct.User2Id });
    }
}
