import { ResetPasswordDto } from './dto/resetPass.dto';
import { ForgetPasswordDto } from './dto/forgetPass.dto';
import { Controller, Get, Post, Put, Delete, Body, Req, Res, Param, UseGuards, Patch } from '@nestjs/common';
import { CreateUserDto } from "./dto/create-user.dto";
import { AuthService } from './auth.service';
import { User } from './interfaces/user.interface';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport/dist/auth.guard';
import { UpdateUser } from './dto/updateUser.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly auth: AuthService) { }

    @Post('/register')
    async signUp(@Body() input: CreateUserDto) {
        return this.auth.signUp(input);
    }

    @Get('/verifyEmail/:userID/:tokenID/:token')
    emailVerify(@Param('userID') userID, @Param('tokenID') tokenID, @Param('token') token): Promise<User> {
        return this.auth.emailVerify(userID, tokenID, token);
    }

    @Post('/login')
    async login(@Body() input: LoginDto) {
        return this.auth.login(input);
    }

    @Put('/updateUser/:id')
    @UseGuards(AuthGuard('jwt'))
    async updateUser(@Param('id') id, @Body() input: UpdateUser) {
        return this.auth.updateUser(input, id);
    }

    @Post('/forgetPassword')
    async forgetPassword(@Body() forgetPasswordDto: ForgetPasswordDto) {
        if (forgetPasswordDto.email.length > 0) {
            return this.auth.forgetPassword(forgetPasswordDto.email);
        } else {
            return {
                message: `Please enter your email address.`
            }
        }
    }
    @Get('/token')
    @UseGuards(AuthGuard('jwt'))
    async getToken(@Req() req: any) {
        return req.user
    }

    @Patch('/resetpassword/:token')
    async resetpassword(@Param('token') token, @Body() resetPasswordDto: ResetPasswordDto) {
        return this.auth.resetPassword(token, resetPasswordDto);
    }



    // @Get('/resetPassword/:userID/:tokenID/:token')
    // async resetPassword(@Param('userID') userID, @Param('tokenID') tokenID, @Param('token') token) {
    //     return this.auth.resetPassword(userID, tokenID, token);
    // }

    // @Post('/resetPassword')
    // async resetPassPost(@Body() resetPasswordDto: ResetPasswordDto) {
    //     return this.auth.resetPassPost(resetPasswordDto);
    // }

    @UseGuards(AuthGuard('jwt'))
    @Delete('/deleteAccount')
    async deleteAccount(@Req() req: any) {
        return this.auth.deleteuser(req)
    }

    //   async deleteAccount(@Body('email') email:string) {
    //     if (email.length > 0) {
    //         return this.auth.deleteAccount(email);
    //     } else {
    //         return {
    //             message: `Please enter your email address.`
    //         }
    //     }
    // }

    @Post('/admin')
    async showAllUser(@Body('email') email, @Body('password') password) {
        const isAdmin = await this.auth.isAdmin(email, password);
        if (isAdmin) { console.log("hello done process"); }
        // if (isAdmin === true) {
        //     return this.auth.showAllUser(email, password);
        // } else {
        //     return isAdmin;
        // }
    }

    // @Post('/admin/addNewUser')
    // async addNewUserByAdmin(@Body() createUserByAdminDto: CreateUserByAdminDto) {
    //     const isAdmin = await this.auth.isAdmin(createUserByAdminDto.adminEmail, createUserByAdminDto.adminPassword);
    //     if (isAdmin === true) {
    //         return this.auth.addNewUserByAdmin(createUserByAdminDto);
    //     } else {
    //         return isAdmin;
    //     }
    // }


    // @Post('/admin/updateUser/:userId')
    // async updateUserByAdmin(@Param('userId') userId, @Body() updateUserByAdminDto: UpdateUserByAdminDto) {
    //     const isAdmin = await this.auth.isAdmin(updateUserByAdminDto.adminEmail, updateUserByAdminDto.adminPassword);
    //     if (isAdmin === true) {
    //         return this.auth.updateUser(updateUserByAdminDto, userId);
    //     } else {
    //         return isAdmin;
    //     }
    // }
}
