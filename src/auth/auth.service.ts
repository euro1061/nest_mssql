import { ForbiddenException, HttpCode, Injectable, Res } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { ResponseBody } from './typed/responseBody';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthDto } from './dto/auth.dto';
import { Response } from 'express';

@Injectable()
export class AuthService {
    constructor(
        private prismaService: PrismaService,
        private jwtService: JwtService,
        private config: ConfigService,
    ) { }

    async signup(signupDto: SignupDto, res: Response) {
        let code = 201
        let responseBody: ResponseBody

        const hash = await argon.hash(signupDto.password)

        delete signupDto.password

        try {
            const user = await this.prismaService.user.create({
                data: {
                    ...signupDto,
                    hashedPassword: hash
                }
            })

            if (user) {
                responseBody = {
                    isSuccess: true,
                    error: null
                }
            } else {
                responseBody = {
                    isSuccess: false,
                    error: 'Unable to create user'
                }

                code = 400
            }

            res.status(code).json(responseBody)
        } catch (error) {
            if (error.code === "P2002") {
                responseBody = {
                    isSuccess: false,
                    error: "Credentials takens"
                }
                code = 400
            }

            res.status(code).json(responseBody)
        }
    }

    async signin(dto: AuthDto, res: Response) {
        console.log(dto);
        
        let code = 200
        let responseBody
        const user = await this.prismaService.user.findUnique({
            where: {
                email: dto.email
            }
        })

        if (!user) {
            responseBody = {
                isSuccess: false,
                error: new ForbiddenException('ไม่พบผู้ใช้งาน')
            }

            return responseBody
        }

        const pwMatch = await argon.verify(user.hashedPassword, dto.password)

        if (!pwMatch) {
            responseBody = {
                isSuccess: false,
                error: new ForbiddenException('รหัสผ่านไม่ถูกต้อง')
            }

            return responseBody
        }
        const token = (await this.signToken(user.id, user.email)).access_token
        responseBody = {
            isSuccess: true,
            error: null,
            token: token
        }

        res.status(code).json(responseBody)
    }

    async signToken(userId: number, email: string): Promise<{ access_token: string }> {
        const payload = {
            sub: userId,
            email
        }
        const token = await this.jwtService.signAsync(payload, {
            // expiresIn: '2h',
            secret: this.config.get('JWT_SECRET')
        })

        return {
            access_token: token
        }
    }
}
