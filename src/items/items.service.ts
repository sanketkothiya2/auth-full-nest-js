import { Injectable } from '@nestjs/common';
import { Item } from './interfaces/item.interface';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class ItemsService {

    constructor (@InjectModel('Item') private readonly itemModel:Model<Item>) {}

    // private readonly items: Item[] = [
    //     {
    //         id: "646546513213",
    //         name: "Item 1",
    //         qty: 100,
    //         description: "This is the first item"
    //     },
    //     {
    //         id: "6465465484651",
    //         name: "Item 2",
    //         qty: 80,
    //         description: "This is the second item"
    //     },
    // ]

    async findAll(): Promise<Item[]> {
        return await this.itemModel.find();
    }

    async findOne(id: string): Promise<Item> {
        return await this.itemModel.findOne({ _id: id });
    }

    async createOne(item: Item): Promise<Item> {
        const newItem = new this.itemModel(item);
        return await newItem.save();
    }

    async deleteOne(id: string): Promise<Item> {
        return await this.itemModel.findByIdAndRemove(id);
    }

    async updateOne(id: string, item: Item): Promise<Item> {
        return await this.itemModel.findByIdAndUpdate(id, item, { new: true });
    }
}
