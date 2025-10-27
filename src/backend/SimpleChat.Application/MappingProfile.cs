using AutoMapper;
using SimpleChat.Application.DTOs;
using SimpleChat.Core.Entities;

namespace SimpleChat.Application;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<User, UserDto>();
    }
}