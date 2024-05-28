import { Router, Request, Response } from "express";
import { currentUser } from "../../middlewares/current-user";
import Joi from "joi";
import { validateBody, validateRequest } from "@/middlewares/validate-body";
import { requireAdmin } from "@/middlewares/require-admin";
import { SaveAdminSettingsDto } from "./dto/save-admin-settings.dto";
import { adminSettingsService as service } from "./service/admin-settings.service";
import { AdminSettingsDoc } from "@/models/admin-settings";
import { AdminSettingsDto } from "./dto/admin-settings.dto";
import { NotAuthorizedError } from "@/errors/not-authorized-error";

const router = Router();

router.post(
  "/find",
  async (req: Request, res: Response) => {
    const { encKey } = req.body as AdminSettingsDto;
    if (encKey && encKey !== process.env.ENC_KEY!) {
      throw new NotAuthorizedError();
    }
    const { selectQuery } = req.query;
    const data = await service.getAdminSettings(selectQuery as string);

    res.send(data);
  }
);

const shcema = Joi.object<SaveAdminSettingsDto>({
  managerCode: Joi.string().required(),
});

router.post(
  "/",
  currentUser,
  requireAdmin,
  validateBody(shcema),
  async (req: validateRequest<SaveAdminSettingsDto>, res: Response) => {
    const savedData = service.saveAdminSettings(req.body)
    res.send({ data: savedData });
  }
);

export { router as adminSettingsRouter };