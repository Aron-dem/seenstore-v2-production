type TelegramPayload = {
  title: string;
  lines: Array<string | null | undefined>;
};

function escapeTelegram(text: string): string {
  return text.replace(/[<>]/g, "");
}

function getTelegramChatIds(): string[] {
  const raw = process.env["TELEGRAM_CHAT_IDS"] ?? process.env["TELEGRAM_ADMIN_CHAT_IDS"] ?? "";
  return raw
    .split(/[\n,]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function getTelegramToken(): string {
  return process.env["TELEGRAM_BOT_TOKEN"] ?? "";
}

function formatMessage(payload: TelegramPayload): string {
  return [
    payload.title,
    ...payload.lines.filter(Boolean),
  ]
    .map((line) => escapeTelegram(String(line)))
    .join("\n");
}

export async function sendTelegramNotification(payload: TelegramPayload): Promise<void> {
  const token = getTelegramToken();
  const chatIds = getTelegramChatIds();

  if (!token || chatIds.length === 0) return;

  const message = formatMessage(payload);

  await Promise.allSettled(
    chatIds.map(async (chatId) => {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Telegram send failed (${chatId}): ${body}`);
      }
    }),
  );
}

export async function notifyNewOrder(params: {
  orderId: string;
  customerName: string;
  phone: string;
  total: number;
  shippingFee: number;
  items: Array<{ name: string; size: string; color: string; quantity: number }>;
}): Promise<void> {
  const itemLines = params.items.map(
    (item, index) => `${index + 1}) ${item.name} — ${item.size} / ${item.color} ×${item.quantity}`,
  );

  await sendTelegramNotification({
    title: "🛒 طلب جديد — SEENSTORE",
    lines: [
      `Order ID: ${params.orderId}`,
      `Customer: ${params.customerName}`,
      `Phone: ${params.phone}`,
      `Shipping: ${params.shippingFee} EGP`,
      `Total: ${params.total} EGP`,
      "Items:",
      ...itemLines,
    ],
  });
}

export async function notifyNewCustomOrder(params: {
  orderId: string;
  customerName: string;
  phone: string;
  itemType: string;
  size: string;
  color: string;
  details: string;
}): Promise<void> {
  await sendTelegramNotification({
    title: "🎨 طلب تصميم مخصص جديد — SEENSTORE",
    lines: [
      `Order ID: ${params.orderId}`,
      `Customer: ${params.customerName}`,
      `Phone: ${params.phone}`,
      `Item: ${params.itemType}`,
      `Size: ${params.size}`,
      `Color: ${params.color}`,
      `Details: ${params.details}`,
    ],
  });
}
