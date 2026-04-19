for file in apps/api/src/sellers/sellers.controller.ts apps/api/src/verifications/verifications.controller.ts; do
  sed -i "s/import { Request, Response } from 'express';/import { Request, Response } from 'express';\nimport { UserType } from '@prisma\/client';/" $file
done
