import { Controller, Get, Req } from '@nestjs/common';

@Controller('me')
export class MeController {
  @Get()
  profile(@Req() req: { user?: { id: string; roles: string[]; status: string; email?: string } }) {
    return {
      id: req.user?.id,
      roles: req.user?.roles ?? [],
      status: req.user?.status ?? 'unknown',
      email: req.user?.email
    };
  }
}
