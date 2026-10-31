import type { Request, Response } from 'express';
import { resolveChatOwner } from '../middleware/chatIdentity.js';
import { createChatService, type ChatService } from '../services/chatService.js';
import { ChatError, UUID_PATTERN } from '../types/chat.js';

function uuid(value: unknown): string {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) throw new ChatError(400, 'Mã hội thoại hoặc tin nhắn không hợp lệ.');
  return value;
}
export function createChatController(service: ChatService = createChatService(), identity = resolveChatOwner) {
  function handle(action: (req: Request, res: Response) => Promise<unknown>, status = 200) {
    return async (req: Request, res: Response): Promise<void> => {
      res.setHeader('Cache-Control', 'no-store');
      try {
        if (req.get('sec-fetch-site') === 'cross-site') throw new ChatError(403, 'Yêu cầu chat phải đến từ website NutriMate.');
        const origin = req.get('origin');
        if (origin && origin !== `${req.protocol}://${req.get('host')}`) throw new ChatError(403, 'Nguồn yêu cầu chat không hợp lệ.');
        const data = await action(req, res);
        res.status(status).json({ success: true, data });
      } catch (error) {
        res.status(error instanceof ChatError ? error.status : 503).json({
          success: false,
          message: error instanceof ChatError ? error.message : 'Chưa truy cập được dữ liệu hội thoại. Vui lòng thử lại sau.',
        });
      }
    };
  }
  return {
    session: handle(async (req, res) => {
      const owner = await identity(req, res, true);
      return { kind: owner.userId === null ? 'guest' : 'customer', created: res.hasHeader('Set-Cookie') };
    }),
    create: handle(async (req, res) => service.create(await identity(req, res, true)), 201),
    list: handle(async (req, res) => service.list(await identity(req, res))),
    history: handle(async (req, res) => {
      const owner = await identity(req, res);
      const before = req.query.before;
      if (before !== undefined && (typeof before !== 'string' || !/^[1-9]\d{0,17}$/.test(before))) throw new ChatError(400, 'Mốc lịch sử không hợp lệ.');
      const id = uuid(req.params.id);
      return { conversationId: id, messages: await service.history(id, owner, before as string | undefined) };
    }),
    ask: handle(async (req, res) => {
      const owner = await identity(req, res);
      return service.ask(owner, uuid(req.params.id || req.body?.conversationId), uuid(req.body?.requestId), req.body?.message);
    }),
  };
}
