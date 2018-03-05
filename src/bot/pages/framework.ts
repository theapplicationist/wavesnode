import * as TelegramBot from 'node-telegram-bot-api'
import { Message, User, CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup } from 'node-telegram-bot-api'
import { IDictionary } from '../../generic/IDictionary';

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

interface IButtonResult {
  navigate?: string
  close?: boolean
  notify?: string
  update?: boolean
  promt?: { Id: string, text: string, data: any }
}

type ButtonAction<T> = (context: IPageContext, data: T) => Promise<IButtonResult>
type AddButton = <T>(action: ButtonAction<T>, text: string, data?: T) => void

export const close: IButtonResult = { close: true }
export const update: IButtonResult = { update: true }
export const notify = (notify: string): IButtonResult => ({ notify })
export const navigate = (page: Page): IButtonResult => ({ navigate: page.name })
export const promt = <T>(promt: Promt<T>, text: string, data?: T): IButtonResult => ({ promt: { Id: promt.name, data, text } })

export type Page = (context: IPageContext, addButton: AddButton) => Promise<string>
export type Promt<T> = (user: User, data: T, response: string) => void
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

  const { encode, decode } = objToStringEncoderDecoder

  const getPage = (pageId: string) => pages[pageId]

  bot.on('message', async (msg: Message) => {
    if (msg.reply_to_message) {
      const r = await kvStorage.get<{ id, data }>(msg.reply_to_message.message_id.toString())
      if (r) {
        promts[r.id](msg.from, r.data, msg.text)
      }
    }
  })

  bot.on('callback_query', async (callback_query: CallbackQuery) => {
    const d = decode<CallbackQueryData>(callback_query.data)
    const context = { user: callback_query.from }

    let answer = ''

    const action = actions[d.actionId]
    if (action) {
      const r = await action({ user: callback_query.from }, d.data)
      const buttonResult: IButtonResult[] = !(<[any]>r).length ? [<IButtonResult>r] : <IButtonResult[]>r

      buttonResult.forEach(async result => {
        if (result.close) {
          bot.deleteMessage(callback_query.message.chat.id, callback_query.message.message_id.toString())
        }
        if (result.navigate) {
          updatePage(callback_query.message, callback_query.from, result.navigate)
        }
        if (result.update) {
          updatePage(callback_query.message, callback_query.from, d.pageId)
        }
        if (result.promt) {
          const r = await bot.sendMessage(callback_query.message.chat.id, result.promt.text, { reply_markup: { force_reply: true } }) as Message
          await kvStorage.set(r.message_id.toString(), { id: result.promt.Id, data: result.promt.data })
        }
        if (result.notify) {
          answer = result.notify
        }
      })
    }
    bot.answerCallbackQuery({ callback_query_id: callback_query.id, text: answer })
  })

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
      console.log(callback.length)
      buttons.push({ text, callback })
    }
    const text = await page(context, addButton)
    const replyMarkup = prepareReplyMarkup(buttons)

    return { text, replyMarkup }
  }

  const updatePage = async (message: Message, user: User, pageId: string) => {
    const { text, replyMarkup } = await buildPage({ user }, pages[pageId])
    bot.editMessageText(text, { chat_id: message.chat.id, message_id: message.message_id, reply_markup: replyMarkup })
  }

  const showPage = async (chatId: string | number, user: User, page: Page) => {
    const { text, replyMarkup } = await buildPage({ user }, page)
    bot.sendMessage(chatId, text, { reply_markup: replyMarkup })
  }

  return { showPage }
}
