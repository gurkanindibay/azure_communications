using Microsoft.EntityFrameworkCore;
using SimpleChat.Core.Entities;

namespace SimpleChat.Infrastructure.Data;

public class SimpleChatDbContext : DbContext
{
    public SimpleChatDbContext(DbContextOptions<SimpleChatDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<ChatThread> ChatThreads { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<ReadReceipt> ReadReceipts { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all configurations from the current assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SimpleChatDbContext).Assembly);
    }
}
