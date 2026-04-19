import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService } from './mail.service';

@Processor('mail-queue')
export class MailProcessor extends WorkerHost {
  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'verification-status': {
        const { email, storeName, status, notes } = job.data;
        await this.mailService.sendVerificationStatusEmail(email, storeName, status, notes);
        break;
      }
      default:
        console.warn(`Unknown job name: ${job.name}`);
    }
  }
}
