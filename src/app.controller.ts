import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {
  }

  @Post('/version/:v')
  async create(@Param('v') version: string): Promise<void> {
    switch (version) {
      case '1':
        return await this.appService.createV1();
      case '2':
        return await this.appService.createV2();
      case '3':
        return await this.appService.createV3();
      case '4':
        return await this.appService.createV4();
      case '5':
        return await this.appService.createV5();
      case '4-1':
        return await this.appService.createV41();
      case '4-2':
        return await this.appService.createV42();
      case '4-3':
        return await this.appService.createV43();
      case '4-4':
        return await this.appService.createV44();
      case '4-5':
        return await this.appService.createV45();
      case '4-6':
        return await this.appService.createV46();
      case '4-7':
        return await this.appService.createV47();
    }
  }

}
