import { Request } from 'express';

export default function createLocaltionHeaderString(
  req: Request,
  resourceId: string,
  port?: number | string,
): string {
  return `${req.protocol}://${req.hostname}${port ? ':' + port : ''}${
    req.originalUrl
  }${resourceId}`;
}
