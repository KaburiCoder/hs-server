import express, { Request, Response } from 'express'
import Joi from 'joi';
import { validateBody, validateRequest } from '@/middlewares/validate-body';
import { usersService } from './service/users-service';
import { CheckPasswordDto } from './dto/check-password.dto';
import { ChangePwDto as ChangePwDto, changePasswordDtoSchema as changePwDtoSchema } from './dto/change-pw.dto';
import { currentUser } from '@/middlewares/current-user';
import { requireAuth } from '@/middlewares/require-auth';
import { ChangeEmailDto, ChangeEmailDtoSchema } from './dto/change-email.dto';
import { FindPwDto, findPasswordDtoSchema } from './dto/find-pw.dto';

const router = express.Router();

const schema = Joi.object<CheckPasswordDto>({
  password: Joi.string().required(),
})

router.post(
  "/:userId/checkpw",
  validateBody(schema),
  async (req: validateRequest<CheckPasswordDto>, res: Response) => {
    await usersService.checkPassword({ userId: req.params.userId, password: req.body.password })

    res.status(200).send({});
  }
);

router.put(
  "/:userId/changepw",
  validateBody(changePwDtoSchema),
  async (req: validateRequest<ChangePwDto>, res: Response) => {
    await usersService.changePassword({ userId: req.params.userId, ...req.body })

    res.status(200).send({});
  }
);

router.put(
  "/change-email",
  currentUser,
  requireAuth,
  validateBody(ChangeEmailDtoSchema),
  async (req: validateRequest<ChangeEmailDto>, res: Response) => {
    await usersService.changeEmail({ userId: req.currentUser!.userId, email: req.body.email })
    res.status(200).send({});
  }
);

router.put(
  "/:userId/findpw",
  validateBody(findPasswordDtoSchema),
  async (req: validateRequest<FindPwDto>, res: Response) => {
    const { email } = await usersService.findPassword({ userId: req.params.userId, email: req.body.email })
    res.status(200).send({ email });
  }
);

export { router as usersRouter }