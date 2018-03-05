import * as TelegramBot from 'node-telegram-bot-api'
import { Message, User, CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup } from 'node-telegram-bot-api'
import { IDictionary } from '../../generic/IDictionary';
import { randomBytes } from 'crypto';

type InlineButton = () => Promise<IButtonResult | IButtonResult[]>
interface Button {
  text: string,
  action: InlineButton
}

interface IPage {
  text: string,
  buttons: Button[]
}

interface IPageContext {
  user: User
}

export interface IButtonResult {
  navigate?: string
  close?: boolean
  notify?: string
  update?: boolean
  promt?: { Id: string, text: string, data: any }
}

export type ButtonAction<T> = (context: IPageContext, data: T) => Promise<IButtonResult>
export type AddButton = <T>(action: ButtonAction<T>, text: string, data?: T) => void

export const close: IButtonResult = { close: true }
export const update: IButtonResult = { update: true }
export const notify = (notify: string): IButtonResult => ({ notify })
export const navigate = (page: Page): IButtonResult => ({ navigate: page.name })
export const promt = <T>(promt: Promt<T>, text: string, data?: T): IButtonResult => ({ promt: { Id: promt.name, data, text } })

export type Page = (context: IPageContext, addButton: AddButton) => Promise<string>
export type Promt<T> = (user: User, data: T, response: string) => Promise<IButtonResult>
export type KeyValueStorage = { get: <T>(key: string) => Promise<T>, set: <T>(key: string, value: T) => Promise<void> }
export type ObjToStringEncoderDecoder = { encode: <T>(obj: T) => string, decode: <T>(str: string) => T }

export const menu = (bot: TelegramBot,
  pages: IDictionary<Page>,
  promts: IDictionary<Promt<any>>,
  actions: IDictionary<ButtonAction<any>>,
  kvStorage: KeyValueStorage,
  objToStringEncoderDecoder: ObjToStringEncoderDecoder) => {

  interface CallbackQueryData {
    pageId: string,
    actionId: string,
    data: any
  }

  interface PromtData {
    chatId: string,
    messageId: string,
    pageId: string,
    promtId: string,
    data: any
  }

  const { encode, decode } = objToStringEncoderDecoder

  const getPage = (pageId: string) => pages[pageId]

  bot.on('message', async (msg: Message) => {
    if (msg.reply_to_message) {
      const promtData = await kvStorage.get<PromtData>(msg.reply_to_message.message_id.toString())
      if (promtData) {
        const result = await promts[promtData.promtId](msg.from, promtData.data, msg.text)
        handleButtonResult(result, msg.from, promtData.chatId, promtData.messageId, promtData.pageId)
      }
    }
  })

  bot.on('callback_query', async (cq: CallbackQuery) => {
    const data = await kvStorage.get<string>(cq.data)
    const d = decode<CallbackQueryData>(data)
    const context = { user: cq.from }

    let answer = ''

    const action = actions[d.actionId]
    if (action) {
      const r = await action({ user: cq.from }, d.data)
      const buttonResult: IButtonResult[] = !(<[any]>r).length ? [<IButtonResult>r] : <IButtonResult[]>r

      buttonResult.forEach(async result => {
        answer = await handleButtonResult(result,
          cq.from,
          cq.message.chat.id.toString(),
          cq.message.message_id.toString(),
          d.pageId)
      })
    }
    bot.answerCallbackQuery({ callback_query_id: cq.id, text: answer })
  })

  const handleButtonResult = async (result: IButtonResult, user: User, chatId: string, messageId: string, pageId: string) => {
    if (result.close) {
      bot.deleteMessage(chatId, messageId)
    }
    if (result.navigate) {
      updatePage(chatId, messageId, user, result.navigate)
    }
    if (result.update) {
      redrawPage(chatId, messageId, user, pageId)
    }
    if (result.promt) {
      const r = await bot.sendMessage(chatId, result.promt.text, { reply_markup: { force_reply: true } }) as Message
      await kvStorage.set<PromtData>(r.message_id.toString(), {
        pageId,
        messageId,
        chatId,
        promtId: result.promt.Id,
        data: result.promt.data
      })
    }
    if (result.notify) {
      return result.notify
    }

    return ''
  }

  const prepareReplyMarkup = (buttons: { text: string, callback: string }[]): InlineKeyboardMarkup => (
    {
      inline_keyboard: [
        buttons.map(v => ({
          text: v.text,
          callback_data: v.callback
        }))
      ]
    }
  )

  const buildPage = async (context: IPageContext, page: Page) => {
    const pageId = page.name

    const buttons: { text: string, callback: string }[] = []
    const addButton: AddButton = <T>(action: ButtonAction<T>, text: string, data?: T) => {
      const callback = objToStringEncoderDecoder.encode(<CallbackQueryData>{ pageId, actionId: action.name, data })
      buttons.push({ text, callback })
    }

    const text = await page(context, addButton)
    const replyMarkup = {
      inline_keyboard: [
        buttons.map(v => {
          const c = randomBytes(10).toString('base64')
          kvStorage.set(c, v.callback)
          return {
            text: v.text,
            callback_data: c
          }
        })
      ]
    }

    return { text, replyMarkup }
  }

  const updatePage = async (chatId: string, messageId: string, user: User, pageId: string) => {
    const { text, replyMarkup } = await buildPage({ user }, pages[pageId])
    bot.editMessageText(text, { chat_id: chatId, message_id: parseInt(messageId), reply_markup: replyMarkup })
  }

  const redrawPage = async (chatId: string, messageId: string, user: User, pageId: string) => {
    bot.deleteMessage(chatId, messageId)
    showPage(chatId, user, pages[pageId])
  }

  const showPage = async (chatId: string | number, user: User, page: Page) => {
    const { text, replyMarkup } = await buildPage({ user }, page)
    bot.sendMessage(chatId, text, { reply_markup: replyMarkup })
  }

  return { showPage }
}
