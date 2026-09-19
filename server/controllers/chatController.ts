import { Request, Response } from 'express';
import * as chatService from '../services/chatService.js';
import { ApiResponse, ChatResponseData } from '../types/index.js';

export async function askChatbot(
  req: Request<Record<string, unknown>, ApiResponse<ChatResponseData>, { message?: string }>,
  res: Response<ApiResponse<ChatResponseData>>
): Promise<void> {
  try {
    const { message } = req.body;
    if (!message || message.trim() === '') {
      res.status(400).json({ success: false, message: 'Nội dung tin nhắn không được để trống' });
      return;
    }
    const responseData = await chatService.processUserMessage(message);
    res.json({
      success: true,
      data: responseData,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi khi xử lý phản hồi chatbot';
    res.status(500).json({ success: false, message });
  }
}
