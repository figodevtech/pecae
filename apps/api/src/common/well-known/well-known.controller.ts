import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('.well-known')
export class WellKnownController {
  @Get('assetlinks.json')
  getAssetLinks(@Res() res: Response) {
    const assetLinks = [
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: 'com.pecae.app',
          sha256_cert_fingerprints: [
            // Isso deve ser preenchido com o fingerprint real em produção
            '00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00',
          ],
        },
      },
    ];
    return res.json(assetLinks);
  }

  @Get('apple-app-site-association')
  getAppleAppSiteAssociation(@Res() res: Response) {
    const association = {
      applinks: {
        apps: [],
        details: [
          {
            appID: 'YOUR_TEAM_ID.com.pecae.app',
            paths: ['*'],
          },
        ],
      },
    };
    return res.json(association);
  }
}
