using Microsoft.EntityFrameworkCore.Storage;
using SimpleChat.Core.Interfaces;
using SimpleChat.Infrastructure.Data;
using SimpleChat.Infrastructure.Repositories;

namespace SimpleChat.Infrastructure.UnitOfWork;

public class UnitOfWork : IUnitOfWork
{
    private readonly SimpleChatDbContext _context;
    private IDbContextTransaction? _transaction;
    
    private IUserRepository? _userRepository;
    private IChatThreadRepository? _chatThreadRepository;
    private IMessageRepository? _messageRepository;
    private IReadReceiptRepository? _readReceiptRepository;

    public UnitOfWork(SimpleChatDbContext context)
    {
        _context = context;
    }

    public IUserRepository Users => 
        _userRepository ??= new UserRepository(_context);

    public IChatThreadRepository ChatThreads => 
        _chatThreadRepository ??= new ChatThreadRepository(_context);

    public IMessageRepository Messages => 
        _messageRepository ??= new MessageRepository(_context);

    public IReadReceiptRepository ReadReceipts => 
        _readReceiptRepository ??= new ReadReceiptRepository(_context);

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public async Task BeginTransactionAsync()
    {
        _transaction = await _context.Database.BeginTransactionAsync();
    }

    public async Task CommitTransactionAsync()
    {
        try
        {
            await _context.SaveChangesAsync();
            
            if (_transaction != null)
            {
                await _transaction.CommitAsync();
            }
        }
        catch
        {
            await RollbackTransactionAsync();
            throw;
        }
        finally
        {
            if (_transaction != null)
            {
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }
    }

    public async Task RollbackTransactionAsync()
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync();
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public void Dispose()
    {
        _transaction?.Dispose();
        _context.Dispose();
    }
}
