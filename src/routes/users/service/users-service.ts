import { BadRequestError } from "@/errors/bad-request-error";
import { Token } from '@/models/token';
import { User, UserAttrs } from "@/models/user";
import { settingsService } from '@/routes/settings/service/settings-service';
import { tokenService } from '@/routes/token/service/token-service';
import { sendChangePasswordEmail } from '@/utils/mail/mail-util';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import dayjs from 'dayjs';
import { CookieOptions, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ChangeEmailDto } from "../dto/change-email.dto";
import { ChangePwDto } from "../dto/change-pw.dto";
import { CheckPasswordDto } from "../dto/check-password.dto";
import { FindPwDto, FindPwResponseDto } from '../dto/find-pw.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

type UserIdType = { userId: string };

class UsersService {
  private async getUser(userId: string | undefined) {
    const user = userId ? await User.findOne({ userId: userId.toLowerCase() }) : undefined;
    if (!user) {
      throw new BadRequestError("사용자 정보가 없습니다.", "_form");
    }

    return user;
  }

  private async matchPassword(password: string, hashedPassword: string) {
    const passwordMatch = await bcrypt.compare(password, hashedPassword);
    if (!passwordMatch) {
      throw new BadRequestError("비밀번호를 일치하지 않습니다.", "_form");
    }
  }

  signJwt(res: Response, user: UserAttrs) {
    const expiresInMinutes = 60 * 24 * 365;
    const payload = {
      userId: user.userId,
      roomKey: user.roomKey,
      admin: user.admin,
      orgName: user.orgName,
      email: user.email,      
      settings: {
        questionnaire: { use: user.settings?.questionnaire?.use },
        webApp: { use: user.settings?.webApp?.use },
        clickDesk: { use: user.settings?.clickDesk?.use },
      }
    }
    const userJwt = jwt.sign(
      payload,
      process.env.JWT_KEY!,
      {
        expiresIn: expiresInMinutes * 60,
      }
    );

    const cookieOptions: CookieOptions = {
      maxAge: expiresInMinutes * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    res.cookie("user", JSON.stringify(payload), cookieOptions);
    res.cookie("jwt", userJwt, cookieOptions);
  }

  async checkPassword({ userId, password }: CheckPasswordDto & UserIdType) {
    const user = await this.getUser(userId);

    await this.matchPassword(password, user.password);
  }

  async changePassword({ userId, password }: ChangePwDto & UserIdType) {
    const user = await this.getUser(userId);

    user.password = password;
    await user.save();
    await tokenService.delete({ userId, tokenType: "changePw" });
  }

  async changeEmail({ userId, email }: ChangeEmailDto & UserIdType): Promise<UserAttrs> {
    const user = await this.getUser(userId);

    user.email = email;
    return user.save();
  }

  async findPassword({ userId, email }: FindPwDto & UserIdType): Promise<FindPwResponseDto> {
    const user = await this.getUser(userId);
    if (user.email !== email) {
      throw new BadRequestError("이메일이 일치하지 않습니다.");
    }
    const uuid = randomUUID();
    const token = Token.build({
      token: uuid,
      userId: userId,
      tokenType: 'changePw',
      expiredAt: dayjs().add(30, "m").toDate(),
    })

    await token.save();
    await sendChangePasswordEmail({ to: email, token: uuid });

    return { email, token: uuid }
  }

  async getAllUsers(): Promise<UserAttrs[] | undefined> {
    const users = await User.find().populate("settings");

    return users;
  }

  async getUserById(id: string): Promise<UserAttrs | null> {
    const user = await User.findById(id).populate("settings");

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await User.findById(id);
    if (!user) throw new BadRequestError("사용자 정보가 없습니다.");

    user.orgName = dto.orgName;
    user.email = dto.email;
    if (dto.geoLocation) {
      user.location = {
        type: "Point",
        coordinates: [dto.geoLocation.lng, dto.geoLocation.lat]
      }
    }
    await user.save();

    return await settingsService.updateSettings(user, { ...dto.settings })
  }

  async delete(id: string) {
    const session = await User.startSession();

    try {
      return await session.withTransaction(async (session) => {
        const userDoc = await User.findByIdAndDelete(id, { session });
        if (!userDoc) {
          throw new BadRequestError("사용자 정보가 없습니다.");
        }

        const user = userDoc.toJSON();
        if (user.settings) {
          const settings = await settingsService.delete(user.settings.toString());
          user.settings = settings?.toJSON();
        }

        // Transaction Commit
        await session.commitTransaction();

        return user;
      })
    } catch (error) {
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getAdditionalServices(userId: string) {
    const user = await User.findOne({ userId }).populate("settings");
    const settings = user?.settings;

    return {
      clickDesk: settings?.clickDesk?.use,
      webApp: settings?.webApp?.use,
      questionnaire: settings?.questionnaire?.use,
    }
  }
}

export const usersService = new UsersService