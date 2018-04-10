import * as TelegramBot from 'node-telegram-bot-api'
import { Message, User, CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup } from 'node-telegram-bot-api'
import { IDictionary } from '../../generic/IDictionary'
import { randomBytes } from 'crypto'

type InlineButton = () => Promise<IButtonResult | IButtonResult[]>
interface Button {
  text: string,
  action: InlineButton
}

interface IPage {
  text: string,
  buttons: Button[]
}

export interface IContext<T> {
  user: User
  data?: T
}

export interface IButtonResult {
  data?: any
  navigate?: string
  close?: boolean
  notify?: string
  update?: 'redraw' | 'update'
  promt?: { Id: string, text: string, data: any }
}

export type AddButton = <T>(action: ButtonAction<T>, text: string, data?: T) => PageCreationCommands
export type LineBreak = () => PageCreationCommands

export type PageCreationCommands = {
  add: AddButton
  lineBreak: LineBreak
}

export type ButtonAction<T> = (context: IContext<T>) => Promise<IButtonResult>

export const close: IButtonResult = { close: true }
export const update: IButtonResult = { update: 'update' }
export const notify = (notify: string): IButtonResult => ({ notify })
export const updateAndNotify = (notify: string): IButtonResult => ({ update: 'update', notify })
export const navigate = <T>(page: Page<T>, data?: T): IButtonResult => ({ navigate: page.name, data })
export const promt = <T>(promt: Promt<T>, text: string, data?: T): IButtonResult => ({ promt: { Id: promt.name, data, text } })

export type Page<T> = (context: IContext<T>, commands: PageCreationCommands) => Promise<string>
export type Promt<T> = (context: IContext<T>, response: string) => Promise<IButtonResult>
export type KeyValueStorage = {
  get: <T>(key: string, remove: boolean) => Promise<{ key: string, value: T } | undefined>
  insert: <T>(key: string, value: T) => Promise<boolean>
  update: <T>(key: string, value: T, insertIfNotExists: boolean) => Promise<boolean>
}

export type ObjToStringEncoderDecoder = { encode: <T>(obj: T) => string, decode: <T>(str: string) => T }

export const menu = (bot: TelegramBot,
  pages: IDictionary<Page<any>>,
  promts: IDictionary<Promt<any>>,
  actions: IDictionary<ButtonAction<any>>,
  kvStorage: KeyValueStorage) => {

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

  const encode = <T>(obj: T): string => JSON.stringify(obj)
  const decode = <T>(value: string): T => JSON.parse(value)

  const getPage = (pageId: string) => pages[pageId]

  bot.on('message', async (msg: Message) => {
    if (msg.reply_to_message) {
      const kv = await kvStorage.get<PromtData>(msg.reply_to_message.message_id.toString(), false)
      if (!kv)
        return
      const promtData = kv.value
      if (promtData) {
        const result = await promts[promtData.promtId]({ user: msg.from, data: promtData.data }, msg.text)
        result.update = result.update ? 'redraw' : undefined
        const answer = await handleButtonResult(result, msg.from, promtData.chatId, promtData.messageId, promtData.pageId)
        if (answer) {
          redrawPage(promtData.chatId, promtData.messageId, msg.from, promtData.pageId, answer)
        }
      }
    }
  })

  bot.on('callback_query', async (cq: CallbackQuery) => {
    const kv = await kvStorage.get<string>(cq.data, false)
    if (!kv)
      return
    const data = kv.value
    const d = decode<CallbackQueryData>(data)
    const context = { user: cq.from }

    let answers: Promise<string>[]

    const action = actions[d.actionId]
    if (action) {
      const r = await action({ user: cq.from, data: d.data })
      const buttonResult: IButtonResult[] = !(<[any]>r).length ? [<IButtonResult>r] : <IButtonResult[]>r

      answers = buttonResult.map(async result =>
        handleButtonResult(result,
          cq.from,
          cq.message.chat.id.toString(),
          cq.message.message_id.toString(),
          d.pageId)
      )
    }

    if (answers) {
      const answer = (await Promise.all(answers))[0]
      bot.answerCallbackQuery({ callback_query_id: cq.id, text: answer })
    }
    else {
      bot.answerCallbackQuery({ callback_query_id: cq.id })
    }
  })

  const handleButtonResult = async (result: IButtonResult, user: User, chatId: string, messageId: string, pageId: string) => {
    if (result.close) {
      bot.deleteMessage(chatId, messageId)
    }
    if (result.navigate) {
      updatePage(chatId, messageId, user, result.navigate, undefined, result.data)
    }
    if (result.update) {
      if (result.update == 'update')
        updatePage(chatId, messageId, user, pageId, undefined, result.data)
      else
        redrawPage(chatId, messageId, user, pageId)
    }
    if (result.promt) {
      const r = await bot.sendMessage(chatId, result.promt.text, { reply_markup: { force_reply: true } }) as Message
      await kvStorage.update<PromtData>(r.message_id.toString(), {
        pageId,
        messageId,
        chatId,
        promtId: result.promt.Id,
        data: result.promt.data
      }, true)
    }
    if (result.notify) {
      return result.notify
    }

    return ''
  }

  const buildPage = async <T>(context: IContext<T>, page: Page<T>) => {
    const pageId = page.name
    const buttons: { text: string, callback: string }[][] = []
    let current = []
    buttons.push(current)
    const add: AddButton = <F>(action: ButtonAction<F>, text: string, data?: F) => {
      const callback = encode(<CallbackQueryData>{ pageId, actionId: action.name, data })
      current.push({ text, callback })
      return commands
    }

    const lineBreak: LineBreak = () => {
      current = []
      buttons.push(current)
      return commands
    }

    const commands: PageCreationCommands = {
      add,
      lineBreak
    }

    const text = await page(context, commands)
    const replyMarkup: TelegramBot.InlineKeyboardMarkup = {

      inline_keyboard: buttons.filter(b => b.length > 0).map(btns => btns.map(v => {
        const c = randomBytes(10).toString('base64')
        kvStorage.update(c, v.callback, true)
        return {
          text: v.text,
          callback_data: c
        }
      }))
    }

    return { text, replyMarkup }
  }

  const updatePage = async (chatId: string, messageId: string, user: User, pageId: string, notification: string = '', data: any = undefined) => {
    const { text, replyMarkup } = await buildPage({ user, data }, pages[pageId])
    const options = {
      chat_id: chatId,
      message_id: parseInt(messageId),
      reply_markup: replyMarkup,
      parse_mode: 'Markdown',
    }

    const finalText = notification.length > 0 ? `\`${notification}\`  ` + text : text

    bot.editMessageText(finalText, options)
  }

  const redrawPage = async (chatId: string, messageId: string, user: User, pageId: string, notification: string = '') => {
    bot.deleteMessage(chatId, messageId)
    showPage(chatId, user, pages[pageId], notification)
  }

  const showPage = async <T>(chatId: string | number, user: User, page: Page<T>, notification: string = '', data: T = undefined) => {
    const { text, replyMarkup } = await buildPage({ user, data }, page)

    const options: TelegramBot.SendMessageOptions = {
      reply_markup: replyMarkup,
      parse_mode: 'Markdown',
    }

    const finalText = notification.length > 0 ? `\`${notification}\`  ` + text : text

    const msg = <Message>(await bot.sendMessage(chatId, finalText, options))

    return msg
  }

  return { showPage }
}
