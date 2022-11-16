import { Controller, Get, Post, Put, Delete, Body, Req, Res, Param } from '@nestjs/common';
import { CreateItemDto } from "./dto/create-item.dto";
import { Request, Response } from 'express';
import { ItemsService } from './items.service';
import { Item } from './interfaces/item.interface';

@Controller('items')
export class ItemsController {

    constructor(private readonly itemsService: ItemsService) {}

    // @Get()
    // findAll(@Req() req: Request, @Res() res: Response): Response {
    //     console.log(req.url);
    //     return  res.send('All Items:');
    // }

    @Get()
    async findAll(): Promise<Item[]> {
        return this.itemsService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id): Promise<Item> {
        return this.itemsService.findOne(id);
    }

    @Post()
    async createOne(@Body() createItemDto: CreateItemDto): Promise<Item> {
        return this.itemsService.createOne(createItemDto);
    }
    
    @Delete(':id')
    deleteOne(@Param('id') id): Promise<Item> {
        return this.itemsService.deleteOne(id);
    }
    
    @Put(':id')
    updateItem(@Param('id') id, @Body() updateItemDto: CreateItemDto): Promise<Item> {
        return this.itemsService.updateOne(id, updateItemDto);
    }
}
