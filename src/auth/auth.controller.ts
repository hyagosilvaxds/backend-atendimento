import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { PermissionsService } from './permissions.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { CanManageOrgUsers } from './decorators/permissions.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { UserRole, PermissionAction, PermissionResource } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly permissionsService: PermissionsService,
  ) {}

  /**
   * @route POST /auth/login
   * @desc Autenticar usuário
   * @access Public
   */
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req, @Body() loginDto: LoginDto) {
    return this.authService.login(req.user);
  }

  /**
   * @route POST /auth/register
   * @desc Registrar novo usuário
   * @access Private (Admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  /**
   * @route GET /auth/profile
   * @desc Obter perfil do usuário logado
   * @access Private
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return this.authService.getProfile(user.id);
  }

  /**
   * @route POST /auth/logout
   * @desc Fazer logout
   * @access Private
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    return this.authService.logout(token);
  }

  /**
   * @route POST /auth/forgot-password
   * @desc Solicitar recuperação de senha
   * @access Public
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  /**
   * @route POST /auth/reset-password
   * @desc Redefinir senha
   * @access Public
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  /**
   * @route GET /auth/users
   * @desc Listar usuários
   * @access Private (Admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @Get('users')
  async findAll(@Query('organizationId') organizationId?: string, @CurrentUser() user?: any) {
    // Se não for super admin, filtrar pela organização do usuário
    const orgId = user.role === UserRole.SUPER_ADMIN ? organizationId : user.organizationId;
    return this.authService.findAll(orgId);
  }

  /**
   * @route GET /auth/users/:id
   * @desc Obter usuário por ID
   * @access Private (Admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @Get('users/:id')
  async findOne(@Param('id') id: string) {
    return this.authService.findOne(id);
  }

  /**
   * @route PUT /auth/users/:id
   * @desc Atualizar usuário
   * @access Private (Admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @Put('users/:id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.authService.update(id, updateUserDto);
  }

  /**
   * @route DELETE /auth/users/:id
   * @desc Remover usuário
   * @access Private (Admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @Delete('users/:id')
  async remove(@Param('id') id: string) {
    return this.authService.remove(id);
  }

  /**
   * @route GET /auth/permissions
   * @desc Listar todas as permissões disponíveis
   * @access Private (Admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN)
  @Get('permissions')
  async getAllPermissions() {
    return this.permissionsService.getUserPermissions(''); // Retorna todas as permissões
  }

  /**
   * @route GET /auth/users/:id/permissions
   * @desc Obter permissões de um usuário específico
   * @access Private (Admin ou próprio usuário)
   */
  @UseGuards(JwtAuthGuard)
  @Get('users/:id/permissions')
  async getUserPermissions(@Param('id') id: string, @Request() req: any) {
    const currentUser = req.user;
    
    // Permitir se for o próprio usuário ou se for admin
    const canAccess = currentUser.id === id || 
                     currentUser.role === 'SUPER_ADMIN' || 
                     currentUser.role === 'ORG_ADMIN';
    
    if (!canAccess) {
      throw new ForbiddenException('Você só pode visualizar suas próprias permissões');
    }
    
    return this.permissionsService.getUserPermissions(id);
  }

  /**
   * @route POST /auth/users/:id/permissions
   * @desc Conceder permissão específica a um usuário
   * @access Private (Admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @CanManageOrgUsers()
  @Post('users/:id/permissions')
  async grantPermission(
    @Param('id') id: string,
    @Body() body: { action: PermissionAction; resource: PermissionResource },
  ) {
    return this.authService.grantPermission(id, body.action, body.resource);
  }

  /**
   * @route DELETE /auth/users/:id/permissions
   * @desc Revogar permissão específica de um usuário
   * @access Private (Admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @CanManageOrgUsers()
  @Delete('users/:id/permissions')
  async revokePermission(
    @Param('id') id: string,
    @Body() body: { action: PermissionAction; resource: PermissionResource },
  ) {
    return this.authService.revokePermission(id, body.action, body.resource);
  }

  /**
   * @route POST /auth/setup-permissions
   * @desc Inicializar permissões padrão do sistema
   * @access Private (Super Admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Post('setup-permissions')
  async setupPermissions() {
    await this.authService.initializePermissions();
    return { message: 'Permissões inicializadas com sucesso' };
  }
}
