import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class FoldersService {

constructor( 
    private readonly prisma: PrismaService
){}

async findAllForProject(id: string) {
   return await this.prisma.folder.findMany({
  where: { projectId: id, deletedAt: null },
  orderBy: {name: 'asc'}
});
}

}