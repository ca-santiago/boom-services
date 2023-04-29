import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

const baseDir = path.resolve(__filename, '../../../../');

@Injectable()
export class StorageService {
  constructor() {}

  /**
   * Save the given data with the given name on the disk storage
   * @return file name
   */
  async saveFile(data: Buffer, ext: string, name: string): Promise<string> {
    console.log(baseDir);
    const sanitizedExt = ext[0] == '.' ? ext : `.${ext}`;
    const nameWithExtension = name + sanitizedExt;
    fs.writeFileSync(path.join(baseDir, `public/${nameWithExtension}`), data);
    return nameWithExtension;
  }
}
