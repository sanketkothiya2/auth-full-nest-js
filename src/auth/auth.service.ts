import { HttpException, HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import { User } from './interfaces/user.interface';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { SendMailService } from '../send-mail/send-mail.service';
import { v4 as uuid } from 'uuid';
// import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { sign } from 'jsonwebtoken';
import config from '../config/keys';
import { UpdateUser } from './dto/updateUser.dto';


@Injectable()
export class AuthService {
    constructor(
        @InjectModel('User') private readonly user: Model<User>,
        @InjectModel('Token') private readonly tokensModel,
        private sendMailService: SendMailService,
        // private jwtService: JwtService
    ) { }

    async createUser(input: User) {
        try {

            const email = input?.email?.trim()
            const user = await this.user.findOne({ email });
            if (user) {
                // console.log("user")
                // console.log(user)
                throw new HttpException('user already exists', HttpStatus.BAD_REQUEST);
            }

            //Create a Hash Password
            const hashPassword = await bcrypt.hash(input.password, 10)
            input['password'] = hashPassword

            //Create a new User object according to the Schema
            const newUser = new this.user(input);

            const newUserData = await newUser.save();
            if (newUserData) {
                return newUserData;
            }

        } catch (error) {
            if (error instanceof HttpException) {
                throw error
            } else {
                throw new InternalServerErrorException('Error while creating new user account')
            }
        }
    }

    async signPayload(payload: JwtPayload) {
        try {
            return sign(payload, config.secretKey, { expiresIn: '7d' });

        } catch (error) {
            if (error instanceof HttpException) {
                throw error
            }
            throw new InternalServerErrorException('Error while creating new token')
        }
    }

    async sendMail(subject: string, html: string, email: string, tokenId: string) {
        try {

            const isMailSend = await this.sendMailService.sendMail(subject, html, email);

            //If mail successfully send then save User into the database
            if (isMailSend.accepted.length > 0) {
                return true;
            }
            // If mail failed then delete saved Token Object from the database and return message
            else {
                await this.tokensModel.findByIdAndRemove(tokenId);
                return false;
            }

        } catch (error) {
            if (error instanceof HttpException) {
                throw error
            }
            throw new InternalServerErrorException('Error while sending mail')
        }
    }

    async createNewToken(newUser: User, type: string) {
        try {

            //Create a new Token object according to the Schema
            let verifyObj = {
                userId: newUser._id,
                email: newUser.email,
            }
            const token = await this.signPayload(verifyObj);

            let newTokenData = {
                type: type,
                userId: newUser._id,
                email: newUser.email,
                token: token
            }
            const newTokenObj = new this.tokensModel(newTokenData);

            //Save Token Object into the database
            const newToken = await newTokenObj.save();
            return newToken;

        } catch (error) {
            if (error instanceof HttpException) {
                throw error
            }
            throw new InternalServerErrorException('Error while creating new Token')
        }
    }

    async expireToken(id: string, time: number) {
        try {
            setTimeout(async () => {
                await this.tokensModel.findByIdAndRemove(id);
            }, time);
        } catch (error) {
            throw new InternalServerErrorException('Error while expiring token')
        }
    }

    async signUp(input: CreateUserDto) {
        try {

            const newUser = await this.createUser(input);
            if (newUser) {

                const newToken = await this.createNewToken(newUser, "emailVerify");
                if (newToken) {

                    //Send Verification email to the user
                    const url = `http://localhost:3000/auth/verifyEmail/${newUser._id}/${newToken._id}/${newToken.token}`;
                    const subject = `Verify Email`;
                    const html = `This is Verification Email.<br> <a href='${url}'>Click here</a> or Go to this page ${url}`;
                    const isMailSend = await this.sendMail(subject, html, newUser.email, newToken._id);
                    if (isMailSend) {

                        let tok = newToken.token;
                        this.expireToken(newToken._id, 1000 * 60 * 15)
                        return { newUser, token: tok }
                    } else {
                        throw new InternalServerErrorException('Error while creating new user')
                    }
                }
            }

        } catch (error) {
            if (error instanceof HttpException) {
                throw error
            }
            throw new InternalServerErrorException('Error while creating new user account')
        }

    }

    async emailVerify(userID: string, tokenID: string, token: string): Promise<User> {
        try {
            const user = await this.user.findById({ _id: userID });
            if (user) {

                const tokenData = await this.tokensModel.find({ token: token });
                if (tokenData) {

                    if (tokenData[0].userId.toString() == user._id.toString()) {
                        await this.tokensModel.findByIdAndRemove({ _id: tokenID })
                        await this.user.findByIdAndUpdate(userID, { verified: true }, { new: true });

                        return await this.user.findById({ _id: userID });
                    } else {
                        throw new InternalServerErrorException('Invalid User credentials!')
                    }

                } else {
                    throw new InternalServerErrorException('Invalid Token!')
                }

            } else {
                throw new InternalServerErrorException('Invalid User credentials!')
            }

        } catch (error) {
            if (error instanceof HttpException) {
                throw error
            }
            throw new InternalServerErrorException('Error while verifying Token!')
        }
    }

    async login(input: LoginDto) {
        try {

            const { email, password } = input;
            const user = await this.user.findOne({ email });
            if (user !== null) {

                if (user['verified'] === true) {

                    const isPassMatched = await bcrypt.compare(password, user['password'])
                    if (isPassMatched) {

                        const newToken = await this.createNewToken(user, "authToken");
                        if (newToken) {
                            let tok = newToken.token;
                            this.expireToken(newToken._id, 1000 * 60 * 60 * 24 * 2)
                            return { user, token: tok }
                        }

                    } else {
                        throw new InternalServerErrorException('Invalid Password!!')
                    }

                } else {
                    throw new InternalServerErrorException('Unverified email!')
                }

            } else {
                throw new InternalServerErrorException('User not found!')
            }

        } catch (error) {
            if (error instanceof HttpException) {
                throw error
            }
            throw new InternalServerErrorException('Error while signing In!')
        }
    }

    async updateUser(input: UpdateUser, id: string) {
        try {
            const user = await this.user.findOne({ _id: id })

            if (user !== null) {
                if (user['verified'] === true) {

                    if (input.name || input.email) {

                        if (input.email) {
                            const newToken = await this.createNewToken(user, "emailVerify");

                            if (newToken) {
                                const url = `http://localhost:3000/auth/verifyEmail/${user._id}/${newToken._id}/${newToken.token}`;
                                const subject = `Verify Email`;
                                const html = `This is Verification Email.<br> <a href='${url}'>Click here</a> or Go to this page ${url}`;

                                const isMailSend = await this.sendMail(subject, html, input.email, newToken._id);

                                if (isMailSend) {
                                    await this.user.findByIdAndUpdate({ _id: id }, { email: input.email, verified: false });

                                    var tok = newToken.token;
                                    this.expireToken(newToken._id, 1000 * 60 * 15)

                                } else {
                                    throw new InternalServerErrorException('Error while creating new user')
                                }
                            }
                        }

                        if (input.name) {
                            await this.user.findByIdAndUpdate({ _id: id }, { name: input.name })
                        }

                        const updatedUser = await this.user.findOne({ _id: id })
                        return { updatedUser, token: tok }

                    } else {
                        throw new InternalServerErrorException(`User cannot change other credentials except name and email!`)
                    }

                } else {
                    throw new InternalServerErrorException('Unverified email!')
                }

            } else {
                throw new InternalServerErrorException('User not found!')
            }

        } catch (error) {
            if (error instanceof HttpException) {
                throw error
            }
            throw new InternalServerErrorException('Error while signing In!')
        }
    }

    async deleteAccount(userId: string) {
        try {

            if (userId) {
                const user = await this.user.findById(userId)
                if (user) {
                    const result = await this.user.findByIdAndRemove({ _id: user._id });
                    if (result) {
                        return true;
                    }
                } else {
                    throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
                }
            } else {
                throw new HttpException('Server Error', HttpStatus.BAD_REQUEST);
            }

        } catch (error) {
            if (error instanceof HttpException) {
                throw error
            } else {
                throw new InternalServerErrorException('Error while creating new user account')
            }
        }
    }

    async forgetPassword(email) {
        const user = await this.user.findOne({ email: email })

        if (user !== null) {

            const token = uuid();
            const verifyObj = {
                userId: user._id,
                email: user.email,
                token,
                type: 'forgetPassword'
            }
            const newTokenObj = new this.tokensModel(verifyObj);
            const newToken = await newTokenObj.save();

            //Send Verification email to the user
            const url = `http://localhost:3000/auth/verifyEmail/resetPassword/${user._id}/${newToken._id}/${token}`;
            const subject = `Forget Password`;
            const html = `Your request for forget password has received and this is a link to reset a new password.<br> <a href='${url}'>Click here</a> or Go to this page ${url}`;
            const isMailSend = await this.sendMailService.sendMail(subject, html, user.email);

            //If mail successfully send then save User into the database
            if (isMailSend.accepted.length > 0) {
                return {
                    message: `Reset Password link has been sent to ${user.email} email address.`
                }
            }
            // If mail failed then delete saved Token Object from the database and return message
            else {
                await this.tokensModel.findByIdAndRemove(newToken._id);
                return {
                    message: `We are unable to send verification email to you. Please try again later.`
                }
            }

        }
        else {
            return {
                message: `User with ${email} email is not found`
            }
        }

    }

    // async resetPassword(userID, tokenID, token) {
    //     if (userID && tokenID && token) {

    //         const isTokenValid = await this.tokensModel.findOne({ _id: tokenID });
    //         if (isTokenValid !== null) {

    //             return `<h1>Reset New Password:</h1>
    //                     <form action="http://localhost:3000/auth/login/resetPassword" method="post">

    //                         <input type="hidden" name="userID" id="userID" value=${userID}>
    //                         <input type="hidden" name="tokenID" id="tokenID" value=${tokenID}>

    //                         <div style="margin-bottom: 10px;">
    //                             <label for="Password"> Enter Password: </label>
    //                             <input type="password" name="password" id="password">
    //                         </div>
    //                         <div style="margin-bottom: 10px;">
    //                             <label for="ConfirmPassword"> Enter Confirm Password: </label>
    //                             <input type="confirmPassword" name="confirmPassword" id="confirmPassword">
    //                         </div>
    //                         <div style="margin-bottom: 10px;">
    //                             <button type="submit">Submit</button>
    //                             <button type="reset">Reset</button>
    //                         </div>
    //                     </form>`;

    //         } else {
    //             return `<h1>Link is expired... Generate a new link and reset your password.</h1>`
    //         }

    //     } else {
    //         return `<h1>We are facing some issues. Please try again later.</h1>`
    //     }
    // }

    async resetPassword(token,resetPasswordDto) {
        const { userID, tokenID, password, confirmPassword } = resetPasswordDto;

        if (password === confirmPassword) {

            const hashPassword = await bcrypt.hash(password, 10);
            const result = await this.user.findByIdAndUpdate({ _id: userID }, { password: hashPassword })
            if (result) {

                await this.tokensModel.findByIdAndRemove({ _id: tokenID });
                return {
                    password,
                    confirmPassword,
                    message: 'Password reset successfully.'
                }

            } else {
                return {
                    password,
                    confirmPassword,
                    message: 'We are facing some issues. Please try again later.'
                }
            }

        } else {
            return {
                password,
                confirmPassword,
                message: 'Password and confirmPassword are not matched.'
            }
        }
    }

    // async deleteAccount(email) {
    //     const user = await this.user.findOne({ email: email })

    //     if (user !== null) {

    //         const result = await this.user.findByIdAndRemove({ _id: user._id });
    //         if (result) {
    //             return {
    //                 message: `Account of user with ${email} email is deleted successfully.`
    //             }
    //         } else {
    //             return {
    //                 message: `Account of user with ${email} email is not deleted!`
    //             }
    //         }

    //     }
    //     else {
    //         return {
    //             message: `User with ${email} email is not found`
    //         }
    //     }
    // }

    // async isAdmin(email, password) {
    //     const admin = await this.user.findOne({ email })
    //     if (admin) {

    //         const isAdminPassMatched = await bcrypt.compare(password, admin.password)
    //         if (isAdminPassMatched) {

    //             return true

    //         } else {
    //             return {
    //                 message: `Incorrect email and password of Admin.`
    //             }
    //         }

    //     } else {
    //         return {
    //             message: `Your are not an admin`
    //         }
    //     }
    // }

    // async addNewUserByAdmin(createUserByAdminDto) {
    //     const { name, email, password } = createUserByAdminDto
    //     const newUserObj = {
    //         name,
    //         email,
    //         password,
    //     }

    //     return await this.signUp()(newUserObj);
    // }

    // async showAllUser(email, password) {
    //     const users = await this.user.find({ role: 'user' });
    //     if (users.length > 0) {
    //         return users;
    //     } else {
    //         return {
    //             message: `No users found.`
    //         }
    //     }
    // }
}
