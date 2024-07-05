import { DeskReason, DeskReasonDoc } from "@/models/desk_reason";
import { DeskReasonSaveDto } from "../dto/desk_reason_save.dto";
import { BadRequestError } from "@/errors/bad-request-error";
import { DeskReasonUpdateAllDto } from "../dto/desk_reason_update_all.dto";
import { DeskReasonUpdateDto } from "../dto/desk_reason_update.dto";

class DeskReasonService {
  async findAll(userId: string): Promise<DeskReasonDoc[]> {
    return DeskReason.find({ userId }).sort({ seq: 1 });
  }

  async save(userId: string, dto: DeskReasonSaveDto) {
    const reasons = await this.findAll(userId);

    if (reasons.some(r => r.text.toLowerCase() === dto.text.toLowerCase())) {
      throw new BadRequestError("이미 존재하는 내원사유입니다.");
    }

    const seqs = reasons.map(r => r.seq)
    const seq = seqs.length === 0 ? 1 : Math.max(...seqs) + 1;
    const newReason = DeskReason.build({ userId, text: dto.text, seq })
    return newReason.save();
  }

  async update(id: string, dto: DeskReasonUpdateDto) {
    return DeskReason.findOneAndUpdate({ _id: id }, { ...dto }, { new: true });
  }

  updateAll({ reasons }: DeskReasonUpdateAllDto) {
    const bulkOps = reasons.map(({ id, ...reason }) => ({
      updateOne: {
        filter: { _id: id },
        update: { ...reason }
      }
    }));

    return DeskReason.bulkWrite(bulkOps);
  }

  async delete(id: string) {
    return DeskReason.findOneAndDelete({ _id: id });
  }
}

export const deskReasonService = new DeskReasonService();