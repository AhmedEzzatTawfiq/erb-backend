import { Injectable } from '@nestjs/common';
import { CreatePasswordResetDto } from './dto/create-password-reset.dto';
import { UpdatePasswordResetDto } from './dto/update-password-reset.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordReset } from './entities/password-reset.entity';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';


@Injectable()
export class PasswordResetsService {

  constructor(
    @InjectRepository(PasswordReset)
    private readonly passwordResetRepository: Repository<PasswordReset>,
  ) { }

  async createPasswordResetToken(userId: string): Promise<string> {

    // generate random token
    const token = crypto.randomBytes(32).toString('hex');

    // Hash token 
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Token expires after 15 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Save hashed token
    const passwordReset = this.passwordResetRepository.create({
      userId,
      tokenHash,
      expiresAt,
    });
    await this.passwordResetRepository.save(passwordReset);

    return token;
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordReset | null>{
    return this.passwordResetRepository.findOne({
      where: { tokenHash }
    })
  }

  async deleteToken(id: string): Promise<void> {
  await this.passwordResetRepository.delete({ id });
}
}
