import Joi from "joi";

export interface SignupDto {
  userId: string;
  password: string;
  roomKey: string;
  accountKey: string;
}

export const signupSchema = Joi.object({
  userId: Joi.string().trim().required().messages({
    "string.empty": `아이디를 입력하세요.`,
  }),
  password: Joi.string().required().messages({
    "string.empty": `비밀번호를 입력하세요.`,
  }),
  roomKey: Joi.string().required().messages({
    "string.empty": `연결 코드를 입력하세요.`,
  }),
  accountKey: Joi.string().required().messages({
    "string.empty": `관리자 코드를 입력하세요.`,
  }),
}).options({ abortEarly: false });