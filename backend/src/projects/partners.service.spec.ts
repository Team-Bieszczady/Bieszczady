import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { SERIALIZABLE } from '../prisma/transaction-options';
import { PartnersService } from './partners.service';

describe('PartnersService', () => {
  let service: PartnersService;

  const makeClient = () => ({
    partner: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    partnerProject: { deleteMany: jest.fn(), createMany: jest.fn() },
    project: { count: jest.fn() },
    budgetCategory: { count: jest.fn() },
    budgetPosition: { count: jest.fn() },
    projectMember: { count: jest.fn() },
  });

  const tx = makeClient();
  const prisma = { ...makeClient(), $transaction: jest.fn() };

  const row = (overrides: Record<string, unknown> = {}) => ({
    id: 'pa1',
    name: 'Gmina Lutowiska',
    type: 'Samorząd',
    nip: '6881004521',
    city: 'Lutowiska',
    email: '',
    contactName: 'Tomasz Hnat',
    contactEmail: 't.hnat@lutowiska.pl',
    contactPhone: '',
    agreement: 'Porozumienie',
    agreementValidUntil: null,
    status: 'ACTIVE',
    createdAt: new Date('2026-10-01'),
    updatedAt: new Date('2026-10-01'),
    projects: [],
    ...overrides,
  });

  const dataOf = (mock: jest.Mock) =>
    (mock.mock.calls[0] as [{ data: Record<string, unknown> }])[0].data;

  const createDto = {
    name: 'Gmina Lutowiska',
    type: 'Samorząd' as const,
    contactName: 'Tomasz Hnat',
    contactEmail: 't.hnat@lutowiska.pl',
    agreement: 'Porozumienie' as const,
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartnersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(PartnersService);
    prisma.$transaction.mockImplementation(
      (fn: (client: typeof tx) => unknown) => fn(tx),
    );
    tx.partner.findUnique.mockResolvedValue(row());
    tx.partner.create.mockResolvedValue(row());
    tx.partner.update.mockResolvedValue(row());
  });

  describe('findAll', () => {
    it('flattens the project links and returns the date as YYYY-MM-DD', async () => {
      prisma.partner.findMany.mockResolvedValue([
        row({
          agreementValidUntil: new Date('2026-12-31T00:00:00.000Z'),
          projects: [{ project: { id: 'p1', name: 'Solina' } }],
        }),
      ]);

      const [partner] = await service.findAll();

      expect(partner.projects).toEqual([{ id: 'p1', name: 'Solina' }]);
      expect(partner.agreementValidUntil).toBe('2026-12-31');
    });

    it('returns an empty string when the agreement has no expiry', async () => {
      prisma.partner.findMany.mockResolvedValue([row()]);

      const [partner] = await service.findAll();

      expect(partner.agreementValidUntil).toBe('');
    });
  });

  describe('findOne', () => {
    it('is a 404 for a missing partner', async () => {
      prisma.partner.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('refuses a project that does not exist', async () => {
      tx.project.count.mockResolvedValue(1);

      await expect(
        service.create({ ...createDto, projectIds: ['p1', 'p2'] }),
      ).rejects.toThrow(ConflictException);
      expect(tx.partner.create).not.toHaveBeenCalled();
    });

    it('drops the expiry date when there is no agreement', async () => {
      await service.create({
        ...createDto,
        agreement: 'Brak umowy',
        agreementValidUntil: '2026-12-31',
      });

      expect(dataOf(tx.partner.create).agreementValidUntil).toBeNull();
    });

    it('links the projects inside a serializable transaction', async () => {
      tx.project.count.mockResolvedValue(1);

      await service.create({ ...createDto, projectIds: ['p1'] });

      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        SERIALIZABLE,
      );
      expect(dataOf(tx.partner.create).projects).toEqual({
        create: [{ projectId: 'p1' }],
      });
    });
  });

  describe('update', () => {
    it('is a 404 for a missing partner', async () => {
      tx.partner.findUnique.mockResolvedValue(null);

      await expect(service.update('missing', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('replaces the whole set of linked projects', async () => {
      tx.project.count.mockResolvedValue(2);

      await service.update('pa1', { projectIds: ['p2', 'p3'] });

      expect(tx.partnerProject.deleteMany).toHaveBeenCalledWith({
        where: { partnerId: 'pa1' },
      });
      expect(tx.partnerProject.createMany).toHaveBeenCalledWith({
        data: [
          { partnerId: 'pa1', projectId: 'p2' },
          { partnerId: 'pa1', projectId: 'p3' },
        ],
      });
    });

    it('refuses to unlink a project whose budget uses the partner', async () => {
      tx.project.count.mockResolvedValue(1);
      tx.budgetCategory.count.mockResolvedValue(1);

      await expect(
        service.update('pa1', { projectIds: ['p2'] }),
      ).rejects.toThrow(ConflictException);
      expect(tx.partnerProject.deleteMany).not.toHaveBeenCalled();
    });

    it('refuses to unlink a project whose budget position uses the partner', async () => {
      tx.project.count.mockResolvedValue(1);
      tx.budgetPosition.count.mockResolvedValue(1);

      await expect(
        service.update('pa1', { projectIds: ['p2'] }),
      ).rejects.toThrow(ConflictException);
      expect(tx.partnerProject.deleteMany).not.toHaveBeenCalled();
    });

    it('leaves the links alone when projectIds is not sent', async () => {
      await service.update('pa1', { name: 'Nowa nazwa' });

      expect(tx.partnerProject.deleteMany).not.toHaveBeenCalled();
      expect(tx.partnerProject.createMany).not.toHaveBeenCalled();
    });

    it('clears the expiry date when the agreement becomes "Brak umowy"', async () => {
      tx.partner.findUnique.mockResolvedValue(
        row({ agreementValidUntil: new Date('2026-12-31') }),
      );

      await service.update('pa1', { agreement: 'Brak umowy' });

      expect(dataOf(tx.partner.update).agreementValidUntil).toBeNull();
    });

    it('ignores a date sent for a partner without an agreement', async () => {
      tx.partner.findUnique.mockResolvedValue(row({ agreement: 'Brak umowy' }));

      await service.update('pa1', { agreementValidUntil: '2027-01-01' });

      expect(dataOf(tx.partner.update).agreementValidUntil).toBeNull();
    });
  });

  describe('remove', () => {
    it('refuses a partner used by a budget category', async () => {
      tx.budgetCategory.count.mockResolvedValue(1);

      await expect(service.remove('pa1')).rejects.toThrow(ConflictException);
      expect(tx.partner.delete).not.toHaveBeenCalled();
    });

    it('refuses a partner used by a budget position', async () => {
      tx.budgetPosition.count.mockResolvedValue(1);

      await expect(service.remove('pa1')).rejects.toThrow(ConflictException);
      expect(tx.partner.delete).not.toHaveBeenCalled();
    });

    it('refuses a partner linked to a project member', async () => {
      tx.projectMember.count.mockResolvedValue(1);

      await expect(service.remove('pa1')).rejects.toThrow(ConflictException);
      expect(tx.partner.delete).not.toHaveBeenCalled();
    });

    it('removes the project links before the partner', async () => {
      await service.remove('pa1');

      expect(tx.partnerProject.deleteMany).toHaveBeenCalledWith({
        where: { partnerId: 'pa1' },
      });
      expect(
        tx.partnerProject.deleteMany.mock.invocationCallOrder[0],
      ).toBeLessThan(tx.partner.delete.mock.invocationCallOrder[0]);
    });

    it('is a 404 for a missing partner', async () => {
      tx.partner.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(tx.partner.delete).not.toHaveBeenCalled();
    });
  });
});
