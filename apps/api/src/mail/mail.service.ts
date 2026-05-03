import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

@Injectable()
export class MailService {
  private resend: Resend;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("RESEND_API_KEY");
    this.resend = new Resend(apiKey);
  }

  private async sendEmail(payload: any, defaultErrorMessage: string) {
    try {
      const { data, error } = await this.resend.emails.send(payload);

      if (error) {
        this.logger.error("Erro ao enviar e-mail via Resend:", error);
        throw new InternalServerErrorException(defaultErrorMessage);
      }

      return data;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error("Exceção ao enviar e-mail:", error);
      throw new InternalServerErrorException("Falha no serviço de e-mail.");
    }
  }

  /**
   * Envia um e-mail de verificação para o usuário.

   * Por enquanto, envia um link fictício.
   */
  async sendVerificationEmail(email: string, name: string, token: string) {
    const verificationUrl = `${this.configService.get<string>("FRONTEND_URL")}/verify-email?token=${token}`;
    const from =
      this.configService.get<string>("MAIL_FROM") ||
      "PECAÊ <onboarding@resend.dev>";

    return this.sendEmail(
      {
        from,
        to: [email],
        subject: "Verifique sua conta no PECAÊ",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Olá, ${name}!</h1>
            <p>Obrigado por se cadastrar no <strong>PECAÊ</strong>. Para ativar sua conta, clique no botão abaixo:</p>
            <div style="margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ativar minha conta</a>
            </div>
            <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
            <p style="color: #666; font-size: 14px;">${verificationUrl}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">Se você não solicitou este cadastro, ignore este e-mail.</p>
          </div>
        `,
      },
      "Falha ao enviar e-mail de verificação.",
    );
  }

  /**
   * Envia um e-mail de recuperação de senha.
   */
  /**
   * Envia um e-mail com o status da verificação do vendedor.
   */
  async sendVerificationStatusEmail(
    email: string,
    storeName: string,
    status: string,
    notes?: string,
  ) {
    const isApproved = status === "APPROVED";
    const subject = isApproved
      ? "Parabéns! Sua loja foi verificada no PECAÊ"
      : "Atualização sobre a verificação da sua loja - PECAÊ";

    const statusMessage = isApproved
      ? "<p>Sua documentação foi analisada e aprovada. Sua loja agora possui o <strong>Selo Verificado</strong>!</p>"
      : "<p>Infelizmente não pudemos aprovar sua solicitação de verificação neste momento.</p>";

    const notesMessage = notes
      ? `<p><strong>Motivo / Observações:</strong> ${notes}</p>`
      : "";

    const from =
      this.configService.get<string>("MAIL_FROM") ||
      "PECAÊ <onboarding@resend.dev>";

    return this.sendEmail(
      {
        from,
        to: [email],
        subject,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Olá, ${storeName}!</h1>
            ${statusMessage}
            ${notesMessage}
            <p>Se tiver dúvidas, entre em contato com nosso suporte.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">Equipe PECAÊ</p>
          </div>
        `,
      },
      "Falha ao enviar e-mail de status de verificação.",
    );
  }

  async sendPasswordResetEmail(email: string, name: string, token: string) {
    const resetUrl = `${this.configService.get<string>("FRONTEND_URL")}/reset-password?token=${token}`;
    const from =
      this.configService.get<string>("MAIL_FROM") ||
      "PECAÊ <onboarding@resend.dev>";

    return this.sendEmail(
      {
        from,
        to: [email],
        subject: "Recuperação de senha - PECAÊ",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Olá, ${name}!</h1>
            <p>Você solicitou a redefinição de sua senha no <strong>PECAÊ</strong>. Para prosseguir, clique no botão abaixo:</p>
            <div style="margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Redefinir minha senha</a>
            </div>
            <p>Este link expira em 1 hora.</p>
            <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
            <p style="color: #666; font-size: 14px;">${resetUrl}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">Se você não solicitou a redefinição, sua senha permanecerá a mesma e você pode ignorar este e-mail.</p>
          </div>
        `,
      },
      "Falha ao enviar e-mail de recuperação.",
    );
  }
}
