import { Test, TestingModule } from '@nestjs/testing';
import { StageCompletionService } from './stage-completion.service';

describe('StageCompletionService', () => {
  let service: StageCompletionService;

  const tx = {
    stage: { findUnique: jest.fn(), update: jest.fn() },
    task: { count: jest.fn() },
  };

  const withTasks = (total: number, pending: number) => {
    tx.task.count.mockResolvedValueOnce(total).mockResolvedValueOnce(pending);
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [StageCompletionService],
    }).compile();

    service = module.get(StageCompletionService);
  });

  it('closes a stage once every task is done', async () => {
    tx.stage.findUnique.mockResolvedValue({ id: 's1', completedAt: null });
    withTasks(3, 0);

    await service.settle(tx as never, ['s1']);

    expect(tx.stage.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { completedAt: expect.any(Date) as Date },
    });
  });

  it('reopens a stage that is no longer complete', async () => {
    tx.stage.findUnique.mockResolvedValue({
      id: 's1',
      completedAt: new Date('2026-01-01'),
    });
    withTasks(3, 1);

    await service.settle(tx as never, ['s1']);

    expect(tx.stage.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { completedAt: null },
    });
  });

  it('keeps a stage open while a task is blocked', async () => {
    tx.stage.findUnique.mockResolvedValue({ id: 's1', completedAt: null });
    withTasks(2, 1);

    await service.settle(tx as never, ['s1']);

    expect(tx.stage.update).not.toHaveBeenCalled();
  });

  it('never closes an empty stage', async () => {
    tx.stage.findUnique.mockResolvedValue({ id: 's1', completedAt: null });
    tx.task.count.mockResolvedValueOnce(0);

    await service.settle(tx as never, ['s1']);

    expect(tx.stage.update).not.toHaveBeenCalled();
  });

  it('reopens a closed stage whose tasks have all been removed', async () => {
    tx.stage.findUnique.mockResolvedValue({
      id: 's1',
      completedAt: new Date('2026-01-01'),
    });
    tx.task.count.mockResolvedValueOnce(0);

    await service.settle(tx as never, ['s1']);

    expect(tx.stage.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { completedAt: null },
    });
  });

  it('writes nothing when the state already matches', async () => {
    tx.stage.findUnique.mockResolvedValue({
      id: 's1',
      completedAt: new Date('2026-01-01'),
    });
    withTasks(2, 0);

    await service.settle(tx as never, ['s1']);

    expect(tx.stage.update).not.toHaveBeenCalled();
  });

  it('settles each stage once, ignoring duplicates and nulls', async () => {
    tx.stage.findUnique.mockResolvedValue({ id: 's1', completedAt: null });
    withTasks(1, 1);

    await service.settle(tx as never, ['s1', 's1', null, undefined]);

    expect(tx.stage.findUnique).toHaveBeenCalledTimes(1);
  });

  it('does nothing when given no stages', async () => {
    await service.settle(tx as never, []);

    expect(tx.stage.findUnique).not.toHaveBeenCalled();
  });

  it('skips a stage that has since been deleted', async () => {
    tx.stage.findUnique.mockResolvedValue(null);

    await service.settle(tx as never, ['gone']);

    expect(tx.task.count).not.toHaveBeenCalled();
    expect(tx.stage.update).not.toHaveBeenCalled();
  });
});
