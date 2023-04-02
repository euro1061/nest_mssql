import { Controller, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { AuthDto } from './dto/auth.dto';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('signup')
    signup(
        @Body() signupDto: SignupDto,
        @Res() res: Response
    ) {
        return this.authService.signup(signupDto, res)
    }

    @Post('signin')
    signin(
        @Body() authDto: AuthDto,
        @Res() res: Response
    ) {
        return this.authService.signin(authDto, res)
    }
}
